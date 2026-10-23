/**
 * КУСОК 131 — СЕМЬ НАХОДОК ОБХОДА.
 *
 * Сторож читает файлы. Эта проба читает ЭКРАН и держит то, что на нём
 * видно: цель нажатия у мелкой кнопки и колонку, названную значком.
 *
 * ЗАМЕРЕНО НА БОЕВОЙ 22.10: десять кнопок «Редактировать» у спонсоров
 * ростом 36 — ступень верна, цель нажатия 44 не выполнена. Колонки «👁»,
 * «👍», «🗳️» диктор читает как картинку.
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/sem-nahodok-zamer.html';

test.describe('семь находок обхода', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('мелкая кнопка сохранила вид и получила цель 44', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#мелкая', { timeout: 15000 });
        const м = await page.evaluate(() => {
            const к = document.getElementById('мелкая');
            const r = к.getBoundingClientRect(), п = getComputedStyle(к, '::before');
            return { в: Math.round(r.height), слой: п.height, слойПоложение: п.position,
                     опора: getComputedStyle(к).position };
        });
        /* ВЫСОТА 36 ВЕРНА — это ступень --btn-h-sm. Мимо нормы была цель. */
        expect(м.в, 'мелкая кнопка ушла со ступени 36').toBe(36);
        expect(м.слой, 'цель нажатия мелкой кнопки ушла с 44').toBe('44px');
        expect(м.слойПоложение, 'слой вернулся в поток и сдвинет кнопку').toBe('absolute');
        expect(м.опора, 'кнопка перестала быть опорой своего слоя').toBe('relative');
    });

    test('колонка со значком говорит слово диктору, не меняя вида', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#глаз', { timeout: 15000 });
        const м = await page.evaluate(() => {
            const th = document.getElementById('глаз');
            const знак = th.querySelector('[aria-hidden="true"]');
            const слово = th.querySelector('.ad-tolko-diktoru');
            const r = слово ? слово.getBoundingClientRect() : null;
            return { знак: знак ? знак.textContent : '', скрытОтДиктора: знак ? знак.getAttribute('aria-hidden') : '',
                     слово: слово ? слово.textContent : '', ширинаСлова: r ? Math.round(r.width) : -1 };
        });
        expect(м.знак, 'значок пропал с экрана').toBeTruthy();
        expect(м.скрытОтДиктора, 'значок снова читается диктором как картинка').toBe('true');
        expect(м.слово, 'слово для диктора пропало — колонка снова безымянна').toBeTruthy();
        /* ВИД НЕ МЕНЯЕТСЯ: слово вынесено за экран, а не показано рядом. */
        expect(м.ширинаСлова, 'слово стало видно глазами — колонка поедет').toBeLessThan(3);
    });

});
