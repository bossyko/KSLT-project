/**
 * СТРАНИЦА МАТЧА `pages/live-match*.html` — доска 447:9, решения Кости 24.09.
 *
 * Что проверяется и почему именно так:
 *
 *  · ОДНА РАМКА У СТРАНИЦЫ. Было три левых края на одном экране: шапка и
 *    подвал на --pad-x (28 на 1280, 16 на 390), а содержимое на 110 и на 12.
 *    Ни одно правило заморозки этого не видело — она читает файл как текст и
 *    не видит того, что происходит МЕЖДУ кусками. Видит только браузер.
 *  · ЛЕСТНИЦА ЦИФР. До 24.09 имя игрока, счёт сета и очки были все трое 16.
 *    Тест меряет ОТНОШЕНИЕ в пикселях: очки > сет > имя на каждом виде.
 *  · СТРАНИЦА НАЗЫВАЕТ МАТЧ. Заголовка не было вовсе: первым заголовком
 *    документа был h4 подвала.
 *  · ЦЕЛЬ НАЖАТИЯ И ФОКУС. «Назад» был 89 × 21 и без кольца.
 *  · ПУСТОГО ПРЯМОУГОЛЬНИКА НЕТ. Когда трансляции нет, место занимает ход
 *    матча, а не серая рамка с извинением: 656 × 369 — это 62 % ширины.
 *  · СЕТКА НЕ МЕНЯЕТСЯ. Две колонки выше 640, одна ниже — и это ЕДИНСТВЕННОЕ
 *    место, где раскладка переключается.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: признак — что табло отрисовано.
 *
 * НУЖЕН ЖИВОЙ МАТЧ В БАЗЕ. Страница строится целиком из данных; без строки
 * проверять нечего, и тест скажет об этом прямо, а не тихо позеленеет.
 */
const { test, expect } = require('@playwright/test');

const МАТЧ = '2dc04473-f294-4239-8054-4e61d2bd7322';

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/pages/live-match.html?id=' + МАТЧ },
    { имя: 'en', адрес: '/pages/live-match-en.html?id=' + МАТЧ },
    { имя: 'kg', адрес: '/pages/live-match-kg.html?id=' + МАТЧ }
];

async function дождаться(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => !!document.querySelector('.lm-score-panel'),
        null, { timeout: 15000 });
    /* Страница ещё и дотягивает журнал розыгрышей — дожидаемся, чтобы
       раскладка перестала меняться под замером. */
    await page.waitForFunction(
        () => !!document.querySelector('.lm-feed, .lm-empty, .lm-video'),
        null, { timeout: 15000 });

    /* ЖДЁМ НЕ ПОЯВЛЕНИЯ, А ТОГО, ЧТО РАЗМЕТКА ПЕРЕСТАЛА ПЕРЕРИСОВЫВАТЬСЯ.
       Страница переписывает container.innerHTML на каждом обновлении
       счёта и ещё раз — когда доезжает журнал. Узлы при этом создаются
       заново: ссылка «назад» на снимке видна, а тот узел, за который
       держался тест, уже откреплён — boundingBox отдаёт null, и падает
       «ссылки назад нет» на живой и совершенно здоровой странице.
       Поймано прогоном 25.09: в один прогон упало кольцо фокуса, в
       следующий — цель нажатия, и оба раза на РАЗНЫХ видах. Это не два
       дефекта, а один: слишком слабое условие ожидания.
       Признак покоя — один и тот же узел пять проверок подряд. */
    await page.waitForFunction(() => {
        const э = document.querySelector('.lm-back-link');
        if (!э) { window.__покой = 0; return false; }
        if (window.__узел !== э) { window.__узел = э; window.__покой = 0; return false; }
        window.__покой = (window.__покой || 0) + 1;
        return window.__покой >= 5;
    }, null, { timeout: 15000 });
}

