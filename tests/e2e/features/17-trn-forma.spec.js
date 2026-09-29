// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-TRN-FORMA: вкладка «Редактирование» формы турнира.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: форма рисуется из базы, и ждать
 * «сеть замолчала» здесь бессмысленно — дожидаемся появления полей.
 *
 * Админка ведётся только на русском (js/auth-nav.js:89), и виды у неё два —
 * десктоп и планшет: телефоном админку не ведут. Так записано в трекере.
 *
 * ЧТО ЗАМОРОЖЕНО ЗДЕСЬ, А НЕ ПРАВИЛАМИ: заморозка читает файл как текст и
 * не видит НИ ОДНОЙ величины. Ширина поля, высота кнопки и перелив —
 * работа теста.
 */

test.use({ storageState: require('../../auth-setup').adminState });

const ВИДЫ = [
    { имя: 'Десктоп 1512',  w: 1512, h: 900 },
    { имя: 'Планшет 1024',  w: 1024, h: 768 },
    { имя: 'Планшет 768',   w: 768,  h: 1024 }
];

/** Открыть форму создания турнира и дождаться её полей. */
async function открытьФорму(page) {
    await page.goto('/pages/admin.html#tournaments');
    // Признак, а не таймаут: кнопка появляется, когда раздел отрисован
    const добавить = page.locator('#adTrnAdd');
    await добавить.waitFor({ state: 'visible', timeout: 15000 });
    await добавить.click();
    // Форма готова, когда есть и первое поле, и карточка «Тип сетки»
    await page.locator('#adTrnCat').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#adTrnBracketType').waitFor({ state: 'visible', timeout: 15000 });
}

for (const вид of ВИДЫ) {
    test.describe(`Форма турнира — ${вид.имя}`, () => {
        test.use({ viewport: { width: вид.w, height: вид.h } });

        test(`${вид.имя}: карточка «Тип сетки» — ровно три ряда`, async ({ page }) => {
            await открытьФорму(page);
            const рядов = await page.evaluate(() => {
                const k = [...document.querySelectorAll('.ad-form-card')]
                    .find(c => c.querySelector('#adTrnBracketType'));
                return [...k.children].filter(r => r.classList.contains('ad-field-row')).length;
            });
            expect(рядов).toBe(3);
        });

        test(`${вид.имя}: ширина поля — ступень, а не остаток колонки`, async ({ page }) => {
            await открытьФорму(page);
            const ширины = await page.evaluate(() => {
                const k = [...document.querySelectorAll('.ad-form-card')]
                    .find(c => c.querySelector('#adTrnBracketType'));
                return [...k.querySelectorAll('.ad-field')]
                    .filter(p => p.offsetParent !== null)
                    .map(p => Math.round(p.getBoundingClientRect().width));
            });
            // На узком виде ряд схлопывается в одну колонку — там ступени не действуют
            const узкий = вид.w <= 640;
            if (!узкий) {
                const ступени = [160, 280, 360];
                for (const ш of ширины) {
                    expect(ступени, `ширина ${ш} не со ступени`).toContain(ш);
                }
            }
            expect(ширины.length).toBeGreaterThan(0);
        });

        test(`${вид.имя}: кнопки формы на ступени 44`, async ({ page }) => {
            await открытьФорму(page);
            const высоты = await page.evaluate(() =>
                [...document.querySelectorAll('#adTrnSave, #adTrnCancel, #adTrnDelete, #adTrnNotify')]
                    .filter(b => b.offsetParent !== null)
                    .map(b => Math.round(b.getBoundingClientRect().height)));
            expect(высоты.length).toBeGreaterThan(0);
            for (const h of высоты) expect(h).toBe(44);
        });

        test(`${вид.имя}: у каждой кнопки ниже 44 есть цель нажатия`, async ({ page }) => {
            await открытьФорму(page);
            /* МЕРЯЕМ СВОЙ КУСОК, А НЕ ВСЮ СТРАНИЦУ. Шапка сайта и боковое
               меню — закрытые куски со своей заморозкой: колокольчик и
               «Выйти» стоят 36 без слоя цели, и это их беда, записанная в
               трекер. Чужую находку нельзя чинить молча и нельзя вешать
               на свой тест: он тогда падает не на своём. */
            const без = await page.evaluate(() =>
                [...document.querySelectorAll('button')]
                    .filter(b => b.offsetParent !== null)
                    .filter(b => !b.closest('header, nav, .ad-sidebar, .nav-dropdown-menu, .site-header'))
                    .filter(b => {
                        const h = b.getBoundingClientRect().height;
                        if (h >= 44 || h === 0) return false;
                        return getComputedStyle(b, '::after').content === 'none';
                    })
                    .map(b => (b.className || 'инлайн') + ' ' + Math.round(b.getBoundingClientRect().height)));
            expect(без, 'кнопки ниже 44 без слоя цели: ' + без.join(' · ')).toEqual([]);
        });

        test(`${вид.имя}: уровень турнира виден только там, где есть очки`, async ({ page }) => {
            await открытьФорму(page);
            const виден = () => page.evaluate(() => {
                const e = document.getElementById('adTrnLevelWrap');
                return !!e && e.offsetParent !== null;
            });
            const общий = () => page.evaluate(() => {
                const e = document.getElementById('adTrnNtrpCombinedWrap');
                return !!e && e.offsetParent !== null;
            });

            // Парный — очков не даёт: уровня нет, зато есть общий NTRP
            await page.selectOption('#adTrnFormat', 'doubles');
            expect(await виден()).toBe(false);
            expect(await общий()).toBe(true);

            // Одиночный — наоборот
            await page.selectOption('#adTrnFormat', 'singles');
            expect(await виден()).toBe(true);
            expect(await общий()).toBe(false);

            // Дружеский одиночный — очков тоже нет
            const естьFriendly = await page.evaluate(() =>
                [...document.getElementById('adTrnCat').options].some(o => o.value === 'friendly'));
            if (естьFriendly) {
                await page.selectOption('#adTrnCat', 'friendly');
                expect(await виден()).toBe(false);
                const значение = await page.inputValue('#adTrnLevel');
                expect(значение, 'скрытый уровень должен обнуляться').toBe('');
            }
        });

        test(`${вид.имя}: текст не переливается из полей`, async ({ page }) => {
            await открытьФорму(page);
            const перелив = await page.evaluate(() => {
                const плохо = [];
                document.querySelectorAll('.ad-form-card .ad-field-label').forEach(l => {
                    if (l.scrollWidth > l.clientWidth + 1) плохо.push(l.textContent.trim());
                });
                return плохо;
            });
            expect(перелив, 'подписи не помещаются: ' + перелив.join(' · ')).toEqual([]);
        });
    });
}
