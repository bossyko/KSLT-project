/**
 * КУСОК 118 — АДМИНКА ГОВОРИТ ОДНИМ ЯЗЫКОМ.
 *
 * Сторож читает файл как текст. Эта проба читает ЭКРАН: словарь собран,
 * подписи русские, `undefined` нигде нет, а английская страница админки
 * уводит на русскую.
 *
 * ЗАМОРОЗКА ЧИТАЕТ ФАЙЛ КАК ТЕКСТ И НЕ ЗАМЕНЯЕТ НИ ТЕСТЫ, НИ ГЛАЗА.
 */
const { test, expect } = require('@playwright/test');

const ВИДЫ = [
    { имя: 'desktop', ш: 1280, в: 800 },
    { имя: 'tablet', ш: 768, в: 1024 },
    { имя: 'tablet-landscape', ш: 1024, в: 768 },
    { имя: 'mobile', ш: 375, в: 812 },
    { имя: 'phone-landscape', ш: 844, в: 390 },
];

async function открыть(page, адрес, признак) {
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 15000 })
        .catch(() => {});
}

test.describe('админка одним языком', () => {

    for (const вид of ВИДЫ) {
        test('словарь собран и говорит по-русски — ' + вид.имя, async ({ page }) => {
            await page.setViewportSize({ width: вид.ш, height: вид.в });
            await открыть(page, '/pages/admin.html', 'body');
            /* ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ, а не сжатием. */
            const м = await page.evaluate(() => {
                const A = window.KSLT_ADMIN;
                if (!A || !A.L) return { нет: true };
                const L = A.L;
                const ключи = Object.keys(L);
                const латиница = ключи.filter(к => typeof L[к] === 'string' &&
                    /^[A-Za-z][A-Za-z ().,%/:'’-]*$/.test(L[к]) && L[к].length > 3);
                return {
                    ключей: ключи.length,
                    флагЕсть: Object.prototype.hasOwnProperty.call(A, 'isEn'),
                    пустых: ключи.filter(к => L[к] === undefined || L[к] === null).length,
                    латиница: латиница.slice(0, 12),
                    латиницыВсего: латиница.length,
                    панель: L.dashboard,
                };
            });
            expect(м.нет, 'админка не собралась: window.KSLT_ADMIN.L пуст').toBeFalsy();
            expect(м.ключей, 'ПОРОГ: словарь собрался не полностью').toBeGreaterThanOrEqual(1578);
            expect(м.пустых, 'в словаре есть ключи без значения — это «undefined» на экране').toBe(0);
            expect(м.флагЕсть,
                'флаг isEn снова выведен наружу: ' + JSON.stringify(м)).toBe(false);
            expect(м.панель, 'подпись панели перестала быть русской').toBe('Дашборд');
            /* ЗАМОРАЖИВАЕТСЯ ЗАМЕРЕННОЕ: латинские значения в словаре ЕСТЬ и
               после куска 118 — их РОВНО 24, и это имена, а не подписи:
               Email, NTRP, Telegram, Instagram, WhatsApp, Google Maps, Slug
               (URL), Promoted. Порог равен ЗАМЕРУ 22.10, а не нулю и не
               круглому числу «с запасом»: ХРАПОВИК С ЗАПАСОМ НЕ СТОРОЖИТ. */
            expect(м.латиницыВсего,
                'латинских значений стало больше замеренных 24 — похоже, вернулась\n' +
                'английская ветка. Нашлись: ' + м.латиница.join(' · ')).toBeLessThanOrEqual(24);
        });
    }

    test('английская страница админки уводит на русскую', async ({ page }) => {
        await page.goto('/pages/admin-en.html', { waitUntil: 'domcontentloaded' });
        await page.waitForURL(/admin\.html(\?|#|$)/, { timeout: 10000 });
        expect(page.url(), 'admin-en.html перестала уводить на admin.html').toMatch(/admin\.html/);
    });

    test('на экране нет слова undefined', async ({ page }) => {
        await открыть(page, '/pages/admin.html', 'body');
        await page.waitForTimeout(1500);
        const т = await page.evaluate(() => document.body.innerText);
        expect(т.indexOf('undefined'),
            'на экране админки видно «undefined» — ключ потерялся').toBe(-1);
    });

});
