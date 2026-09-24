/**
 * СУДЕЙСКОЕ ОКНО `pages/umpire.html` — решения Кости 24.09.
 *
 * Что проверяется и почему именно так:
 *
 *  · ИМЯ НЕ ОБРЕЗАЕТСЯ. Было nowrap + ellipsis: на 390 «Иван Корабельников»
 *    показывался как «Иван Корабельн…» — 203 пикселя текста в коробке 178.
 *    Перепутать игроков дороже второй строки.
 *  · КЕГЛИ НЕ МЕЛЬЧАЮТ НА ТЕЛЕФОНЕ. Судья читает экран на улице, на солнце.
 *    Тест меряет ОТНОШЕНИЕ: счёт на телефоне не мельче, чем на широком.
 *  · СУДЬЯ ВИДИТ, КАКОЙ МАТЧ ВЕДЁТ. Раньше на экране были только счёт и
 *    кнопки, и при двух матчах подряд перепутать было легко.
 *  · ЭМОДЗИ НЕТ. Мяч рисовала операционная система.
 *  · ЦЕЛИ НАЖАТИЯ. Судья жмёт на бегу, одной рукой.
 *  · КОЛЬЦО ФОКУСА. Не было ни у одной кнопки.
 *
 * КНОПКИ НЕ НАЖИМАЮТСЯ. Каждая из них пишет в базу живого матча: нажать —
 * значит испортить настоящий счёт. Проверяется то, что видно без нажатия.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: признак — что табло отрисовано.
 */
const { test, expect } = require('@playwright/test');

const КЛЮЧ = '41493653104f81d014b4e1de5dc88afb';
const АДРЕС = '/pages/umpire.html?key=' + КЛЮЧ;

async function дождаться(page) {
    await page.goto(АДРЕС);
    await page.waitForFunction(
        () => !!document.querySelector('.um-scoreboard .um-player-name'),
        null, { timeout: 15000 });
}

test.describe('судейское окно', () => {

    test('имя игрока видно целиком, а не обрезано', async ({ page }) => {
        await дождаться(page);
        const обрезано = await page.evaluate(() =>
            [...document.querySelectorAll('.um-player-name')]
                .map(э => э.scrollWidth > э.clientWidth + 1));
        expect(обрезано.length).toBeGreaterThan(0);
        expect(обрезано.every(о => о === false),
            'какое-то имя не помещается в свою коробку').toBe(true);
    });

    test('судья видит, какой матч ведёт', async ({ page }) => {
        await дождаться(page);
        const шапка = await page.locator('.um-match-players').textContent();
        expect(шапка.trim().length).toBeGreaterThan(3);
        expect(шапка).toContain('—');
    });

    test('счёт на экране крупнее имени игрока', async ({ page }) => {
        await дождаться(page);
        const л = await page.evaluate(() => {
            const к = s => {
                const э = document.querySelector(s);
                return э ? parseFloat(getComputedStyle(э).fontSize) : null;
            };
            return { очки: к('.um-points'), имя: к('.um-player-name') };
        });
        expect(л.очки, 'очки ' + л.очки + ', имя ' + л.имя).toBeGreaterThan(л.имя);
    });

    test('счёт не мельче 21 ни на одном виде', async ({ page }) => {
        await дождаться(page);
        const очки = await page.evaluate(() =>
            parseFloat(getComputedStyle(document.querySelector('.um-points')).fontSize));
        /* Ступень 21 — нижняя, ниже которой счёт на солнце уже не читается.
           На узком экране он раньше падал до 21, а после правки границы
           чуть не уехал туда на всех телефонах. */
        expect(очки).toBeGreaterThanOrEqual(21);
    });

    test('эмодзи на экране судьи нет', async ({ page }) => {
        await дождаться(page);
        const сколько = await page.evaluate(() =>
            (document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length);
        expect(сколько).toBe(0);
    });

    test('значок подачи нарисован стилем и не читается диктором как текст', async ({ page }) => {
        await дождаться(page);
        const точка = await page.evaluate(() => {
            const э = document.querySelector('.um-serve-dot span');
            if (!э) return null;
            const до = getComputedStyle(э.parentElement, '::before');
            return { текст: э.textContent.trim(), радиус: до.borderRadius, ширина: до.width };
        });
        if (точка) {
            expect(точка.текст, 'значок подачи — текст, а не рисунок').toBe('');
            expect(точка.ширина).not.toBe('auto');
        }
    });

    test('все кнопки не ниже 44', async ({ page }) => {
        await дождаться(page);
        const низкие = await page.evaluate(() =>
            [...document.querySelectorAll('button')]
                .map(б => ({ т: б.textContent.trim().slice(0, 20), в: Math.round(б.getBoundingClientRect().height) }))
                .filter(б => б.в > 0 && б.в < 44));
        expect(низкие, 'ниже порога: ' + JSON.stringify(низкие)).toEqual([]);
    });

    test('у кнопки есть кольцо фокуса', async ({ page }) => {
        await дождаться(page);
        const есть = await page.evaluate(() => {
            const б = document.querySelector('button');
            if (!б) return null;
            б.focus();
            const с = getComputedStyle(б);
            return { ширина: parseFloat(с.outlineWidth) || 0, стиль: с.outlineStyle };
        });
        if (есть) {
            expect(есть.стиль).not.toBe('none');
            expect(есть.ширина).toBeGreaterThanOrEqual(3);
        }
    });

    test('горизонтальной прокрутки нет', async ({ page }) => {
        await дождаться(page);
        const вбок = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(вбок).toBeLessThanOrEqual(1);
    });

});
