/**
 * КУСОК 119 — ЧЕКБОКС МАССОВОГО ВЫБОРА ПОСЛЕ СНЯТИЯ ИНЛАЙНА.
 *
 * Сторож читает файл. Эта проба читает ЭКРАН и держит ЗАМЕРЕННОЕ 22.10:
 * снятие инлайна и ДВУХ важностей не изменило ничего.
 *
 * Стенд рисует строку НАСТОЯЩЕЙ `A.bulkCheckboxTd` — уедет разметка
 * продукта, уедет и стенд. СТЕНД, РИСУЮЩИЙ СВОЮ КОПИЮ, МЕРИТ СТЕНД.
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/chekboks-zamer.html';
const ЛАЙМ = 'rgb(204, 255, 0)';
const ЧЁРНЫЙ = 'rgb(0, 0, 0)';

async function снять(page) {
    return page.evaluate(() => {
        const один = сел => {
            const э = document.querySelector(сел);
            if (!э) return { нет: true };
            const s = getComputedStyle(э), r = э.getBoundingClientRect();
            return {
                ш: Math.round(r.width), в: Math.round(r.height),
                курсор: s.cursor, appearance: s.appearance,
                рамка: s.borderTopWidth, краскаРамки: s.borderTopColor,
                радиус: s.borderTopLeftRadius, фон: s.backgroundColor,
                цель: getComputedStyle(э, '::before').width + '×' + getComputedStyle(э, '::before').height,
                галочка: getComputedStyle(э, '::after').content,
                цветГалочки: getComputedStyle(э, '::after').color,
                инлайн: э.getAttribute('style') || '',
            };
        };
        return { шапка: один('.ad-bulk-all'), строка: один('.ad-bulk-item') };
    });
}

test.describe('чекбокс массового выбора', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('пустой чекбокс стоит на замеренных числах', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-bulk-item', { timeout: 15000 });
        const м = await снять(page);
        for (const имя of ['шапка', 'строка']) {
            const э = м[имя];
            expect(э.нет, имя + ': чекбокс не нарисовался').toBeFalsy();
            expect(э.ш, имя + ': ширина ушла с 18').toBe(18);
            expect(э.в, имя + ': высота ушла с 18').toBe(18);
            expect(э.курсор, имя + ': курсор перестал быть pointer').toBe('pointer');
            expect(э.appearance, имя + ': нативный чекбокс вернулся — тогда и ' +
                '`accent-color` снова что-то красит').toBe('none');
            expect(э.рамка, имя + ': рамка ушла с 2px').toBe('2px');
            expect(э.краскаРамки, имя + ': рамка перестала быть лаймовой').toBe(ЛАЙМ);
            expect(э.радиус, имя + ': радиус ушёл с 4px').toBe('4px');
            expect(э.цель, имя + ': цель нажатия 44 потеряна (решение 04.10)').toBe('44px×44px');
            expect(э.инлайн, имя + ': инлайн вернулся — ' + э.инлайн).toBe('');
        }
    });

    test('отмеченный чекбокс красится своим css, а не accent-color', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-bulk-item', { timeout: 15000 });
        await page.evaluate(() => window.ОТМЕТИТЬ());
        const м = await снять(page);
        for (const имя of ['шапка', 'строка']) {
            const э = м[имя];
            expect(э.фон, имя + ': фон отмеченного перестал быть лаймовым').toBe(ЛАЙМ);
            expect(э.галочка, имя + ': галочка пропала').toBe('"✓"');
            expect(э.цветГалочки, имя + ': галочка перестала быть чёрной').toBe(ЧЁРНЫЙ);
        }
    });

    test('неполный выбор отличим от пустого', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-bulk-all', { timeout: 15000 });
        await page.evaluate(() => window.НЕПОЛНЫЙ());
        const м = await снять(page);
        /* РЕШЕНИЕ, ЗАПИСАННОЕ В CSS: «отметишь одну строку из тридцати —
           шапка пустая, как будто не выбрано ничего». */
        expect(м.шапка.фон, 'неполный выбор снова неотличим от пустого').toBe(ЛАЙМ);
        expect(м.шапка.галочка, 'неполный выбор потерял своё тире').toBe('"–"');
    });

});
