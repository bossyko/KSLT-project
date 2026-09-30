// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ПЛЕЙ-ОФФ: КЛЕТКА ХРАНИТ ИСТОЧНИК, А НЕ ИМЯ — по стенду жеребьёвки.
 *
 * Стенд `maket/setka-zamer.html?r=N` грузит НАСТОЯЩУЮ админку и подменяет
 * только `A.client`. Базы здесь нет: прогон ничего не пишет и не ест квоту.
 *
 * РАСКЛАД 17 — форма боевого турнира 153bc688 в том виде, в каком его нашли
 * 29.09: счёт группы правили после того, как клетки заполнились, и один
 * человек остался в сетке ДВАЖДЫ. Единственный расклад, где видныы все три
 * пометки. Раскладу 1 и 16 положено быть чистыми — на них проверяем, что
 * пометки не появляются там, где беды нет.
 *
 * ЯЗЫК OДИН — РУССКИЙ: `pages/admin-en.html` это перенаправление, и в нём
 * написано почему. ВИДОВ ТРИ — админка десктоп и планшет (слово Кости).
 */

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

async function открыть(page, r) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(т)) беды.push('console: ' + т);
    });
    await page.goto('/maket/setka-zamer.html?r=' + r);
    await page.waitForSelector('.ad-brk-match', { timeout: 15000 });
    return беды;
}

test.describe('плей-офф — пометки на клетке сетки', () => {
    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет: телефонной раскладки в ней нет (слово Кости 29.09)');
    });

    test('r=17 · три пометки, каждая за своей бедой', async ({ page }) => {
        const беды = await открыть(page, 17);
        await page.waitForSelector('.ad-brk-notice', { timeout: 15000 });
        expect(беды, беды.join(' | ')).toHaveLength(0);

        const пометки = await page.evaluate(() =>
            [...document.querySelectorAll('.ad-brk-notice')].map(n => ({
                тон: n.className.replace('ad-brk-notice ad-brk-notice-', ''),
                текст: n.textContent.replace(/\s+/g, ' ').trim()
            })));

        // дубль стоит НА ОБЕИХ клетках: человек ищет вторую, глядя на первую
        expect(пометки.filter(п => п.тон === 'dup').length).toBe(2);
        expect(пометки.filter(п => п.тон === 'mismatch').length).toBe(1);
        expect(пометки.filter(п => п.тон === 'same').length).toBe(1);
    });

    test('r=17 · пометка не повторяет того, что видно строкой выше', async ({ page }) => {
        await открыть(page, 17);
        await page.waitForSelector('.ad-brk-notice', { timeout: 15000 });

        const пары = await page.evaluate(() =>
            [...document.querySelectorAll('.ad-brk-match')]
                .filter(k => k.querySelector('.ad-brk-notice'))
                .map(k => ({
                    имена: [...k.querySelectorAll('.ad-brk-name')].map(n => n.textContent.trim()).filter(Boolean),
                    пометка: k.querySelector('.ad-brk-notice').textContent.replace(/\s+/g, ' ').trim()
                })));

        expect(пары.length).toBeGreaterThan(0);
        for (const п of пары) {
            for (const имя of п.имена) {
                // Фамилия длиннее пяти букв — достаточный признак, что это имя,
                // а не метка «A2» и не слово вроде «дважды»
                const фамилия = имя.split(' ')[0];
                if (фамилия.length < 6) continue;
                expect(п.пометка, 'пометка повторяет имя из своей же клетки: ' + фамилия)
                    .not.toContain(фамилия);
            }
        }
    });

    test('r=17 · подсказка «снимите счёт» только там, где счёт есть', async ({ page }) => {
        await открыть(page, 17);
        await page.waitForSelector('.ad-brk-notice-dup', { timeout: 15000 });

        const дубли = await page.evaluate(() =>
            [...document.querySelectorAll('.ad-brk-match')]
                .filter(k => k.querySelector('.ad-brk-notice-dup'))
                .map(k => ({
                    сыгран: k.querySelectorAll('.ad-brk-set').length > 0,
                    естьПодсказка: !!k.querySelector('.ad-brk-notice-fix')
                })));

        expect(дубли.length).toBe(2);
        for (const д of дубли) {
            expect(д.естьПодсказка, 'подсказка стоит не по месту').toBe(д.сыгран);
        }
    });

    test('r=17 · полоса не шире клетки и стоит на шкале', async ({ page }) => {
        await открыть(page, 17);
        await page.waitForSelector('.ad-brk-notice', { timeout: 15000 });

        const замер = await page.evaluate(() => {
            const n = document.querySelector('.ad-brk-notice');
            const k = n.closest('.ad-brk-match');
            const s = getComputedStyle(n);
            return {
                ширинаПолосы: Math.round(n.getBoundingClientRect().width),
                ширинаКлетки: Math.round(k.getBoundingClientRect().width),
                кегль: s.fontSize,
                отступ: s.padding
            };
        });

        // Ширину задаёт клетка, а не полоса — правило компонента Bracket match
        expect(замер.ширинаПолосы).toBeLessThanOrEqual(замер.ширинаКлетки);
        expect(замер.кегль).toBe('11px');
        expect(замер.отступ).toBe('8px 12px');
    });

    test('r=17 · текст дубля читается: контраст не ниже 4.5', async ({ page }) => {
        await открыть(page, 17);
        await page.waitForSelector('.ad-brk-notice-dup', { timeout: 15000 });

        const контраст = await page.evaluate(() => {
            const яр = c => {
                const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
            };
            const числа = s => (s.match(/[\d.]+/g) || []).map(Number);
            const n = document.querySelector('.ad-brk-notice-dup');
            const s = getComputedStyle(n);
            const L1 = яр(числа(s.backgroundColor)), L2 = яр(числа(s.color));
            return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        });

        // 11px — мелкий текст, порог WCAG 1.4.3 равен 4.5
        expect(контраст).toBeGreaterThanOrEqual(4.5);
    });

    test('где беды нет — нет и пометок', async ({ page }) => {
        for (const r of [1, 16]) {
            const беды = await открыть(page, r);
            expect(беды, 'r=' + r + ': ' + беды.join(' | ')).toHaveLength(0);
            await expect(page.locator('.ad-brk-notice'), 'расклад ' + r + ' здоров').toHaveCount(0);
        }
    });
});
