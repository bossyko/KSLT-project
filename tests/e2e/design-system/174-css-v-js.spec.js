// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ВИД ЖИВЁТ В CSS, А НЕ В СТРОКЕ JS. Кусок 174, 26.10.
 *
 * ЧТО БЫЛО. Три файла вписывали css строкой в <head> при первом открытии
 * своего окна: `bracket.js` (5 правил окна счёта), `doubles-entry.js` (33
 * правила окна парной заявки), `tournament-register.js` (17 правил окна
 * «войдите, чтобы записаться»). Пятьдесят пять правил, которых не читал
 * НИ ОДИН сторож.
 *
 * ЧЕГО НЕ МОЖЕТ СТОРОЖ, А МОЖЕТ ЭТА ПРОБА. Сторож читает файлы и видит,
 * что правило лежит в css. Он НЕ МОЖЕТ сказать, что на живом экране вид
 * пометки исхода ОДИНАКОВ до и после открытия окна счёта — а до куска 174
 * он был разным, и это замерено: фон прозрачный → лайм .12, цвет белый →
 * лаймовый, вес 400 → 700. Вид сетки зависел от того, открывал ли
 * менеджер окно счёта в этой загрузке страницы.
 *
 * ПРОБА ЖДЁТ ПРИЗНАКИ, А НЕ ТИШИНУ: дом окна, вставленный узел, число
 * чипов. Виды здесь не объявляются — урок куска 155.
 *
 * АДМИНКА ЗА ВХОДОМ, ПОЭТОМУ ОКНО СЧЁТА МЕРИТСЯ НА СТЕНДЕ
 * `maket/setka-zamer.html`: настоящие `bracket.js` и `admin.css`, клиент
 * базы заглушен — нажимать можно, в базу не пишется.
 */

const СТЕНД = '/maket/setka-zamer.html';

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/tournament.html' },
    { имя: 'en', адрес: '/pages/tournament-en.html' },
    { имя: 'kg', адрес: '/pages/tournament-kg.html' }
];

/* ШКАЛА КЕГЛЕЙ — решение Кости. Всё, что не на ступени, — беда. */
const СТУПЕНИ_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

async function беды(page) {
    const список = [];
    page.on('pageerror', e => список.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) {
            список.push('console: ' + т);
        }
    });
    return список;
}

/* ЦЕЛЬ НАЖАТИЯ МЕРИТСЯ ПОПАДАНИЕМ, А НЕ ПРЯМОУГОЛЬНИКОМ: у крестика окна
   админки область расширена псевдоэлементом, и прямоугольник 17×26 врёт.
   На этом я ошибся в замере 26.10 и поправил себя прогоном. */
async function попадания(page, селектор, номер) {
    return page.evaluate(([сел, н]) => {
        const e = document.querySelectorAll(сел)[н];
        if (!e) return -1;
        const b = e.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        let попало = 0;
        [[0, -20], [0, 20], [-20, 0], [20, 0], [-14, -14], [14, 14]].forEach(([dx, dy]) => {
            if (document.elementFromPoint(cx + dx, cy + dy) === e) попало++;
        });
        return попало;
    }, [селектор, номер]);
}

