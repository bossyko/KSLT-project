// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ПРОБА РАЗДЕЛА «НОВОСТИ» В АДМИНКЕ — СПИСОК статей.
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файлы как текст: что высота ряда
 * названа свойством, что у миниатюры стоит `display: block`, что у значка
 * категории стоит `nowrap`. А ЧТО ВЫШЛО В БРАУЗЕРЕ — все ли ряды одной
 * высоты, не выше ли ряда то, что в нём лежит, работает ли отсечка
 * названия, попадает ли палец в галочку — видно только прогоном.
 *
 * СТЕНД, А НЕ АДМИНКА. Список рисует НАСТОЯЩИЙ модуль
 * `js/admin/sections/news.js` на стенде
 * `maket/stend-admin-novosti-spisok.html`: подменён только клиент базы.
 * РАЗМЕТКА В СТЕНД НЕ СКОПИРОВАНА.
 *
 * В БАЗУ НЕ ПИШЕТ НИЧЕГО: у заглушки нет ни insert, ни update, ни delete.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТОЛЬКО РУССКИЙ (решение Кости 29.09).
 *
 * РЕШЕНИЕ КОСТИ 08.10: состав списка не меняется — три карточки аналитики,
 * «Популярные» сверху, все десять колонок на всех видах; на узких видах
 * заголовок остаётся с отсечкой, и таблица едет вбок.
 */

const СТЕНД = '/maket/stend-admin-novosti-spisok.html';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

test.describe('Админка «Новости»: список статей', () => {

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');
        await page.goto(СТЕНД);
        await page.waitForSelector('body[data-stend-gotov="1"]', { timeout: 15000 });
        await page.waitForSelector('#adNewsTable tbody tr[data-news-id]', { timeout: 15000 });
    });

    test('состав не менялся: три карточки аналитики и десять колонок', async ({ page }) => {
        await expect(page.locator('.ad-news-stat-card')).toHaveCount(3);
        await expect(page.locator('.ad-news-stat-card--popular')).toHaveCount(1);
        await expect(page.locator('#adNewsTable thead th')).toHaveCount(10);
        const клеток = await page.locator('#adNewsTable tbody tr[data-news-id]').first().locator('td').count();
        expect(клеток).toBe(10);
    });

    test('«Популярные» стоят ДО списка', async ({ page }) => {
        const полоса = await page.locator('#adNewsStatsGrid').boundingBox();
        const таблица = await page.locator('#adNewsTable').boundingBox();
        expect(полоса.y).toBeLessThan(таблица.y);
        await expect(page.locator('.ad-news-stat-card--popular .ad-news-stat-top-item'))
            .toHaveCount(3);
    });

    test('ВСЕ РЯДЫ ОДНОЙ ВЫСОТЫ — 48 плюс черта', async ({ page }) => {
        const высоты = await page.locator('#adNewsTable tbody tr[data-news-id]')
            .evaluateAll(ряды => ряды.map(р => Math.round(р.getBoundingClientRect().height)));
        expect(высоты.length).toBeGreaterThan(10);
        высоты.forEach(в => expect(в).toBeGreaterThanOrEqual(48));
        высоты.forEach(в => expect(в).toBeLessThanOrEqual(49));
    });

    test('ничто в ряду не выше ряда: ни миниатюра, ни значок категории', async ({ page }) => {
        const ряд = page.locator('#adNewsTable tbody tr[data-news-id]').first();
        const высота = (await ряд.boundingBox()).height;
        const мини = await ряд.locator('img.ad-table-thumb').boundingBox();
        expect(мини.height).toBeLessThanOrEqual(высота);
        // «Мировой теннис» — самая длинная подпись категории: одна строка
        const значки = await page.locator('#adNewsTable tbody .ad-cat-badge')
            .evaluateAll(э => э.map(з => Math.round(з.getBoundingClientRect().height)));
        expect(новоеМножество(значки).length).toBe(1);
    });

    test('название с отсечкой, и полное приходит подсказкой', async ({ page }) => {
        const длинное = page.locator('#adNewsTable tbody td.ad-nazvanie').first();
        const обрезано = await длинное.evaluate(э => э.scrollWidth > э.clientWidth);
        expect(обрезано).toBe(true);
        const подсказка = await длинное.getAttribute('title');
        expect(подсказка).toContain('Турнира Большого Шлема');
    });

    test('поле поиска — 320 × 44, как компонент', async ({ page }) => {
        const поиск = await page.locator('#adNewsSearch').boundingBox();
        expect(Math.round(поиск.height)).toBe(44);
        expect(Math.round(поиск.width)).toBe(320);
    });

    test('кнопка «Добавить статью» — ступень 44', async ({ page }) => {
        const кнопка = await page.locator('#adNewsAdd').boundingBox();
        expect(Math.round(кнопка.height)).toBe(44);
    });

    test('ЦЕЛЬ НАЖАТИЯ ГАЛОЧКИ — 44, хотя сама она 18', async ({ page }) => {
        const галочка = page.locator('#adNewsTable tbody .ad-bulk-item').first();
        const своя = await галочка.boundingBox();
        expect(Math.round(своя.width)).toBe(18);
        const слой = await галочка.evaluate(э => {
            const s = getComputedStyle(э, '::before');
            return [parseFloat(s.width), parseFloat(s.height)];
        });
        expect(слой[0]).toBeGreaterThanOrEqual(44);
        expect(слой[1]).toBeGreaterThanOrEqual(44);
    });

    test('ЦЕЛЬ НАЖАТИЯ ШАПКИ КОЛОНКИ — 44', async ({ page }) => {
        const слой = await page.locator('#adNewsTable thead .ad-col-header').first()
            .evaluate(э => parseFloat(getComputedStyle(э, '::before').height));
        expect(слой).toBeGreaterThanOrEqual(44);
    });

    test('неполный выбор отличим от пустого', async ({ page }) => {
        const все = page.locator('#adNewsTable thead .ad-bulk-all');
        expect(await все.evaluate(э => э.indeterminate)).toBe(false);
        await page.locator('#adNewsTable tbody .ad-bulk-item').first().check();
        expect(await все.evaluate(э => э.indeterminate)).toBe(true);
        expect(await все.isChecked()).toBe(false);
        // Выбрали всё — третьего состояния больше нет
        await все.check();
        expect(await все.evaluate(э => э.indeterminate)).toBe(false);
        expect(await все.isChecked()).toBe(true);
    });

    test('числа колонок не уезжают из своих клеток', async ({ page }) => {
        const ряд = page.locator('#adNewsTable tbody tr[data-news-id]').nth(1);
        const клетка = await ряд.locator('td.ad-chislo').first().boundingBox();
        expect(клетка.width).toBeGreaterThan(20);
        const по = await ряд.locator('td.ad-chislo').first()
            .evaluate(э => getComputedStyle(э).textAlign);
        expect(по).toBe('center');
    });

    test('ничего не вылезает за витрину карточек', async ({ page }) => {
        const перелив = await page.locator('#adNewsStatsGrid')
            .evaluate(э => э.scrollWidth - э.clientWidth);
        expect(перелив).toBeLessThanOrEqual(1);
    });

});

/** Уникальные значения списка — без Set, чтобы читалось в следе прогона. */
function новоеМножество(список) {
    return список.filter((з, i) => список.indexOf(з) === i);
}
