/**
 * КУСОК 140 — БЛИЗНЕЦЫ СВЕДЕНЫ В ДВА ДОМА.
 *
 * Сторож читает файлы и видит, что поведение осталось в одном месте.
 * Эта проба читает ЭКРАН: что сведённое поведение РАБОТАЕТ на всех трёх
 * витринах — шаг совпадает с числом карточек, полоса листает, уровень
 * доступа отвечает одним из трёх слов и помнит ответ.
 *
 * ДАННЫЕ РЕШАЮТ, ЧТО ВИДНО: у «Тренеров» и «Партнёров» карточек меньше
 * одной страницы, и полосы там нет по делу. Поэтому листание проверяется
 * там, где есть что листать, а на остальных проверяется шаг — и это
 * сказано вслух, а не подогнано.
 */
const { test, expect } = require('@playwright/test');

const ВИТРИНЫ = [
    ['Корты',    '/pages/courts.html',   '.ct-grid', '--ct-ryadov'],
    ['Тренеры',  '/pages/coaches.html',  '.co-grid', '--co-ryadov'],
    ['Партнёры', '/pages/partners.html', '.pt-grid', '--pt-ryadov']
];

async function дома(page) {
    await page.waitForFunction(() => !!window.KSLT_VITRINA && !!window.KSLT_DOSTUP,
        null, { timeout: 15000 });
}

test.describe('близнецы сведены в дома', () => {

    for (const [имя, адрес, сетка, ряды] of ВИТРИНЫ) {

        test(имя + ': шаг считает дом, и он совпадает с числом карточек', async ({ page }) => {
            await page.goto(адрес);
            await дома(page);
            await page.waitForSelector(сетка, { timeout: 15000 });

            const м = await page.evaluate(async ([с, р]) => {
                await new Promise(ок => setTimeout(ок, 800));
                return {
                    шаг: window.KSLT_VITRINA.шаг(с, р),
                    карточек: document.querySelectorAll(с + ' > *').length,
                    всегоКнопок: document.querySelectorAll('.pl-page-btn').length
                };
            }, [сетка, ряды]);

            expect(м.шаг, 'дом вернул нулевой шаг — сетка не разложена').toBeGreaterThan(0);
            /* НА СТРАНИЦЕ НЕ БОЛЬШЕ ШАГА: больше — значит шаг посчитан не тем. */
            expect(м.карточек, 'карточек больше, чем шаг страницы').toBeLessThanOrEqual(м.шаг);
            /* ПОЛОСА ЕСТЬ ТОЛЬКО ТОГДА, КОГДА СТРАНИЦ БОЛЬШЕ ОДНОЙ. */
            if (м.карточек < м.шаг) {
                expect(м.всегоКнопок, 'список короче страницы, а полоса нарисована').toBe(0);
            }
        });
    }

    test('Корты: полоса страниц листает список', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await дома(page);
        await page.waitForSelector('.ct-grid', { timeout: 15000 });

        const м = await page.evaluate(async () => {
            await new Promise(ок => setTimeout(ок, 900));
            const первый = (document.querySelector('.ct-grid > *') || {}).textContent || '';
            const вперёд = document.querySelector('.pl-page-next');
            if (!вперёд || вперёд.disabled) return { листали: false };
            вперёд.click();
            await new Promise(ок => setTimeout(ок, 700));
            const второй = (document.querySelector('.ct-grid > *') || {}).textContent || '';
            return { листали: true, сменился: первый.slice(0, 60) !== второй.slice(0, 60) };
        });

        /* ЕСЛИ ЛИСТАТЬ НЕЧЕГО — проба говорит об этом, а не молчит зелёным. */
        expect(м.листали, 'на «Кортах» не оказалось второй страницы: мерить нечем').toBe(true);
        expect(м.сменился, 'нажали «вперёд», а список остался прежним').toBe(true);
    });

    test('уровень доступа отвечает одним из трёх слов и помнит ответ', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await дома(page);
        const м = await page.evaluate(async () => {
            const первый = await window.KSLT_DOSTUP.уровень();
            const второй = await window.KSLT_DOSTUP.уровень();
            return { первый: первый, второй: второй };
        });
        expect(['guest', 'registered', 'member'], 'дом вернул неизвестный уровень')
            .toContain(м.первый);
        expect(м.второй, 'второй зов дал другой ответ — память дома не работает')
            .toBe(м.первый);
    });
});