test.describe('кусок 174 — вид живёт в css', () => {

    test('пометка исхода в сетке одинакова до и после открытия окна счёта', async ({ page }) => {
        const ошибки = await беды(page);
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!document.querySelector('.ad-grp-cell-click'), null, { timeout: 20000 });

        const снять = () => page.evaluate(() => {
            let s = document.getElementById('замерИсход');
            if (!s) {
                const матч = document.querySelector('.ad-brk-match') || document.querySelector('.ad-grp-score');
                s = document.createElement('span');
                s.id = 'замерИсход';
                s.className = 'ad-brk-outcome';
                s.textContent = 'RET';
                матч.appendChild(s);
            }
            const c = getComputedStyle(s);
            return {
                стильИзJs: !!document.getElementById('adOutcomeStyles'),
                фон: c.backgroundColor, цвет: c.color, вес: c.fontWeight,
                кегль: c.fontSize, радиус: c.borderRadius, положение: c.position
            };
        });

        const до = await снять();
        await page.locator('.ad-grp-cell-click').first().click();
        await page.waitForSelector('.ad-modal', { timeout: 10000 });
        const после = await снять();

        /* ГЛАВНОЕ ОТНОШЕНИЕ КУСКА: вид пометки не зависит от окна. */
        expect(после).toEqual(до);
        expect(до.стильИзJs).toBe(false);
        expect(до.положение).toBe('absolute');
        expect(до.фон).not.toBe('rgba(0, 0, 0, 0)');
        expect(ошибки).toEqual([]);
    });

    test('ни одно окно не вписывает <style> в голову страницы', async ({ page }) => {
        const ошибки = await беды(page);
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!document.querySelector('.ad-grp-cell-click'), null, { timeout: 20000 });
        const было = await page.evaluate(() => document.head.querySelectorAll('style').length);
        await page.locator('.ad-grp-cell-click').first().click();
        await page.waitForSelector('.ad-modal', { timeout: 10000 });
        const стало = await page.evaluate(() => document.head.querySelectorAll('style').length);
        expect(стало).toBe(было);
        expect(ошибки).toEqual([]);
    });

    test('чипы исхода: состояние для диктора, ступень и видимый фокус', async ({ page }) => {
        const ошибки = await беды(page);
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!document.querySelector('.ad-grp-cell-click'), null, { timeout: 20000 });
        await page.locator('.ad-grp-cell-click').first().click();
        await page.waitForSelector('.ad-outcome-chip', { timeout: 10000 });

        const чипы = page.locator('.ad-modal .ad-outcome-chip');
        const сколько = await чипы.count();
        expect(сколько).toBeGreaterThan(1);

        /* у КАЖДОГО чипа состояние произносится, а не только красится */
        for (let i = 0; i < сколько; i++) {
            await expect(чипы.nth(i)).toHaveAttribute('aria-pressed', /true|false/);
        }
        const включённых = await page.locator('.ad-modal .ad-outcome-chip[aria-pressed="true"]').count();
        expect(включённых).toBe(1);

        /* нажатие переносит И класс, И состояние для диктора */
        await чипы.nth(1).click();
        await expect(чипы.nth(1)).toHaveAttribute('aria-pressed', 'true');
        await expect(чипы.nth(0)).toHaveAttribute('aria-pressed', 'false');
        await expect(чипы.nth(1)).toHaveClass(/active/);

        /* высота — ступень шкалы кнопок: 28 на широком, 44 на узком */
        const высота = await чипы.nth(0).evaluate(e => Math.round(e.getBoundingClientRect().height));
        const ширинаВида = await page.evaluate(() => window.innerWidth);
        expect([28, 44]).toContain(высота);
        if (ширинаВида <= 640) expect(высота).toBe(44);

        /* на узком виде цель берётся попаданием, а не прямоугольником */
        if (ширинаВида <= 640) {
            expect(await попадания(page, '.ad-modal .ad-outcome-chip', 0)).toBe(6);
        }

        /* ФОКУС БЕРЁТСЯ КЛАВИШЕЙ, А НЕ ЗОВОМ `.focus()`: `:focus-visible`
           НЕ ЗАЖИГАЕТСЯ ОТ element.focus() ПОСЛЕ НАЖАТИЯ МЫШЬЮ — урок
           прибора, на который я наступил второй раз и поймал прогоном.
           Идём по кругу Tab'ом, пока активным не станет чип. */
        let дошли = false;
        for (let шаг = 0; шаг < 40 && !дошли; шаг++) {
            await page.keyboard.press('Tab');
            дошли = await page.evaluate(() => {
                const e = document.activeElement;
                return !!e && (e.className || '').toString().includes('ad-outcome-chip');
            });
        }
        expect(дошли).toBe(true);
        const обвод = await page.evaluate(() => {
            const s = getComputedStyle(document.activeElement);
            return { стиль: s.outlineStyle, ширина: s.outlineWidth };
        });
        expect(обвод.стиль).not.toBe('none');
        expect(parseFloat(обвод.ширина)).toBeGreaterThan(0);
        expect(ошибки).toEqual([]);
    });

    for (const я of ЯЗЫКИ) {
        test('окно записи на ' + я.имя + ': ступени, цели и один заголовок', async ({ page }) => {
            const ошибки = await беды(page);
            await page.goto(я.адрес);
            await page.waitForFunction(() => !!window.KSLT_REG && !!window.KSLT_REG.showModal,
                null, { timeout: 20000 });

            await page.evaluate(() => window.KSLT_REG.showModal({
                icon: '🎾', title: 'TEST TITLE', text: 'TEST TEXT', note: 'TEST NOTE'
            }, false, false));
            await page.waitForSelector('.trn-register-modal', { timeout: 10000 });
            /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ: окно въезжает `scale(.95) -> 1`, и
               замер ВНУТРИ перехода врёт — высота кнопки давала 43 из 44.
               Ждём, пока преобразование станет единичным. */
            await page.waitForFunction(() => {
                const m = document.querySelector('.trn-register-modal');
                if (!m) return false;
                const t = getComputedStyle(m).transform;
                return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
            }, null, { timeout: 10000 });

            const снято = await page.evaluate(() => {
                const m = document.querySelector('.trn-register-modal');
                const вз = с => {
                    const e = m.querySelector(с);
                    if (!e) return null;
                    const s = getComputedStyle(e);
                    const b = e.getBoundingClientRect();
                    return { кегль: parseFloat(s.fontSize), вес: s.fontWeight,
                             высота: Math.round(b.height), ширина: Math.round(b.width) };
                };
                return {
                    подложка: getComputedStyle(m.parentElement).backgroundColor,
                    стилейВГолове: document.head.querySelectorAll('style').length,
                    заголовок: вз('.trn-register-modal-title'),
                    текст: вз('.trn-register-modal-text'),
                    примечание: вз('.trn-register-modal-note'),
                    кнопка: вз('.trn-register-modal-btn'),
                    крестик: вз('.trn-register-modal-close')
                };
            });

            /* каждый уровень — ступень шкалы кеглей */
            [снято.заголовок, снято.текст, снято.примечание, снято.кнопка, снято.крестик]
                .forEach(у => expect(СТУПЕНИ_КЕГЛЕЙ).toContain(у.кегль));

            /* цели нажатия — ступень 44 и попадание со всех сторон */
            expect(снято.кнопка.высота).toBe(44);
            expect(снято.крестик.высота).toBe(44);
            expect(снято.крестик.ширина).toBe(44);
            expect(await попадания(page, '.trn-register-modal-close', 0)).toBe(6);
            expect(await попадания(page, '.trn-register-modal-btn', 0)).toBe(6);

            /* подложка — одно понятие на все окна: 0.6, а не своё число */
            expect(снято.подложка).toBe('rgba(0, 0, 0, 0.6)');
            expect(ошибки).toEqual([]);
        });

        test('окно парной заявки на ' + я.имя + ': поле 44 и кегль не мельче 16', async ({ page }) => {
            const ошибки = await беды(page);
            await page.goto(я.адрес);
            await page.waitForFunction(() => !!window.KSLT_DOUBLES && !!window.KSLT_DOUBLES.открыть,
                null, { timeout: 20000 });

            await page.evaluate(() => {
                const client = { from: () => ({ select: () => ({ or: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) };
                window.KSLT_DOUBLES.открыть({
                    client: client,
                    tournament: { id: 'проба', title: 'TEST CUP', format: 'doubles', ntrp_combined_max: 8 },
                    playerName: 'TEST PLAYER',
                    onDone: function () {}
                });
            });
            await page.waitForSelector('.de-modal', { timeout: 10000 });

            const снято = await page.evaluate(() => {
                const m = document.querySelector('.de-modal');
                const вз = с => {
                    const e = m.querySelector(с);
                    if (!e) return null;
                    const s = getComputedStyle(e);
                    const b = e.getBoundingClientRect();
                    return { кегль: parseFloat(s.fontSize), высота: Math.round(b.height),
                             ширина: Math.round(b.width) };
                };
                return {
                    стилейВГолове: document.head.querySelectorAll('style').length,
                    заголовок: вз('.de-title'), подпись: вз('.de-label'),
                    поле: вз('.de-input'), кнопка: вз('.de-send'),
                    крестик: вз('.de-close'), переключатель: вз('.de-switch button'),
                    переливВниз: m.getBoundingClientRect().bottom > window.innerHeight
                };
            });

            [снято.заголовок, снято.подпись, снято.поле, снято.кнопка, снято.крестик, снято.переключатель]
                .forEach(у => expect(СТУПЕНИ_КЕГЛЕЙ).toContain(у.кегль));

            /* НИЖЕ 16 SAFARI НА iOS ЗУМИТ СТРАНИЦУ ПРИ ФОКУСЕ */
            expect(снято.поле.кегль).toBeGreaterThanOrEqual(16);
            expect(снято.поле.высота).toBe(44);
            expect(снято.кнопка.высота).toBe(44);
            expect(снято.крестик.высота).toBe(44);
            expect(await попадания(page, '.de-close', 0)).toBe(6);

            /* окно целиком помещается: прокрутка внутри, а не за экраном */
            expect(снято.переливВниз).toBe(false);
            expect(ошибки).toEqual([]);
        });
    }
});
