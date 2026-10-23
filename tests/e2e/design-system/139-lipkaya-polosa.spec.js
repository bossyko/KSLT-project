/**
 * КУСОК 139 — ЛИПКОСТЬ ПОЛОСЫ ФИЛЬТРОВ ДОКАЗАНА, А НЕ ОБЪЯВЛЕНА.
 *
 * Вопрос Кости стоял с куска 131: липнет ли полоса фильтров «Транзакций».
 * На самом экране это нечем проверить — список короче окна, прокручивать
 * нечего, и запись висела «не доказано ни в ту, ни в другую сторону».
 *
 * Стенд `maket/polosa-filtrov-zamer.html` воспроизводит ПРОДУКТОВУЮ
 * ЦЕПОЧКУ: `.ad-section.active` вокруг полосы (её `overflow: visible`
 * снимает капкан прокручиваемого предка) и список в 60 строк. Админка за
 * входом, поэтому сам экран меряется стендом — но стенд обязан быть
 * НЕУДОБНЫМ: короткий список и голая обёртка доказали бы только себя.
 *
 * ЛИПКОЕ ЛИПНЕТ К ПРОКРУЧИВАЕМОМУ ПРЕДКУ, А НЕ К ОКНУ — этот капкан уже
 * ловили на липкой шапке турнира, где при прокрутке на 800 она уезжала
 * на -423. Поэтому проба мерит ПОЛОЖЕНИЕ ПРИ ПРОКРУТКЕ, а не наличие
 * `position: sticky` в стилях: свойство может стоять и не работать.
 */
const { test, expect } = require('@playwright/test');

test.describe('липкая полоса фильтров', () => {

    test('полоса встаёт на высоту шапки и не уезжает', async ({ page }) => {
        await page.goto('/maket/polosa-filtrov-zamer.html');
        await page.waitForSelector('#липкая', { timeout: 15000 });

        const м = await page.evaluate(async () => {
            const полоса = document.getElementById('липкая');
            const шапка = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h'), 10);
            const замеры = [];
            for (const сдвиг of [0, 600, 1200, 2000]) {
                window.scrollTo(0, сдвиг);
                await new Promise(р => requestAnimationFrame(() => requestAnimationFrame(р)));
                замеры.push({ прокрутка: Math.round(window.scrollY),
                              верх: Math.round(полоса.getBoundingClientRect().top) });
            }
            window.scrollTo(0, 0);
            return {
                шапка: шапка,
                позиция: getComputedStyle(полоса).position,
                предок: getComputedStyle(document.getElementById('цепочка')).overflow,
                высота: document.body.scrollHeight,
                окно: window.innerHeight,
                замеры: замеры
            };
        });

        /* СТЕНД ОБЯЗАН БЫТЬ ДЛИННЕЕ ОКНА, иначе мерить нечего. */
        expect(м.высота, 'стенд короче окна — прокручивать нечего').toBeGreaterThan(м.окно * 2);
        expect(м.позиция, 'полоса перестала быть липкой').toBe('sticky');
        expect(м.предок, 'предок полосы стал прокручиваемым — липкость исчезнет молча').toBe('visible');

        /* ДО ПРИЛИПАНИЯ полоса едет вместе со страницей, ПОСЛЕ — стоит. */
        const прилипшие = м.замеры.filter(з => з.прокрутка >= 600);
        for (const з of прилипшие) {
            expect(з.верх, 'при прокрутке ' + з.прокрутка + ' полоса не на высоте шапки')
                .toBe(м.шапка);
        }
        expect(прилипшие.length, 'нечего проверять: все замеры до прилипания')
            .toBeGreaterThanOrEqual(2);
    });

    test('полоса видна целиком, а не уехала под шапку', async ({ page }) => {
        await page.goto('/maket/polosa-filtrov-zamer.html');
        await page.waitForSelector('#липкая', { timeout: 15000 });
        const видна = await page.evaluate(async () => {
            window.scrollTo(0, 1500);
            await new Promise(р => requestAnimationFrame(() => requestAnimationFrame(р)));
            const r = document.getElementById('липкая').getBoundingClientRect();
            return { верх: Math.round(r.top), низ: Math.round(r.bottom), окно: window.innerHeight };
        });
        expect(видна.верх >= 0, 'верх полосы ушёл за край окна').toBe(true);
        expect(видна.низ <= видна.окно, 'низ полосы ушёл за край окна').toBe(true);
    });
});