for (const стр of СТРАНИЦЫ) {

test.describe('страница матча · ' + стр.имя, () => {

    test('у страницы один левый край: содержимое стоит там же, где шапка', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const края = await page.evaluate(() => {
            /* ЯКОРЬ ШАПКИ — ИМЕННО `nav`, И ЭТО ПОПРАВКА К ТЕСТУ.
               Первым заходом я взял «header > div» — и он схватил СОСЕДА:
               внутри шапки лежит .mobile-nav, панель бургер-меню, у неё
               край 380. На 1280 её нет в раскладке и тест проходил, на 768
               и 390 падал с «содержимое 17, шапка 380». Ряд шапки — это
               nav: max-width 1400, margin auto (описание Header 168:147). */
            const шапка = document.querySelector('header nav, .floating-header nav');
            const заголовок = document.querySelector('.lm-title');
            const назад = document.querySelector('.lm-back-link');
            const пр = э => э ? Math.round(э.getBoundingClientRect().left) : null;
            const св = э => э ? Math.round(э.getBoundingClientRect().right) : null;
            const вр = э => э ? Math.round(э.getBoundingClientRect().top) : null;
            return { шапка: пр(шапка), заголовок: пр(заголовок), назад: пр(назад),
                     назадСправа: св(назад),
                     верхЗаголовка: вр(заголовок), верхНазад: вр(назад),
                     высота: window.innerHeight, ширина: window.innerWidth };
        });
        expect(края.заголовок, 'заголовок матча не найден').not.toBeNull();
        /* ТЕЛЕФОН БОКОМ — ОСОБЫЙ СЛУЧАЙ, И ЭТО ПОПРАВКА К ТЕСТУ 25.09.
           В полноэкранном режиме «назад» и заголовок стоят ОДНОЙ СТРОКОЙ:
           высоты 390 не хватает на две. Общего левого края у них там нет
           и быть не может — держится другое отношение: одна строка и
           заголовок правее ссылки. Костя видел этот вид и принял его. */
        const боком = края.высота <= 500 && края.ширина > края.высота;
        if (боком) {
            expect(Math.abs(края.верхЗаголовка - края.верхНазад),
                'назад и заголовок разъехались по строкам').toBeLessThanOrEqual(24);
            expect(края.заголовок, 'заголовок налез на ссылку «назад»')
                .toBeGreaterThanOrEqual(края.назадСправа);
        } else {
            expect(края.назад).toBe(края.заголовок);
        }
        if (!боком && края.шапка !== null && края.шапка > 0) {
            expect(Math.abs(края.заголовок - края.шапка),
                'содержимое ' + края.заголовок + ', шапка ' + края.шапка).toBeLessThanOrEqual(1);
        }
    });

    /* ПЕРЕПИСАНО 25.09. Прежнее «очки крупнее сета» отменено Костей:
       «лаймовые цифры надо будет сделать такого же размера, что и геймы».
       Теперь размер у них общий, а различает их КРАСКА — тест проверяет
       обе половины решения сразу, иначе можно убрать цвет и остаться
       зелёным. */
    test('лестница цифр: очки и сет на одной ступени и разного цвета, оба крупнее имени', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const л = await page.evaluate(() => {
            const взять = s => {
                const э = document.querySelector(s);
                if (!э) return null;
                const c = getComputedStyle(э);
                return { кегль: parseFloat(c.fontSize), цвет: c.color };
            };
            return { очки: взять('.lm-points-score'), сет: взять('.lm-set-score'),
                     имя: взять('.lm-player-name') };
        });
        expect(л.имя, 'имени игрока нет').not.toBeNull();
        if (л.очки && л.сет) {
            expect(л.очки.кегль, 'очки ' + л.очки.кегль + ', сет ' + л.сет.кегль).toBe(л.сет.кегль);
            expect(л.очки.цвет, 'размер сравнялся — различать обязан цвет').not.toBe(л.сет.цвет);
            expect(л.сет.кегль, 'сет ' + л.сет.кегль + ', имя ' + л.имя.кегль).toBeGreaterThan(л.имя.кегль);
        }
    });

    /* ЖУРНАЛ В ДВЕ СТРОКИ — решение Кости 25.09. Тест ждёт признаки
       структуры, а не текст: у каждого гейма ровно две строки игроков, и
       в них одинаковое число ячеек — иначе колонки разойдутся и читать
       будет нечего. */
    test('у каждого гейма ровно две строки, и колонки в них совпадают', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const геймы = await page.evaluate(() => [...document.querySelectorAll('.lm-game')].map(г => ({
            строк: г.querySelectorAll('.lm-game-row').length,
            верх:  г.querySelectorAll('.lm-row-1 .lm-cell').length,
            низ:   г.querySelectorAll('.lm-row-2 .lm-cell').length
        })));
        for (const г of геймы) {
            expect(г.строк, 'у гейма не две строки, а ' + г.строк).toBe(2);
            expect(г.верх, 'ячеек сверху ' + г.верх + ', снизу ' + г.низ).toBe(г.низ);
        }
    });

    /* ЗАКРЫТЫЙ ГЕЙМ НЕ ТЕРЯЕТ СВОИ ОЧКИ. Костя открыл матч после гейма и
       увидел пустую панель: восемь розыгрышей схлопывались в одну строку. */
    test('закрытый гейм уносит свои розыгрыши с собой', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const геймы = [...document.querySelectorAll('.lm-game')];
            const закрытые = геймы.filter(г => г.querySelector('.lm-cell.is-game'));
            return { всего: геймы.length, закрытых: закрытые.length,
                     ячеек: закрытые.map(г => г.querySelectorAll('.lm-row-1 .lm-cell').length) };
        });
        if (д.закрытых > 0) {
            for (const n of д.ячеек) {
                expect(n, 'у закрытого гейма осталась одна ячейка — он схлопнулся').toBeGreaterThan(1);
            }
        }
    });

    /* Тусклая цифра — это СЧЁТ, а не украшение: 38 % белого давало 3.54
       при пороге 4.5. Тест меряет отношение яркостей в браузере. */
    test('тусклая цифра счёта читается: контраст не ниже 4.5', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const к = await page.evaluate(() => {
            const я = ц => {
                const [r, g, b] = ц.match(/\d+/g).map(Number);
                const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const я2 = э => {
                let n = э;
                while (n && n !== document.documentElement) {
                    const bg = getComputedStyle(n).backgroundColor;
                    if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return я(bg);
                    n = n.parentElement;
                }
                return 0;
            };
            const c = document.querySelector('.lm-cell:not(.is-won)');
            if (!c) return null;
            const t = я(getComputedStyle(c).color), f = я2(c);
            const hi = Math.max(t, f), lo = Math.min(t, f);
            return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
        });
        if (к !== null) expect(к, 'контраст тусклой цифры ' + к).toBeGreaterThanOrEqual(4.5);
    });

    test('страница называет матч: ровно один h1, и в нём оба игрока', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const h1 = await page.locator('h1').all();
        expect(h1.length).toBe(1);
        const текст = (await h1[0].textContent()).trim();
        expect(текст.length).toBeGreaterThan(3);
        expect(текст).toContain('—');
    });

    test('цель нажатия «назад» не ниже 44', async ({ page }) => {
        await дождаться(page, стр.адрес);
        /* expect.poll, А НЕ ОДИН ЗАМЕР: даже после покоя страница вправе
           перерисоваться от пришедшего по сокету очка. Проверка обязана
           пережить перерисовку, а не совпасть с паузой между ними. */
        await expect.poll(async () => {
            const к = await page.locator('.lm-back-link').boundingBox();
            return к ? Math.round(к.height) : null;
        }, { message: 'цель нажатия «назад» не набирает 44' })
            .toBeGreaterThanOrEqual(44);
    });

    test('у «назад» видно кольцо фокуса', async ({ page }) => {
        await дождаться(page, стр.адрес);
        /* СНАЧАЛА КЛАВИША, ПОТОМ ФОКУС. Кольцо ставит :focus-visible, а он
           зажигается не от факта фокуса, а от СПОСОБА, которым фокус
           получен: браузер держит признак «человек пришёл с клавиатуры».
           Программный .focus() этот признак не поднимает, и проверка
           зеленела или краснела в зависимости от того, что происходило на
           странице до неё — 314 из 315 прошли, один упал. Tab поднимает
           клавиатурную модальность честно, тем же путём, каким доходит до
           ссылки человек. Поймано прогоном 25.09. */
        await page.keyboard.press('Tab');
        /* Фокус ставим изнутри страницы, а не через локатор: локатор
           держит УЗЕЛ, а страница пересоздаёт узлы на каждой перерисовке.
           Внутри evaluate элемент ищется заново в тот же миг, когда с ним
           работают. См. js/live-match.js:95 и :127 — render зовётся
           дважды за загрузку. */
        const кольцо = await page.evaluate(() => {
            document.querySelector('.lm-back-link').focus();
            const э = document.querySelector('.lm-back-link');
            const с = getComputedStyle(э);
            return { ширина: parseFloat(с.outlineWidth) || 0, стиль: с.outlineStyle,
                     виден: э.matches(':focus-visible') };
        });
        expect(кольцо.виден, 'ссылка не считается фокусируемой с клавиатуры').toBe(true);
        expect(кольцо.стиль, 'кольца нет').not.toBe('none');
        expect(кольцо.ширина).toBeGreaterThanOrEqual(3);
    });

    test('горизонтальной прокрутки нет', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const вбок = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(вбок).toBeLessThanOrEqual(1);
    });

    test('бейдж статуса — общий компонент: высота 24, кегль 11', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const б = await page.evaluate(() => {
            const э = document.querySelector('.lm-score-panel .live-badge');
            if (!э) return null;
            const с = getComputedStyle(э);
            /* offsetHeight, А НЕ getBoundingClientRect. Бейдж «идёт» ПУЛЬСИРУЕТ:
               @keyframes livePulse гонит transform: scale(1) → scale(1.1), и
               нарисованная высота гуляет от 24 до 26.4. Прямоугольник меряет
               нарисованное, offsetHeight — разметку. Проверка была шаткой с
               рождения и зеленела по удаче: поймано прогоном 25.09. */
            return { высота: э.offsetHeight, кегль: parseFloat(с.fontSize), вес: с.fontWeight };
        });
        expect(б, 'бейджа нет или он не общего класса').not.toBeNull();
        expect(б.высота).toBe(24);
        expect(б.кегль).toBe(11);
    });

    test('пустого прямоугольника вместо видео нет', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const есть = await page.evaluate(() => ({
            старый: !!document.querySelector('.lm-no-video'),
            лево: !!document.querySelector('.lm-video, .lm-feed, .lm-empty')
        }));
        expect(есть.старый, 'вернулась серая рамка «нет трансляции»').toBe(false);
        expect(есть.лево, 'левая колонка пуста вовсе').toBe(true);
    });

    /* ДВА СОСТОЯНИЯ, И ОБА ВЫВОДЯТСЯ ИЗ ДАННЫХ (вариант Б2, 25.09).
       Журнал обязан быть на странице В ЛЮБОМ из них: до 25.09 на матчах с
       трансляцией его не было видно вовсе. */
    test('журнал есть при любой раскладке, и он на своём месте', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const видео = !!document.querySelector('.lm-video');
            const лента = document.querySelector('.lm-feed, .lm-empty');
            return {
                видео,
                лента: !!лента,
                вПравой: !!(лента && лента.closest('.lm-right')),
                вЛевой:  !!(лента && лента.closest('.lm-left')),
                спонсорыВЛевой: !!document.querySelector('.lm-left .lm-sponsors'),
                полоса: !!document.querySelector('.lm-sponsors.is-strip')
            };
        });
        expect(д.лента, 'журнала нет на странице вовсе').toBe(true);
        if (д.видео) {
            expect(д.вПравой, 'есть трансляция — журнал обязан быть под табло').toBe(true);
            expect(д.полоса, 'есть трансляция — спонсоры обязаны стать полосой').toBe(true);
        } else {
            expect(д.вЛевой, 'нет трансляции — журнал обязан занимать левую колонку').toBe(true);
        }
    });

    /* СПОНСОРЫ НЕ ПРОПАДАЮТ ПРИ ПЕРЕРИСОВКЕ. Поймано вживую 25.09: блок
       переехал внутрь контейнера, и следующий же render() стёр его вместе
       с логотипами. Тест перерисовывает страницу так же, как это делает
       сокет, и смотрит, на месте ли он. */
    test('блок спонсоров переживает перерисовку', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const было = await page.evaluate(() =>
            document.querySelectorAll('.lm-sponsors .carousel-slide-infinite').length);
        await page.waitForTimeout(1200);
        const стало = await page.evaluate(() => ({
            есть: !!document.querySelector('.lm-sponsors'),
            логотипов: document.querySelectorAll('.lm-sponsors .carousel-slide-infinite').length
        }));
        expect(стало.есть, 'блок спонсоров исчез из документа').toBe(true);
        if (было > 0) expect(стало.логотипов, 'логотипы пропали при перерисовке').toBe(было);
    });

    /* ══ УЗКИЕ ВИДЫ, 25.09 ══════════════════════════════════════════════
       Костя отверг зелёный прогон снимками: «телефон в вертикальном
       положении не помещается в экран и скролл». Тест этого не поймал,
       потому что проверка стояла ПОД УСЛОВИЕМ ширины: ниже 992 она ничего
       не утверждала. Условие снято — правило одно на все виды. */

    test('содержимое умещается в экран НА ЛЮБОМ виде', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const к = document.querySelector('.lm-container');
            return { ширина: window.innerWidth, экран: window.innerHeight,
                     низ: Math.round(к.getBoundingClientRect().bottom) };
        });
        expect(д.низ, 'низ содержимого ' + д.низ + ' при экране ' + д.экран +
                      ', ширина ' + д.ширина)
            .toBeLessThanOrEqual(д.экран + 1);
    });

    test('сетка переключается ровно на 640 и больше нигде', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const с = document.querySelector('.lm-grid');
            const cs = getComputedStyle(с);
            return {
                ширина: window.innerWidth,
                режим: cs.display,
                колонок: cs.gridTemplateColumns.trim().split(/\s+/).length
            };
        });
        if (д.ширина <= 640) expect(д.режим, 'ширина ' + д.ширина).toBe('flex');
        else expect(д.колонок, 'ширина ' + д.ширина).toBe(2);
    });

    /* Растёт и прокручивается ТОЛЬКО список геймов. Раньше росла страница:
       документ был 2356 при экране 844 и 2616 при экране 390. */
    test('прокручивается список геймов, а не страница', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const g = document.querySelector('.lm-feed-games');
            const к = document.querySelector('.lm-container');
            return {
                ширина: window.innerWidth,
                списокЕсть: !!g,
                списокВидно: g ? g.clientHeight : 0,
                списокВсего: g ? g.scrollHeight : 0,
                прокрутка: g ? getComputedStyle(g).overflowY : null,
                низ: Math.round(к.getBoundingClientRect().bottom),
                экран: window.innerHeight
            };
        });
        expect(д.низ, 'страница переросла экран').toBeLessThanOrEqual(д.экран + 1);
        if (д.списокЕсть && д.списокВсего > д.списокВидно) {
            expect(д.прокрутка, 'длинный список обязан прокручиваться внутри себя')
                .toBe('auto');
        }
    });

    /* ИДУЩИЙ ГЕЙМ ПОМЕЩАЕТСЯ ЦЕЛИКОМ. Гейм — 112: шапка 21, две строки по
       28 и зазоры. Меньше — и списку остаётся полоса, в которой нечего
       читать: на планшете с кадром во всю ширину было 47 из 170.
       Костя: «журнал не читается и не скроллится». */
    test('в журнале виден целый гейм, а не его полоска', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const g = document.querySelector('.lm-feed-games');
            const первый = document.querySelector('.lm-game');
            return {
                ширина: window.innerWidth,
                есть: !!g && !!первый,
                видно: g ? g.clientHeight : 0,
                гейм: первый ? Math.round(первый.getBoundingClientRect().height) : 0
            };
        });
        if (д.есть && д.гейм > 0) {
            expect(д.видно, 'списку видно ' + д.видно + ' при гейме ' + д.гейм +
                            ', ширина ' + д.ширина)
                .toBeGreaterThanOrEqual(д.гейм);
        }
    });

    /* Порядок на телефоне — решение Кости: «поменять местами журнал и
       счёт». Проверяем ГЕОМЕТРИЕЙ, а не строкой в css: order легко
       переставить, не тронув ни одного селектора. */
    test('на телефоне журнал стоит выше счёта, а спонсоры — ниже всех',
        async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const в = с => { const e = document.querySelector(с);
                             return e ? Math.round(e.getBoundingClientRect().top) : null; };
            return { ширина: window.innerWidth, журнал: в('.lm-feed'),
                     счёт: в('.lm-score-panel'), спонсоры: в('.lm-sponsors') };
        });
        if (д.ширина <= 640 && д.журнал !== null && д.счёт !== null) {
            expect(д.журнал, 'журнал обязан стоять выше счёта').toBeLessThan(д.счёт);
            if (д.спонсоры !== null)
                expect(д.спонсоры, 'спонсоры обязаны стоять ниже счёта')
                    .toBeGreaterThan(д.счёт);
        }
    });

    /* Сведения «подаёт · турнир · формат» — подпись К табло, а не его
       нижний этаж: иначе карточка счёта не кончается полосой под вторым
       игроком. Решение Кости 25.09. */
    test('сведения стоят вне карточки счёта', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => ({
            естьСведения: !!document.querySelector('.lm-info'),
            внутриТабло: !!document.querySelector('.lm-score-panel .lm-info')
        }));
        if (д.естьСведения)
            expect(д.внутриТабло, 'блок сведений снова оказался внутри табло')
                .toBe(false);
    });

    /* ТЕЛЕФОН БОКОМ — полноэкранный режим. Раз шапка уходит, уходит и
       подвал: иначе страница остаётся прокручиваемой и за экраном во весь
       рост стоит подвал. Костя: «а что у нас подвал на телефоне боком
       поехал куда-то». */
    test('на телефоне боком ни шапки, ни подвала, и страница не прокручивается',
        async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const шапка = document.querySelector('header.floating-header');
            const подвал = document.querySelector('.site-footer');
            return {
                ширина: window.innerWidth, высота: window.innerHeight,
                шапкаВидна: шапка ? getComputedStyle(шапка).display !== 'none' : false,
                подвалВиден: подвал ? getComputedStyle(подвал).display !== 'none' : false,
                документ: document.documentElement.scrollHeight,
                экран: window.innerHeight
            };
        });
        if (д.высота <= 500 && д.ширина > д.высота) {
            expect(д.шапкаВидна, 'шапка осталась на полноэкранном виде').toBe(false);
            expect(д.подвалВиден, 'подвал остался на полноэкранном виде').toBe(false);
            expect(д.документ, 'страница прокручивается: документ ' + д.документ +
                               ' при экране ' + д.экран)
                .toBeLessThanOrEqual(д.экран + 1);
        }
    });

    /* Две колонки читаются как одна карточка — значит кончаются на одной
       линии. Проверяем там, где колонок две. */
    test('где колонок две, низ у них общий', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const л = document.querySelector('.lm-left');
            const п = document.querySelector('.lm-right');
            const с = document.querySelector('.lm-grid');
            if (!л || !п || getComputedStyle(с).display !== 'grid') return null;
            const вид = e => getComputedStyle(e).display !== 'none' &&
                             e.getBoundingClientRect().height > 0;
            if (!вид(л) || !вид(п)) return null;
            return {
                ширина: window.innerWidth,
                лево: Math.round(л.getBoundingClientRect().bottom),
                право: Math.round(п.getBoundingClientRect().bottom)
            };
        });
        if (д) expect(Math.abs(д.лево - д.право),
            'низ колонок разошёлся: ' + д.лево + ' и ' + д.право +
            ', ширина ' + д.ширина).toBeLessThanOrEqual(2);
    });

});

}
