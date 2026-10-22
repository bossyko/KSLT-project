/**
 * КУСОК 126 — РУКОДЕЛЬНОЕ ОКНО В ОБЩЕЙ ОБОЛОЧКЕ.
 *
 * Сторож читает файл. Эта проба читает ЭКРАН и держит замеренное 22.10:
 * окно, поднятое оболочкой, получает `role`, подпись диктору, фокус
 * внутрь, Esc и возврат фокуса звавшему, а его закрывашка — цель
 * нажатия 44 прозрачным слоем, при том же размере знака 20×26.
 *
 * До перевода (замер на боевой): role нет, aria-modal нет, фокус на
 * `body`, Esc не закрывает, фокус звавшему не возвращается.
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/okno-rukodelnoe-zamer.html';

async function открыть(page) {
    await page.goto(СТЕНД);
    await page.waitForSelector('#звал', { timeout: 15000 });
    await page.focus('#звал');
    await page.click('#звал');
    await page.waitForSelector('.ad-confirm-overlay .ad-modal', { timeout: 15000 });
}

test.describe('рукодельное окно в общей оболочке', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('окно называет себя диктору и забирает фокус', async ({ page }) => {
        await открыть(page);
        const м = await page.evaluate(() => {
            const окно = document.querySelector('.ad-confirm-overlay .ad-modal');
            return {
                role: окно.getAttribute('role') || 'НЕТ',
                modal: окно.getAttribute('aria-modal') || 'НЕТ',
                подписьId: окно.getAttribute('aria-labelledby') || 'НЕТ',
                подписьЕсть: !!document.getElementById(окно.getAttribute('aria-labelledby') || ''),
                фокусВнутри: окно.contains(document.activeElement) || окно === document.activeElement,
            };
        });
        expect(м.role, 'окно перестало быть диалогом для диктора').toBe('dialog');
        expect(м.modal, 'диктор снова читает страницу под окном').toBe('true');
        expect(м.подписьId, 'окно потеряло подпись').not.toBe('НЕТ');
        expect(м.подписьЕсть, 'подпись ссылается на узел, которого нет').toBe(true);
        expect(м.фокусВнутри, 'фокус остался снаружи — с клавиатуры в окно не попасть')
            .toBe(true);
    });

    test('закрывашка сохранила вид и получила цель нажатия 44', async ({ page }) => {
        await открыть(page);
        const м = await page.evaluate(() => {
            const з = document.querySelector('.ad-confirm-overlay .ad-modal-close');
            const r = з.getBoundingClientRect(), п = getComputedStyle(з, '::before');
            return { ш: Math.round(r.width), в: Math.round(r.height),
                     слой: п.width + 'x' + п.height, слойПоложение: п.position,
                     подпись: з.getAttribute('aria-label') || '' };
        });
        /* ВИД НЕ МЕНЯЕТСЯ: знак тех же 20×26, замерено до правки на боевой. */
        expect(м.ш, 'знак закрывашки изменился по ширине').toBe(20);
        expect(м.в, 'знак закрывашки изменился по высоте').toBe(26);
        expect(м.слой, 'цель нажатия закрывашки ушла с 44').toBe('44pxx44px');
        expect(м.слойПоложение, 'слой вернулся в поток и сдвинет знак').toBe('absolute');
        expect(м.подпись, 'закрывашка снова безымянная — диктор прочитает «✕»').not.toBe('');
    });

    test('Esc закрывает окно и возвращает фокус звавшему', async ({ page }) => {
        await открыть(page);
        await page.keyboard.press('Escape');
        await page.waitForSelector('.ad-confirm-overlay', { state: 'detached', timeout: 15000 });
        const кто = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
        expect(кто, 'фокус не вернулся звавшей кнопке — клавиатура начнёт обход страницы с начала')
            .toBe('звал');
    });

});
