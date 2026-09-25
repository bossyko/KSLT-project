/**
 * СУДЕЙСКИЙ ЭКРАН — решения Кости 24.09 и 25.09.
 *
 * ПЕРЕПИСАН 25.09. Прежняя редакция не нажимала ни одной кнопки: каждая
 * писала в базу живого матча, и нажать значило испортить настоящий счёт.
 * Поэтому она проверяла только то, что видно без нажатия, — и пропустила
 * главное: окно метки «Эйс / Двойная» не открывалось НИ РАЗУ.
 *
 * ТЕПЕРЬ ТЕСТ ИДЁТ ПО СТЕНДУ `maket/sudya-zamer.html`, где `supabaseClient`
 * подменён заглушкой: разметку рисует НАСТОЯЩИЙ js/umpire.js, краски —
 * НАСТОЯЩИЙ css/umpire.css, а все rpc уходят в никуда. Кнопки нажимать
 * можно, и поведение наконец проверяется поведением.
 *
 * ЭКРАН ОДНОЯЗЫЧНЫЙ — решение Кости 25.09: он закрытый, служебный,
 * открывается по ключу, судьи русскоязычные. Поэтому трёх языков тут нет, и
 * это решение, а не пропуск.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: признак — что табло отрисовано.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = v => '/maket/sudya-zamer.html?key=stend&v=' + v;

/** Телефон боком показывает «Поверните телефон» — судейского экрана там нет. */
async function боком(page) {
    return page.evaluate(() => getComputedStyle(document.getElementById('um-app')).display === 'none');
}

async function открыть(page, вид) {
    await page.goto(СТЕНД(вид || 'live'));
    await page.waitForFunction(
        () => !!document.querySelector('.um-scoreboard .um-player-name') ||
              getComputedStyle(document.getElementById('um-app')).display === 'none',
        null, { timeout: 15000 });
}

const счёт = page => page.evaluate(() =>
    [...document.querySelectorAll('.um-player-row')].map(р => ({
        геймы: р.querySelector('.um-games').textContent,
        очки:  р.querySelector('.um-points').textContent
    })));

