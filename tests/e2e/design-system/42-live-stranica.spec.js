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

    test('лестница цифр: очки крупнее счёта сета, счёт сета крупнее имени', async ({ page }) => {
        await дождаться(page, стр.адрес);
        const л = await page.evaluate(() => {
            const к = s => {
                const э = document.querySelector(s);
                return э ? parseFloat(getComputedStyle(э).fontSize) : null;
            };
            return { очки: к('.lm-points-score'), сет: к('.lm-set-score'), имя: к('.lm-player-name') };
        });
        expect(л.имя, 'имени игрока нет').not.toBeNull();
        if (л.очки !== null && л.сет !== null) {
            expect(л.очки, 'очки ' + л.очки + ', сет ' + л.сет).toBeGreaterThan(л.сет);
            expect(л.сет, 'сет ' + л.сет + ', имя ' + л.имя).toBeGreaterThan(л.имя);
        }
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
