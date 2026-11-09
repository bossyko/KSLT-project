// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-TEMA: светлая тема приложения — вид, выбор и планка (08.11).
 *
 * ПОЧЕМУ ЭТА ПРОБА ЕСТЬ. Светлая тема уже была и была снята 07.11: шесть
 * правил спорили с зашитыми красками, а глаз на разделах никто не
 * проводил. Запись в `css/app.css` тогда и гласила:
 * ТЕМА, КОТОРУЮ НИКТО НЕ СМОТРЕЛ ГЛАЗАМИ, — ЭТО НЕ ТЕМА, А ОБЕЩАНИЕ.
 *
 * ЧТО ДЕРЖИТ СТОРОЖ, А ЧТО ЭТА ПРОБА. `check-svetlaya-tema-prilozheniya.js`
 * читает файлы как текст: он видит, что блок темы не трогает краски
 * палитры, что у логотипа две редакции, что положений три. Он НЕ видит,
 * ЧТО ВЫШЛО НА ЭКРАНЕ. Ровно на этом кусок и попался трижды за день:
 *   · `--on-image` протёк через краску — белые подписи поверх фотографии
 *     стали чёрными на чёрном, и нашёл это ЗАМЕР, а не чтение;
 *   · таб-бар остался чёрным при чернильных подписях;
 *   · логотип — краска внутри `.svg`, которой css-приборы не видят вовсе.
 * РАЗМЕТКА НЕ ДОКАЗЫВАЕТ ВИД.
 *
 * ГЛАВНОЕ ЧИСЛО: контраст меряется в БРАУЗЕРЕ и против ФАКТИЧЕСКОГО фона
 * — вверх по предкам до первого непрозрачного, с наложением альф. Роль
 * может быть верной, а текст лежать на другом фоне, чем думал автор.
 *
 * ПЯТЬ ВИДОВ дают проекты `playwright.config.js` — свой `viewport` проба
 * не ставит: ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ.
 *
 * БАЗУ ПРОБА НЕ ТРОГАЕТ: она читает цвета и переключает тему, ничего не
 * отправляя.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

/* ПЛАНКА ВЗЯТА У APPLE, А НЕ ВЫДУМАНА: «Sufficient Contrast» в критериях
   доступности App Store — 4.5 для текста, 3 для нетекстовых элементов и
   крупного текста, проверять в СВЕТЛОМ И ТЁМНОМ режиме. */
const ПЛАНКА_ТЕКСТ = 4.5;

/** Открыть приложение в названной теме и дождаться, что дом её применил.
 *
 *  ИНИТ-СКРИПТ ВЫПОЛНЯЕТСЯ НА КАЖДОЙ ЗАГРУЗКЕ, А НЕ ОДИН РАЗ. Первая
 *  редакция ставила им тему и на этом же споткнулась: проба «выбор
 *  переживает перезапуск» переключала тему, перезагружала страницу — и
 *  инит-скрипт ПЕРЕЗАПИСЫВАЛ выбор обратно. Падала проба, а не код:
 *  замер показал, что `setTheme('light')` записал `light`, а следующая
 *  загрузка вернула `dark`.
 *  ПРОБА, КОТОРАЯ САМА МЕНЯЕТ ТО, ЧТО ПРОВЕРЯЕТ, ПРОВЕРЯЕТ СЕБЯ.
 *  Поэтому `разовый` даёт поставить выбор ОДИН раз — для проб, которые
 *  потом сами им распоряжаются. */
async function открыть(page, тема, разовый) {
    if (разовый) {
        /* Кладём выбор прямо в хранилище страницы, до первой загрузки
           приложения, и больше в него не вмешиваемся. */
        await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
        await page.evaluate(т => { try { localStorage.setItem('kslt-tema', т); } catch (e) {} }, тема);
    } else {
        await page.addInitScript(т => {
            try { localStorage.setItem('kslt-tema', т); } catch (e) {}
        }, тема);
    }
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    /* ПРИЗНАК, А НЕ ТИШИНА СЕТИ: ждём, что дом темы уже отработал. */
    await page.waitForFunction(
        т => document.documentElement.getAttribute('data-theme') === т,
        тема, { timeout: 20000 });
    /* Знакомство и сплэш лежат поверх всего; без этого все экраны
       снимались бы одинаковыми — на это уже попался прибор снимков. */
    for (let i = 0; i < 3; i++) {
        const к = page.locator('.onb-skip:visible').first();
        if (!(await к.count())) break;
        await к.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
    }
    await page.evaluate(() => {
        ['.onb-overlay', '.splash-overlay', '#onboarding'].forEach(s =>
            document.querySelectorAll(s).forEach(э => { э.style.display = 'none'; }));
    });
}

async function показатьЭкран(page, имя) {
    await page.evaluate(и => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const э = document.getElementById(и);
        if (э) э.classList.add('active');
        window.scrollTo(0, 0);
    }, имя);
    await page.waitForTimeout(250);
}

