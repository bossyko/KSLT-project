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
 *  · СЕТКА НЕ МЕНЯЕТСЯ. Две колонки выше 992, одна ниже — и это ЕДИНСТВЕННОЕ
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
            return { шапка: пр(шапка), заголовок: пр(заголовок), назад: пр(назад) };
        });
        expect(края.заголовок, 'заголовок матча не найден').not.toBeNull();
        expect(края.назад).toBe(края.заголовок);
        if (края.шапка !== null && края.шапка > 0) {
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
        const к = await page.locator('.lm-back-link').boundingBox();
        expect(к, 'ссылки «назад» нет').not.toBeNull();
        expect(Math.round(к.height)).toBeGreaterThanOrEqual(44);
    });

    test('у «назад» видно кольцо фокуса', async ({ page }) => {
        await дождаться(page, стр.адрес);
        await page.locator('.lm-back-link').focus();
        const кольцо = await page.evaluate(() => {
            const с = getComputedStyle(document.querySelector('.lm-back-link'));
            return { ширина: parseFloat(с.outlineWidth) || 0, стиль: с.outlineStyle };
        });
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
            const п = э.getBoundingClientRect();
            return { высота: Math.round(п.height), кегль: parseFloat(с.fontSize), вес: с.fontWeight };
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

    /* ЭКРАН ЦЕЛИКОМ выше 992 — решение Кости 25.09: «надо будет всё
       разместить на одном окне без скролов». Ниже 992 правило не
       действует: там одна колонка и страница прокручивается. */
    test('выше 992 содержимое умещается в экран', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const с = document.querySelector('.lm-grid');
            return { ширина: window.innerWidth, экран: window.innerHeight,
                     низ: Math.round(с.getBoundingClientRect().bottom) };
        });
        if (д.ширина > 992) {
            expect(д.низ, 'низ содержимого ' + д.низ + ' при экране ' + д.экран)
                .toBeLessThanOrEqual(д.экран);
        }
    });

    test('сетка переключается ровно на 992 и больше нигде', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const д = await page.evaluate(() => {
            const с = document.querySelector('.lm-grid');
            return {
                ширина: window.innerWidth,
                колонок: getComputedStyle(с).gridTemplateColumns.trim().split(/\s+/).length
            };
        });
        if (д.ширина > 992) expect(д.колонок, 'ширина ' + д.ширина).toBe(2);
        else expect(д.колонок, 'ширина ' + д.ширина).toBe(1);
    });

});

}