test.describe('судейский экран', () => {

    /* ══ ВИД ══════════════════════════════════════════════════════════════ */

    test('имя игрока видно целиком, а не обрезано', async ({ page }) => {
        await открыть(page, 'dlinnye');
        if (await боком(page)) return;
        const обрезано = await page.evaluate(() =>
            [...document.querySelectorAll('.um-player-name')]
                .map(э => э.scrollWidth > э.clientWidth + 1));
        expect(обрезано.length).toBeGreaterThan(0);
        expect(обрезано.every(о => о === false),
            'какое-то имя не помещается в свою коробку').toBe(true);
    });

    test('судья видит, какой матч ведёт', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const шапка = await page.locator('.um-match-players').textContent();
        expect(шапка.trim().length).toBeGreaterThan(3);
        expect(шапка).toContain('—');
    });

    test('счёт крупнее имени игрока на любом виде', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const л = await page.evaluate(() => {
            const к = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
            return { очки: к('.um-points'), имя: к('.um-player-name') };
        });
        expect(л.очки).toBeGreaterThan(л.имя);
    });

    test('ни одного эмодзи на экране', async ({ page }) => {
        await открыть(page);
        const текст = await page.evaluate(() => document.body.innerText);
        expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(текст),
            'эмодзи рисует операционная система, и размер нам не подчиняется').toBe(false);
    });

    /* ══ МИШЕНЬ ═══════════════════════════════════════════════════════════ */

    test('мишень — доля экрана, а не остаток вёрстки', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const { кнопка, экран } = await page.evaluate(() => ({
            кнопка: document.querySelector('.um-btn-p1').getBoundingClientRect().height,
            экран: window.innerHeight
        }));
        const доля = кнопка / экран;
        expect(доля, 'мишень ' + Math.round(доля * 100) + '% высоты').toBeGreaterThan(0.25);
        expect(доля, 'мишень ' + Math.round(доля * 100) + '% высоты').toBeLessThan(0.5);
    });

    test('МИШЕНЬ ОДНА И ТА ЖЕ В ЛЮБОМ СОСТОЯНИИ', async ({ page }) => {
        const высоты = [];
        for (const вид of ['live', 'tb', 'dlinnye']) {
            await открыть(page, вид);
            if (await боком(page)) return;
            высоты.push(Math.round(await page.evaluate(() =>
                document.querySelector('.um-btn-p1').getBoundingClientRect().height)));
        }
        expect(new Set(высоты).size,
            'кнопка очка гуляет по состояниям: ' + высоты.join(' / ') +
            ' — мышечная память судьи опирается на неё сильнее всего').toBe(1);
    });

    test('экран влезает целиком в любом состоянии', async ({ page }) => {
        for (const вид of ['live', 'razminka', 'tb', 'zavershen', 'dlinnye']) {
            await открыть(page, вид);
            const лишнее = await page.evaluate(() =>
                document.documentElement.scrollHeight - window.innerHeight);
            expect(лишнее, 'вид «' + вид + '» вылезает на ' + лишнее + ' пикселей').toBeLessThanOrEqual(1);
        }
    });

    /* ══ ПОВОРОТ ══════════════════════════════════════════════════════════ */

    test('телефон боком просит повернуть, а не показывает кривой экран', async ({ page }) => {
        await открыть(page);
        if (!(await боком(page))) return;
        await expect(page.locator('.um-turn')).toBeVisible();
        await expect(page.locator('.um-turn p')).toHaveText(/Поверните/);
    });

    /* ══ ЭЙС И ДВОЙНАЯ — ЭТО ОЧКО ═════════════════════════════════════════ */

    test('кнопки эйса и двойной стоят ПОСТОЯННО, а не после очка', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await expect(page.locator('#umAce')).toBeVisible();
        await expect(page.locator('#umDouble')).toBeVisible();
    });

    test('ЭЙС ДАЁТ ОЧКО ПОДАЮЩЕМУ', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const до = await счёт(page);
        await page.locator('#umAce').click();
        await page.waitForTimeout(250);
        const после = await счёт(page);
        expect(до[0].очки, 'стенд отдаёт 40–30 у подающего').toBe('40');
        expect(после[0].геймы, 'подающий должен взять гейм с 40')
            .not.toBe(до[0].геймы);
    });

    test('ДВОЙНАЯ ДАЁТ ОЧКО ПРИНИМАЮЩЕМУ', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const до = await счёт(page);
        await page.locator('#umDouble').click();
        await page.waitForTimeout(250);
        const после = await счёт(page);
        expect(после[1].очки, 'очко принимающего не выросло: было ' +
            до[1].очки + ', стало ' + после[1].очки).not.toBe(до[1].очки);
    });

    test('под кнопками стоят имена, и они разные', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const имена = await page.evaluate(() =>
            [...document.querySelectorAll('.um-btn-mark span')].map(э => э.textContent.trim()));
        expect(имена).toHaveLength(2);
        expect(имена[0]).not.toBe(имена[1]);
        expect(имена[0]).toMatch(/очко · .+/);
    });

    test('ПОЛОЖЕНИЕ кнопок от подачи не зависит: эйс всегда слева', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const л = await page.evaluate(() => ({
            эйс: document.getElementById('umAce').getBoundingClientRect().left,
            двойная: document.getElementById('umDouble').getBoundingClientRect().left
        }));
        expect(л.эйс, 'судья жмёт не глядя — место меняться не имеет права')
            .toBeLessThan(л.двойная);
    });

    test('отмена возвращает счёт как было', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const до = await счёт(page);
        await page.locator('#umP2').click();
        await page.waitForTimeout(250);
        await page.locator('#umUndo').click();
        await page.waitForTimeout(250);
        expect(await счёт(page)).toEqual(до);
    });

    /* ══ ПЕРЕРЫВЫ ═════════════════════════════════════════════════════════ */

    test('«Перерыв» спрашивает причину, и причин ровно четыре', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await page.locator('#umPause').click();
        await expect(page.locator('.um-why')).toBeVisible();
        const причины = page.locator('.um-btn-why:not(.um-btn-why-cancel)');
        await expect(причины).toHaveCount(4);
    });

    test('ПАУЗА НАЗЫВАЕТ СЕБЯ', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await page.locator('#umPause').click();
        await page.locator('[data-why="medical"]').click();
        await page.waitForTimeout(250);
        const полоса = await page.locator('.um-status').textContent();
        expect(полоса, 'в базе дождь не должен быть неотличим от травмы')
            .toMatch(/Пауза · /);
    });

    test('ОЧКО СНИМАЕТ ПАУЗУ', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await page.locator('#umPause').click();
        await page.locator('[data-why="weather"]').click();
        await page.waitForTimeout(250);
        await page.locator('#umP1').click();
        await page.waitForTimeout(250);
        const полоса = await page.locator('.um-status').textContent();
        expect(полоса, 'судья, забывший «Продолжить», вёл бы матч «на паузе»')
            .not.toMatch(/Пауза/);
    });

    test('отмена причины ничего не меняет', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const до = await page.locator('.um-status').textContent();
        await page.locator('#umPause').click();
        await page.locator('.um-btn-why-cancel').click();
        await page.waitForTimeout(250);
        await expect(page.locator('.um-why')).toHaveCount(0);
        expect(await page.locator('.um-status').textContent()).toBe(до);
    });

    /* ══ ДОСТУПНОСТЬ ══════════════════════════════════════════════════════ */

    test('цели нажатия не мельче 44', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        const мелкие = await page.evaluate(() =>
            [...document.querySelectorAll('button')]
                .map(б => ({ т: б.id || б.textContent.trim().slice(0, 14),
                             в: Math.round(б.getBoundingClientRect().height),
                             ш: Math.round(б.getBoundingClientRect().width) }))
                .filter(б => б.в > 0 && (б.в < 44 || б.ш < 44)));
        expect(мелкие, JSON.stringify(мелкие)).toHaveLength(0);
    });

    test('кольцо фокуса появляется при ходьбе клавишами', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await page.keyboard.press('Tab');
        const кольцо = await page.evaluate(() => {
            const э = document.activeElement;
            if (!э || э.tagName !== 'BUTTON') return null;
            const с = getComputedStyle(э);
            return { ширина: с.outlineWidth, стиль: с.outlineStyle };
        });
        expect(кольцо, 'после Tab фокус должен стоять на кнопке').not.toBeNull();
        expect(parseFloat(кольцо.ширина), 'WCAG 2.4.7').toBeGreaterThan(0);
        expect(кольцо.стиль).not.toBe('none');
    });

    test('табло — живая область для диктора', async ({ page }) => {
        await открыть(page);
        if (await боком(page)) return;
        await expect(page.locator('.um-scoreboard')).toHaveAttribute('aria-live', 'polite');
    });

    test('ЗУМ НА БОЕВОЙ СТРАНИЦЕ НЕ ЗАПРЕЩЁН', async ({ page }) => {
        await page.goto('/pages/umpire.html');
        const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(meta, 'user-scalable=no валит WCAG 1.4.4').not.toContain('user-scalable=no');
    });
});