/* Замер контраста живёт одной строкой-функцией: её текст уезжает в
   браузер, и ссылки на внешние имена там не работают. */
/* ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: счёт контраста живёт в
 * `tools/kontrast.mjs` и больше нигде. Своя копия формулы здесь подняла
 * число копий с 43 до 45 и уронила `check-odin-schyot-kontrasta`:
 * ХРАПОВИК ИДЁТ ТОЛЬКО ВНИЗ, потолок под новую копию не поднимается.
 * Поля приводятся к тем, которыми печатается список ниже. */
/* ПОЛЕ НАЗЫВАЕТСЯ `худшие`, А НЕ `ниже` — Я НАЗВАЛ ЕГО ПО ПАМЯТИ, НЕ ПРОЧИТАВ
 * ВОЗВРАТ, и десять проб упали на `undefined.map`, а не на контрасте. Модуль
 * отдаёт `нижеНормы` (число) и `худшие` (список, обрезанный доводом). Довод
 * 99 значит «отдай все», а не «девяносто девять узлов».
 * ОТСУТСТВИЕ ПОЛЯ — ЭТО ВНЯТНАЯ БЕДА, А НЕ TypeError: проверяем вид ответа. */
const ЗАМЕР = async page => {
    const р = await page.evaluate(
        async () => (await import('/tools/kontrast.mjs')).замер(99));
    if (!Array.isArray(р.худшие)) {
        throw new Error('модуль контраста отдал не то: ключи ' + Object.keys(р).join(', '));
    }
    if (р.худшие.length !== р.нижеНормы) {
        throw new Error('список худших короче счёта: ' + р.худшие.length + ' против ' + р.нижеНормы);
    }
    return р.худшие.map(о => ({
        узел: о.путь, текст: о.текст, к: о.контраст, порог: о.порог, кегль: о.кегль,
    }));
};

const ЭКРАНЫ = ['screenHome', 'screenTournaments', 'screenRating', 'screenNews', 'screenProfile'];

