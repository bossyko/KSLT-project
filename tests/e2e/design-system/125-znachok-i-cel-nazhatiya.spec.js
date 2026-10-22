/**
 * КУСОК 124 — ЗНАЧКОВАЯ КНОПКА АДМИНКИ И ЦЕЛЬ НАЖАТИЯ 44.
 *
 * Сторож читает файл. Эта проба читает ЭКРАН и держит замеренное 22.10:
 * значок 36 (ступень --btn-h-sm, прежде 32 — мимо шкалы), зона нажатия
 * ровно 44×44 прозрачным слоем, значки в ячейке стоят В РЯД с зазором 8,
 * и ни один слой не накрывает соседнюю кнопку или поле.
 *
 * Стенд рисует семь окружений выпиской из продукта, с адресами строк.
 * СТЕНД, РИСУЮЩИЙ СВОЮ КОПИЮ, МЕРИТ СТЕНД — поэтому сторож сверяет
 * каждую выписку с файлом, а проба мерит то, что стенд показал.
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/znachok-zamer.html';

async function снять(page) {
    return page.evaluate(() => {
        const значки = [...document.querySelectorAll('.ad-btn-icon')].map(b => {
            const r = b.getBoundingClientRect(), s = getComputedStyle(b);
            const пс = getComputedStyle(b, '::before');
            const зш = Math.max(r.width, parseFloat(пс.width) || 0);
            const зв = Math.max(r.height, parseFloat(пс.height) || 0);
            /* ПЕРЕКРЫТИЕ ИЩЕТСЯ НАЖАТИЕМ, А НЕ АРИФМЕТИКОЙ: спрашиваем у
               страницы, кто отвечает в углах и по центру зоны. */
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            let чужое = '';
            for (const dx of [-зш / 2 + 1, 0, зш / 2 - 1]) {
                for (const dy of [-зв / 2 + 1, 0, зв / 2 - 1]) {
                    const э = document.elementFromPoint(cx + dx, cy + dy);
                    if (!э || э === b || b.contains(э)) continue;
                    if (э.matches('button, input, a, label, select, textarea')) {
                        чужое = э.tagName.toLowerCase() +
                            (э.className ? '.' + String(э.className).split(' ')[0] : '');
                    }
                }
            }
            return {
                имя: b.className.replace('ad-btn-icon', '').trim() || '(без своего)',
                ш: Math.round(r.width), в: Math.round(r.height),
                зона: Math.round(зш) + '×' + Math.round(зв),
                слой: пс.position, рамка: s.borderTopStyle, жмётся: s.flexShrink,
                опора: s.position, кегль: s.fontSize,
                aria: b.getAttribute('aria-label') || '', чужое,
            };
        });
        const ряды = [...document.querySelectorAll('.ad-icon-row')]
            .map(р => [...р.querySelectorAll('.ad-btn-icon')])
            .filter(к => к.length >= 2)
            .map(к => {
                const a = к[0].getBoundingClientRect(), b = к[1].getBoundingClientRect();
                return {
                    встолбик: Math.abs(a.top - b.top) >= 2,
                    зазор: Math.round(b.left - a.right),
                };
            });
        return { значки, ряды, прокрутка: document.documentElement.scrollWidth > innerWidth };
    });
}

test.describe('значковая кнопка админки', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('значок стоит на ступени, а его цель нажатия — 44', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-btn-icon', { timeout: 15000 });
        const м = await снять(page);
        /* ПРОВЕРКА, КОТОРАЯ ИЩЕТ В ПУСТОМ СПИСКЕ, ЗЕЛЕНЕЕТ ВСЕГДА. */
        expect(м.значки.length, 'стенд не нарисовал значки').toBe(10);
        for (const з of м.значки) {
            expect(з.ш, з.имя + ': ширина ушла с 36 (--btn-h-sm)').toBe(36);
            expect(з.в, з.имя + ': высота ушла с 36 (--btn-h-sm)').toBe(36);
            expect(з.зона, з.имя + ': зона нажатия перестала быть 44×44').toBe('44×44');
            expect(з.слой, з.имя + ': слой нажатия вернулся в поток и толкает знак')
                .toBe('absolute');
            expect(з.опора, з.имя + ': значок перестал быть опорой своего слоя')
                .toBe('relative');
            expect(з.жмётся, з.имя + ': значок снова жмётся в тесной строке').toBe('0');
            expect(з.рамка, з.имя + ': рамка вернулась — её не было и до свёртки')
                .toBe('none');
        }
    });

    test('ни один слой нажатия не накрывает соседа', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-btn-icon', { timeout: 15000 });
        const м = await снять(page);
        expect(м.значки.length, 'стенд не нарисовал значки').toBe(10);
        for (const з of м.значки) {
            expect(з.чужое, з.имя + ': слой 44 накрыл чужое нажимаемое — ' + з.чужое +
                '. Так было с вариантом A: «Отозвать» съедал верх «Удалить рассылку»')
                .toBe('');
        }
    });

    test('каждый значок называет себя диктору', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-btn-icon', { timeout: 15000 });
        const м = await снять(page);
        expect(м.значки.length, 'стенд не нарисовал значки').toBe(10);
        for (const з of м.значки) {
            expect(з.aria, з.имя + ': значок снова безымянный — диктор прочитает ' +
                'сам знак, «×» или «↩», и человек не узнает, что одна из этих ' +
                'кнопок удаляет рассылку').not.toBe('');
        }
        /* ИМЯ ПРОВЕРЯЕТСЯ РОЛЬЮ, А НЕ АТРИБУТОМ. Атрибут читает файл,
           роль — дерево доступности, то самое, которым идёт диктор. */
        await expect(page.getByRole('button', { name: 'Удалить рассылку', exact: true }))
            .toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Убрать достижение', exact: true }))
            .toHaveCount(1);
    });

    test('два значка в ячейке стоят в ряд, а не столбиком', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('.ad-icon-row', { timeout: 15000 });
        const м = await снять(page);
        expect(м.ряды.length, 'стенд не нарисовал ни одной ячейки с двумя значками')
            .toBe(3);
        for (const р of м.ряды) {
            expect(р.встолбик, 'значки снова встали столбиком: значок — flex-контейнер, ' +
                'то есть блок, и без обёртки он занимает всю строку').toBe(false);
            expect(р.зазор, 'зазор между значками ушёл с 8 — на нём держится цель 44')
                .toBe(8);
        }
        expect(м.прокрутка, 'ряд значков развёл страницу по горизонтали').toBe(false);
    });

});
