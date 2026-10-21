// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ОТКАЗ ОТ ДВИЖЕНИЯ — НА ВСЕХ СТРАНИЦАХ И ПОСЛЕ НАЖАТИЙ. 19.10.
 *
 * ЧЕМ ОТЛИЧАЕТСЯ ОТ ПРОБЫ 113. Та проверяет три страницы в покое и
 * принадлежит куску важности. Эта — двенадцать страниц И ОБХОД: окна,
 * раскрывашки, карточки. Анимация, которую заводит ОТКРЫТОЕ ОКНО, в покое
 * не видна вовсе, а человек, попросивший покоя, окна открывает.
 *
 * ЗАПИСЬ ВРАЛА ДВАЖДЫ: «46 анимаций без отказа», потом «81». Беда же
 * оказалась НУЛЕВОЙ: в tokens.css стоит общий блок, накрывающий `*`,
 * `*::before`, `*::after` важностью, и он гасит все 81 по весу.
 * ЧИСЛО В ЗАПИСИ — ЭТО ПОВОД ПОМЕРИТЬ, А НЕ ОТВЕТ.
 *
 * НАЖАТИЕ, НЕ ИЗМЕНИВШЕЕ РАЗМЕТКУ, НИЧЕГО НЕ ДОКАЗЫВАЕТ. Поэтому проба
 * считает узлы до и после и требует, чтобы хоть одно нажатие что-то
 * открыло — иначе «движения нет» значит «нажималось не туда».
 *
 * КНОПКИ, КОТОРЫЕ ПИШУТ В БАЗУ, НЕ НАЖИМАЮТСЯ. Отбор по слову отправки,
 * удаления, сохранения, по type=submit и по форме-родителю.
 */

const СТРАНИЦЫ = [
    '/index.html', '/pages/tournaments.html', '/pages/tournaments-overview.html',
    '/pages/courts.html', '/pages/coaches.html', '/pages/services.html',
    '/pages/news.html', '/pages/players.html', '/pages/partners.html',
    '/pages/battles-overview.html', '/pages/tournament.html', '/pages/auth.html'
];

/** Что считается движением: бесконечная анимация или заметный переход. */
const СНЯТЬ = () => {
    const кто = [];
    for (const el of Array.from(document.querySelectorAll('*'))) {
        const с = getComputedStyle(el);
        const имя = с.animationName;
        if (имя && имя !== 'none') {
            const дл = parseFloat(с.animationDuration) || 0;
            if (с.animationIterationCount === 'infinite' || (дл > 0.05 && с.animationIterationCount !== '1')) {
                кто.push('анимация ' + имя + ' x' + с.animationIterationCount + ' ' + с.animationDuration +
                         ' @ ' + el.tagName.toLowerCase() + '.' +
                         (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''));
            }
        }
        if ((parseFloat(с.transitionDuration) || 0) > 0.05) {
            кто.push('переход ' + с.transitionDuration + ' @ ' + el.tagName.toLowerCase() + '.' +
                     (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''));
        }
    }
    return Array.from(new Set(кто));
};

test.describe('при просьбе о покое ничего не движется', () => {
    for (const стр of СТРАНИЦЫ) {
        test(`${стр}: в покое`, async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(стр);
            await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
            await page.waitForTimeout(400);

            /* Сперва убеждаемся, что отказ ДОШЁЛ: иначе проба зелена по
               тому, что мы его не включили, а не по делу. */
            const дошёл = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
            expect(дошёл, 'отказ от движения доходит до страницы').toBe(true);

            const движение = await page.evaluate(СНЯТЬ);
            expect(движение, 'движение при включённом отказе').toEqual([]);
        });
    }
});