test.describe('светлая тема приложения', () => {

    /* ТЕМЫ ДВЕ, И ПЛАНКА У НИХ ОДНА. Проверять только светлую значило бы
       не заметить, что правка ради неё уронила тёмную, — так и вышло
       07.11, когда светлая тема сама стала бедой. */
    for (const тема of ['light', 'dark']) {
        test(`${тема}: ни одна надпись не ниже планки на пяти экранах`, async ({ page }) => {
            await открыть(page, тема);

            const всеБеды = [];
            for (const экран of ЭКРАНЫ) {
                await показатьЭкран(page, экран);
                const беды = await ЗАМЕР(page);
                беды.forEach(б => всеБеды.push({ ...б, экран: экран.replace('screen', '') }));
            }

            const список = всеБеды.map(б =>
                `  ${б.экран}: ${б.узел} «${б.текст}» — ${б.к} при планке ${б.порог} (${б.кегль}px)`
            ).join('\n');
            expect(всеБеды.length,
                `надписи ниже планки WCAG в теме «${тема}»:\n${список}`).toBe(0);
        });
    }

    /* СЛОЙ ПОВЕРХ ФОТОГРАФИИ ТЕМЫ НЕ ЗНАЕТ. Это и была беда 07.11, и она
       же вернулась 08.11 через переопределённую краску палитры. Правило
       в сторожe читает файл; здесь проверяется, что на ЭКРАНЕ подписи
       заглавного блока остались светлыми в обеих темах. */
    test('подписи поверх фотографии остаются светлыми в обеих темах', async ({ page }) => {
        const цвета = {};
        for (const тема of ['light', 'dark']) {
            await открыть(page, тема);
            await показатьЭкран(page, 'screenHome');
            цвета[тема] = await page.evaluate(() => {
                const к = (и) => getComputedStyle(document.documentElement)
                    .getPropertyValue(и).trim();
                return { наФото: к('--on-image'), вторичный: к('--on-image-sec'),
                         акцент: к('--on-image-accent') };
            });
        }
        expect(цвета.light, 'слой поверх фотографии поехал за темой')
            .toEqual(цвета.dark);
        expect(цвета.light.наФото.toLowerCase(),
            'подписи поверх фотографии перестали быть светлыми')
            .toMatch(/#f{3,6}|255/);
    });

    /* ПОДЛОЖКА ОКНА ОСТАЁТСЯ ТЁМНОЙ. Вуаль и подложка выглядят
       одинаково и ведут себя противоположно: первая обязана
       перевернуться, вторая — остаться. */
    test('подложка окна в светлой теме остаётся тёмной', async ({ page }) => {
        await открыть(page, 'light');
        const темнее = await page.evaluate(() => {
            const з = getComputedStyle(document.documentElement)
                .getPropertyValue('--scrim-dialog').trim();
            const ч = (з.match(/[\d.]+/g) || []).map(Number);
            /* Тёмная подложка: все три канала ниже середины. */
            return ч.length >= 3 && ч[0] < 128 && ч[1] < 128 && ч[2] < 128;
        });
        expect(темнее, 'подложка окна стала светлой — окно перестанет отделяться').toBe(true);
    });

    /* ВЫБОР — СВОЙСТВО ЧЕЛОВЕКА, А НЕ ЭКРАНА, и он переживает перезагрузку. */
    test('выбор темы хранится и переживает перезапуск', async ({ page }) => {
        /* РАЗОВЫЙ ВЫБОР: дальше проба распоряжается им сама, и никакой
           инит-скрипт не должен вмешиваться в перезагрузку. */
        await открыть(page, 'dark', true);
        await page.evaluate(() => window.KSLT_APP.setTheme('light'));
        await page.waitForFunction(
            () => document.documentElement.getAttribute('data-theme') === 'light',
            null, { timeout: 5000 });

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(
            () => document.documentElement.getAttribute('data-theme') === 'light',
            null, { timeout: 20000 });
        expect(await page.evaluate(() => window.KSLT_APP.getTheme()),
            'после перезапуска выбор потерялся').toBe('light');
    });

    /* ХРАНИМ ВЫБОР, А НЕ ИТОГ. Записать вычисленное `dark` значило бы
       запомнить сегодняшнюю погоду вместо желания: завтра человек
       переключит телефон, а приложение за ним не пойдёт. */
    test('выбор «система» хранится словом «система», а не её итогом', async ({ page }) => {
        await открыть(page, 'light');
        await page.evaluate(() => window.KSLT_APP.setTheme('system'));
        expect(await page.evaluate(() => window.KSLT_APP.getTheme()),
            'вместо выбора сохранён его сегодняшний итог').toBe('system');
        /* А на экране при этом стоит одна из двух настоящих тем. */
        const на = await page.evaluate(() =>
            document.documentElement.getAttribute('data-theme'));
        expect(['light', 'dark'], 'системный выбор не развернулся в тему').toContain(на);
    });

    /* КРАСКА, СПРЯТАННАЯ В КАРТИНКЕ, ТЕМЕ НЕ ПОДЧИНЯЕТСЯ — поэтому
       редакций знака две, и подмена проверяется на живом узле. */
    test('логотип в светлой теме подменяется на светлую редакцию', async ({ page }) => {
        await открыть(page, 'light');
        const св = await page.evaluate(() => {
            const э = document.querySelector('.header-logo-img');
            if (!э) return null;
            const c = getComputedStyle(э);
            return { content: c.content, filter: c.filter };
        });
        expect(св, 'логотипа в шапке нет вовсе').not.toBeNull();
        expect(св.content, 'светлая редакция знака не подставлена')
            .toContain('kslt-logo-light.svg');
        expect(св.filter, 'лаймовое свечение осталось на светлом фоне')
            .toBe('none');

        await открыть(page, 'dark');
        const тм = await page.evaluate(() => {
            const э = document.querySelector('.header-logo-img');
            return э ? getComputedStyle(э).content : null;
        });
        expect(тм, 'тёмная тема тоже получила светлую редакцию знака')
            .not.toContain('kslt-logo-light.svg');
    });

    /* ОБВОДКА ФОКУСА ВИДНА — ЭТО ПЛАНКА, А НЕ ВКУС. На белом лайм даёт
       1.18: человек с клавиатурой не знал бы, где стоит. */
    test('обводка фокуса видна в светлой теме', async ({ page }) => {
        await открыть(page, 'light');
        /* ТА ЖЕ ЕДИНСТВЕННАЯ ФОРМУЛА: `раз` понимает и #hex, и rgb(),
           `контраст` считает. Своей копии у пробы нет. */
        const к = await page.evaluate(async () => {
            const м = await import('/tools/kontrast.mjs');
            const ст = getComputedStyle(document.documentElement);
            const краска = имя => м.раз(ст.getPropertyValue(имя).trim());
            return м.контраст(краска('--accent-text'), краска('--bg-card'));
        });
        /* Планка нетекстового элемента — 3; наш запас посчитан на 7. */
        expect(к, 'акцентный цвет в светлой теме не виден на карточке')
            .toBeGreaterThanOrEqual(3);
    });

    /* ВЕРСИИ ПОДНЯТЫ. Правка, не доехавшая до стенда, — это правка,
       которой нет: на этом кусок попадался дважды за день. */
    test('версии одежды и дома темы подняты на странице', async ({ page }) => {
        await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
        const версии = await page.evaluate(() =>
            [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')]
                .map(э => (э.getAttribute('href') || э.getAttribute('src')))
                .filter(s => /tokens\.css|app\.css|js\/app\.js/.test(s)));
        expect(версии.length, 'на странице нет версий токенов, одежды или дома').toBe(3);
        версии.forEach(в => {
            expect(в, `версия не проставлена: ${в}`).toMatch(/\?v=\d+$/);
        });
    });
});
