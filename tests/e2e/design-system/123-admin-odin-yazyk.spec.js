/**
 * КУСОК 118 — АДМИНКА ГОВОРИТ ОДНИМ ЯЗЫКОМ.
 *
 * Сторож читает файл как текст. Эта проба читает ЭКРАН: словарь собран,
 * подписи русские, `undefined` нигде нет, а английская страница админки
 * уводит на русскую.
 *
 * ПУСТАЯ СТРАНИЦА НЕ ДОКАЗЫВАЕТ НИЧЕГО. Первая версия пробы ходила на
 * `/pages/admin.html`, а `js/auth-guard.js` без входа уводит на `auth.html`:
 * проба мерила ЭКРАН ВХОДА. 25 случаев упали честно, а два — «нет слова
 * undefined» и «страница уводит» — ПРОШЛИ ВХОЛОСТУЮ, на чужой странице.
 * Словарь меряется на СТЕНДЕ: он грузит `js/admin/core/constants.js` и
 * рисует настоящую админку с заглушкой базы, как и проба 106.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ: телефонной раскладки в ней нет, решение
 * Кости 29.09. ПРИНЯТОЕ НЕ ПЕРЕОТКРЫВАЕТСЯ.
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/setka-zamer.html?r=1';

test.describe('админка одним языком', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет: телефонной раскладки в ней нет (слово Кости 29.09)');
    });

    test('словарь собран и говорит по-русски', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });

        const м = await page.evaluate(() => {
            const A = window.KSLT_ADMIN, L = A.L;
            const ключи = Object.keys(L);
            const латиница = ключи.filter(к => typeof L[к] === 'string' &&
                /^[A-Za-z][A-Za-z ().,%/:'’-]*$/.test(L[к]) && L[к].length > 3);
            return {
                ключей: ключи.length,
                флагЕсть: Object.prototype.hasOwnProperty.call(A, 'isEn'),
                пустых: ключи.filter(к => L[к] === undefined || L[к] === null).length,
                латиница: латиница.map(к => к + '=' + L[к]).slice(0, 30),
                латиницыВсего: латиница.length,
                панель: L.dashboard,
            };
        });

        /* ПОДНЯТ 22.10, КУСОК 119: два понятия получили свои имена. */
        expect(м.ключей, 'ПОРОГ: словарь собрался не полностью').toBeGreaterThanOrEqual(1581);
        expect(м.пустых, 'в словаре есть ключи без значения — это «undefined» на экране').toBe(0);
        expect(м.флагЕсть,
            'флаг isEn снова выведен наружу: ' + JSON.stringify(м)).toBe(false);
        expect(м.панель, 'подпись панели перестала быть русской').toBe('Дашборд');
        /* ЗАМОРАЖИВАЕТСЯ ЗАМЕРЕННОЕ: латинские значения в словаре ЕСТЬ и
           после куска 118 — их РОВНО 24, и это имена, а не подписи: Email,
           NTRP, Telegram, Instagram, WhatsApp, Google Maps, Slug (URL),
           Promoted. Порог равен ЗАМЕРУ 22.10, а не нулю и не круглому числу
           «с запасом»: ХРАПОВИК С ЗАПАСОМ НЕ СТОРОЖИТ. */
        expect(м.латиницыВсего,
            'латинских значений стало больше замеренных 24 — похоже, вернулась\n' +
            'английская ветка. Нашлись: ' + м.латиница.join(' · ')).toBeLessThanOrEqual(24);
    });

    test('на нарисованной админке нет слова undefined', async ({ page }) => {
        await page.goto(СТЕНД);
        /* ПРИЗНАК ГОТОВНОСТИ — НАРИСОВАННАЯ СЕТКА, А НЕ ТИШИНА СЕТИ. */
        await page.waitForSelector('.ad-brk-match', { timeout: 15000 });
        const м = await page.evaluate(() => ({
            текст: document.body.innerText,
            матчей: document.querySelectorAll('.ad-brk-match').length,
        }));
        expect(м.матчей, 'ПОРОГ: админка не нарисовалась, мерить нечего').toBeGreaterThan(0);
        expect(м.текст.indexOf('undefined'),
            'на экране админки видно «undefined» — ключ потерялся').toBe(-1);
    });

    test('английская страница админки уводит на русскую', async ({ page }) => {
        await page.goto('/pages/admin-en.html', { waitUntil: 'domcontentloaded' });
        /* ЖДЁМ УХОДА, А НЕ ПРИХОДА. `waitForURL(/admin\.html/)` сходится на
           самом `admin-en.html` сразу же и ничего не ждёт; а куда уведёт
           дальше — решает `auth-guard.js`, и без входа это `auth.html`.
           Признак — что со страницы УШЛИ. */
        await page.waitForURL(u => !/admin-en\.html/.test(u.toString()), { timeout: 10000 });
        expect(page.url(), 'admin-en.html перестала уводить прочь')
            .not.toMatch(/admin-en\.html/);
    });

});