/**
 * ОБХОД ДЕЛАЕТСЯ НАСТОЯЩИМ КУРСОРОМ, А НЕ СОБЫТИЯМИ ИЗ evaluate.
 *
 * Четыре прогона эта проба падала, и каждый раз виновата была ОНА, а не
 * код. Причины, по порядку, и все одной породы — я спрашивал НАПИСАНИЕ
 * вместо ПРИЗНАКА:
 *   1. «нажатий больше четырёх» — число взято с десктопа, а на телефоне
 *      пунктов меню нет, они за бургером;
 *   2. «прибыли узлы» — мобильное меню уже в разметке и меняет лишь
 *      видимость;
 *   3. нажатие по пункту меню на десктопе УВОДИЛО со страницы (−495
 *      узлов), обход прерывался на первом шаге;
 *   4. `dispatchEvent('mouseover')` НЕ ЗАЖИГАЕТ `:hover` — ровно как
 *      `element.focus()` не зажигает `:focus-visible` (урок 12.10).
 *      Поэтому раскрывашка меню на десктопе не раскрывалась никогда.
 *
 * ЗАМЕРЕНО ПРИБОРОМ, на трёх видах по шести страницам: кнопок без ссылки
 * на десктопе НОЛЬ — всё меню там ссылки, а бургер скрыт. На планшете и
 * телефоне таких кнопок четыре, и все четыре открывают.
 * Отсюда разделение: узкие виды обходятся НАЖАТИЕМ, широкие —
 * НАВЕДЕНИЕМ, и то и другое настоящим курсором Playwright.
 */
test('обход настоящим курсором: открывается — и всё равно не движется', async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/pages/tournaments-overview.html');
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    await page.waitForTimeout(500);

    const видно = () => Array.from(document.querySelectorAll('body *')).filter(el => {
        const с = getComputedStyle(el);
        return с.visibility !== 'hidden' && с.display !== 'none' && parseFloat(с.opacity) > 0.01;
    }).length;

    const вПокое = await page.evaluate(СНЯТЬ);
    let открылось = 0, тронуто = 0;

    /* Узкий вид: бургер и кнопки. Широкий: наведение на раскрывашку. */
    const бургер = page.locator('.burger-menu').first();
    const узкий = await бургер.isVisible().catch(() => false);

    if (узкий) {
        const до = await page.evaluate(видно);
        await бургер.click();
        await page.waitForTimeout(350);
        if (await page.evaluate(видно) !== до) открылось++;
        тронуто++;
        const кнопки = page.locator('button:not([type=submit]):visible');
        const сколько = Math.min(await кнопки.count(), 5);
        for (let i = 0; i < сколько; i++) {
            const el = кнопки.nth(i);
            const текст = ((await el.textContent().catch(() => '')) || '').trim();
            if (/отправ|удал|сохран|подтверд|оплат|войти|выйти/i.test(текст)) continue;
            const д = await page.evaluate(видно);
            await el.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(300);
            тронуто++;
            if (await page.evaluate(видно) !== д) открылось++;
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(120);
        }
    } else {
        const пункты = page.locator('.nav-item-dropdown');
        const сколько = Math.min(await пункты.count(), 5);
        for (let i = 0; i < сколько; i++) {
            const до = await page.evaluate(видно);
            /* НАСТОЯЩЕЕ НАВЕДЕНИЕ: только оно зажигает :hover. */
            await пункты.nth(i).hover({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(350);
            тронуто++;
            if (await page.evaluate(видно) !== до) открылось++;
            await page.mouse.move(5, 500);
            await page.waitForTimeout(150);
        }
    }

    const движение = (await page.evaluate(СНЯТЬ)).filter(x => вПокое.indexOf(x) === -1);

    expect(тронуто, 'обход состоялся — было что тронуть').toBeGreaterThan(0);
    /* САМОПРОВЕРКА: хоть одно прикосновение обязано что-то раскрыть,
       иначе «движения нет» значит «трогали не то». */
    expect(открылось, узкий ? 'на узком виде нажатие раскрыло меню или окно'
                            : 'на широком виде наведение раскрыло меню').toBeGreaterThan(0);
    expect(движение, 'движение после обхода при включённом отказе').toEqual([]);
});

test('без просьбы о покое движение на месте', async ({ page }) => {
    /* ПРОВЕРКА САМОЙ ПРОБЫ. Если и без отказа ничего не крутится, то всё
       выше зелено по пустоте: гасить было нечего. */
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/index.html');
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    await page.waitForTimeout(400);
    const крутится = await page.evaluate(() =>
        Array.from(document.querySelectorAll('*')).filter(el =>
            getComputedStyle(el).animationIterationCount === 'infinite').length);
    expect(крутится, 'без отказа на главной есть бесконечные анимации').toBeGreaterThan(0);
});
