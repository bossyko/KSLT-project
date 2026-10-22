/**
 * КУСОК 125 — ПОЛОСА ФИЛЬТРОВ АДМИНКИ: ОДНО ПОНЯТИЕ — ОДНО ИМЯ.
 *
 * Найдено обходом «Финансов». Полос фильтров двенадцать, имён у липкости
 * было три: шесть носили `ad-filter-sticky`, ДВЕ — голое `sticky`, под
 * которое правила нет вовсе, четыре стоят без модификатора.
 *
 * Проба держит ПРИЗНАК, а не написание: имя `ad-filter-sticky` даёт
 * липкость, фон и границу, а имя без правила не даёт НИЧЕГО — и это
 * видно только замером. ИМЯ БЕЗ ПРАВИЛА ВЫГЛЯДИТ КАК РЕШЕНИЕ.
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/polosa-filtrov-zamer.html';

test.describe('полоса фильтров админки', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('живое имя даёт липкость, фон и границу', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#стало', { timeout: 15000 });
        const м = await page.evaluate(() => {
            const c = getComputedStyle(document.getElementById('стало'));
            return { position: c.position, top: c.top, фон: c.backgroundColor,
                     граница: c.borderBottomWidth, слой: c.zIndex,
                     отступы: c.paddingTop + '/' + c.paddingBottom };
        });
        expect(м.position, 'полоса фильтров перестала липнуть').toBe('sticky');
        expect(м.top, 'полоса липнет не к шапке сайта (--header-h)').toBe('64px');
        expect(м.фон, 'фон полосы пропал — список будет просвечивать сквозь неё')
            .toBe('rgb(10, 10, 10)');
        expect(м.граница, 'граница под полосой пропала').toBe('1px');
        expect(м.слой, 'полоса уйдёт под содержимое списка').toBe('20');
        expect(м.отступы, 'отступы полосы ушли с 12/12').toBe('12px/12px');
    });

    test('имя без правила не даёт ничего — и выглядит как решение', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#было', { timeout: 15000 });
        const м = await page.evaluate(() => {
            const c = getComputedStyle(document.getElementById('было'));
            return { position: c.position, фон: c.backgroundColor, граница: c.borderBottomWidth };
        });
        /* ЭТО НЕ ЖЕЛАЕМОЕ СОСТОЯНИЕ, А ДОКАЗАТЕЛЬСТВО. Если под `.sticky`
           заведут правило, эта проверка упадёт — и правильно: понятие
           снова получит два имени. ОДНО ЗЕЛЁНОЕ НЕ ДОКАЗЫВАЕТ НИЧЕГО —
           ДОКАЗЫВАЕТ РАЗНИЦА. */
        expect(м.position, 'под `.sticky` завелось правило — у липкости стало два имени')
            .toBe('static');
        expect(м.фон, 'под `.sticky` завелось правило: появился фон').toBe('rgba(0, 0, 0, 0)');
        expect(м.граница, 'под `.sticky` завелось правило: появилась граница').toBe('0px');
    });

});
