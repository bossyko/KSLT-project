// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ВАЖНОСТЬ ТАМ, ГДЕ ОНА ОБЯЗАТЕЛЬНА. Пункт 80а, 19.10.
 *
 * ЧТО СТОРОЖ НЕ МОЖЕТ. `tools/check-vazhnost.js` читает исходник и держит
 * потолки по разрядам: ни одна новая важность не проскочит молча, ни одна
 * нужная не исчезнет. Но он не может сказать, РАБОТАЕТ ли отказ от
 * движения — а это единственный разряд, где важность не роскошь, а
 * доступность: без неё любое правило с анимацией победит отказ.
 *
 * ПОЧЕМУ ЗАМЕР САМОГО КУСКА ОСТАЛСЯ ДОЛГОМ. Чтобы снять важность, надо
 * доказать, что правило и без неё выигрывает. Прибор для этого замера
 * соврал за один кусок ПЯТЬ раз, и поймал его контрольный проход: двойник
 * файла БЕЗ ЕДИНОЙ ПРАВКИ дал 9 расхождений вместо нуля — на странице шли
 * анимации, и значения менялись сами между двумя снятиями. Отсюда правило
 * этой пробы: прежде чем верить разнице, ПОГАСИ ДВИЖЕНИЕ.
 *
 * ЭТА ПРОБА МЕРИТ НЕ ПОТОЛОК, А ДЕЙСТВИЕ: при `prefers-reduced-motion:
 * reduce` ни один элемент не крутит бесконечную анимацию, и скрытое
 * остаётся скрытым.
 */

const СТРАНИЦЫ = ['/index.html', '/pages/tournaments.html', '/pages/news.html'];

test.describe('отказ от движения держится важностью', () => {
    for (const стр of СТРАНИЦЫ) {
        test(`${стр}: при отказе от движения ничего не крутится`, async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(стр);
            /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ. */
            await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
            await page.waitForTimeout(400);

            const движение = await page.evaluate(() => {
                const плохо = [];
                for (const el of Array.from(document.querySelectorAll('*'))) {
                    const с = getComputedStyle(el);
                    const имя = с.animationName;
                    if (!имя || имя === 'none') continue;
                    const повторов = с.animationIterationCount;
                    const длит = parseFloat(с.animationDuration) || 0;
                    /* Бесконечная анимация при просьбе о покое — это беда.
                       Один прогон длительностью около нуля — это погашенная
                       анимация, и она законна. */
                    if (повторов === 'infinite' || (длит > 0.05 && повторов !== '1')) {
                        плохо.push((el.tagName.toLowerCase() + '.' +
                            (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '')) +
                            ' ' + имя + ' x' + повторов + ' ' + с.animationDuration);
                    }
                }
                return Array.from(new Set(плохо));
            });
            expect(движение, 'элементы, которые крутятся при просьбе о покое').toEqual([]);
        });
    }
});

test('скрытое остаётся скрытым: утилита видимости держится весом', async ({ page }) => {
    await page.goto('/pages/tournaments.html');
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    const видно = await page.evaluate(() => {
        const плохо = [];
        for (const el of Array.from(document.querySelectorAll('[hidden], .kslt-skryta'))) {
            if (getComputedStyle(el).display !== 'none') {
                плохо.push(el.tagName.toLowerCase() + ' ' + (el.id || el.className || '').toString().slice(0, 30));
            }
        }
        return плохо;
    });
    expect(видно, 'помеченное скрытым, но нарисованное').toEqual([]);
});

test('движение возвращается, когда покоя не просили', async ({ page }) => {
    /* Проверяем САМУ ПРОБУ: если и без отказа ничего не крутится, то первая
       проверка зелена по пустоте, а не по делу. */
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/index.html');
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    await page.waitForTimeout(400);
    const крутится = await page.evaluate(() =>
        Array.from(document.querySelectorAll('*')).filter(el => {
            const с = getComputedStyle(el);
            return с.animationName && с.animationName !== 'none' && с.animationIterationCount === 'infinite';
        }).length);
    expect(крутится, 'без просьбы о покое на главной есть бесконечные анимации').toBeGreaterThan(0);
});
