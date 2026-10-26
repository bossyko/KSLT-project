// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ОФОРМЛЕНИЕ ИМЕНЕМ, СОСТОЯНИЕ КЛАССОМ. Кусок 175, 26.10. Круг 4 ветки C.
 *
 * ЧТО ДЕРЖИТ ЭТА ПРОБА, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и видит,
 * что инлайнов в них нет, а классы объявлены. Он НЕ МОЖЕТ сказать, что на
 * живом экране вид не изменился: что лестница текста окна счёта та же, что
 * у всех панелей вкладки одинаковый верхний отступ (а до куска у расписания
 * его не было вовсе), что тай-брейк показывается при 7:6 и ПРОПАДАЕТ при
 * 6:4 — на этом я поймал собственное второе определение класса, — и что
 * select крестовых слотов больше не рисуется браузерным.
 *
 * АДМИНКА ЗА ВХОДОМ, поэтому всё мерится на стенде `maket/setka-zamer.html`:
 * настоящие `bracket.js` и `admin.css`, клиент базы заглушен.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155.
 */

const СТЕНД = '/maket/setka-zamer.html';
const СТУПЕНИ_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const СТУПЕНИ_ОТСТУПОВ = [0, 4, 8, 12, 16, 24, 32, 40];

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

async function открыть(page) {
    await page.goto(СТЕНД);
    await page.waitForFunction(() => !!document.querySelector('.ad-grp-cell-click'),
        null, { timeout: 20000 });
}

async function открытьОкноСчёта(page) {
    await page.locator('.ad-grp-cell-click').first().click();
    await page.waitForSelector('.ad-modal', { timeout: 10000 });
    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ: у окна есть переход, и замер внутри него
       врёт — на этом попалась проба куска 174. */
    await page.waitForFunction(() => {
        const m = document.querySelector('.ad-modal');
        if (!m) return false;
        const t = getComputedStyle(m).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }, null, { timeout: 10000 });
}

test.describe('кусок 175 — оформление именем', () => {

    test('в окне ввода счёта нет ни одного инлайна, лестница на ступенях', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);
        await открытьОкноСчёта(page);

        const снято = await page.evaluate(() => {
            const m = document.querySelector('.ad-modal');
            const уровни = [];
            m.querySelectorAll('*').forEach(e => {
                const t = Array.from(e.childNodes).filter(n => n.nodeType === 3)
                    .map(n => n.textContent.trim()).join(' ').trim();
                if (!t) return;
                const s = getComputedStyle(e);
                уровни.push({ кегль: parseFloat(s.fontSize), вес: s.fontWeight });
            });
            return { инлайнов: m.querySelectorAll('[style]').length, уровни: уровни };
        });

        expect(снято.инлайнов).toBe(0);
        expect(снято.уровни.length).toBeGreaterThan(8);
        снято.уровни.forEach(у => expect(СТУПЕНИ_КЕГЛЕЙ).toContain(у.кегль));
        expect(ошибки).toEqual([]);
    });

    test('тай-брейк показывается при 7:6 и пропадает при 6:4', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);
        await открытьОкноСчёта(page);

        const ввод = async (v1, v2) => page.evaluate(([a, b]) => {
            const п = (id, v) => {
                const e = document.getElementById(id);
                e.value = v;
                e.dispatchEvent(new Event('input', { bubbles: true }));
            };
            п('adS1P1', a); п('adS1P2', b);
        }, [v1, v2]);

        await ввод('7', '6');
        await expect(page.locator('#adS1TB1Wrap')).toBeVisible();
        await expect(page.locator('#adS1TB1Wrap')).toHaveClass(/ad-vidno/);

        /* ЭТО И ЕСТЬ ПРОВЕРКА ВТОРОГО ОПРЕДЕЛЕНИЯ: при 6:4 тай-брейка быть
           не должно. Моя первая редакция css завела `.ad-tb-wrap` второй
           раз, раскладка ниже в файле перебила скрытие, и тай-брейк
           оставался на экране. Видел это браузер, а не чтение. */
        await ввод('6', '4');
        await expect(page.locator('#adS1TB1Wrap')).toBeHidden();
        expect(ошибки).toEqual([]);
    });

    test('блок «кто выбыл» открывается чипом и закрывается им же', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);
        await открытьОкноСчёта(page);

        const блок = page.locator('#adRetiredBlock');
        await expect(блок).toBeHidden();

        await page.locator('.ad-modal .ad-outcome-chip', { hasText: 'RET' }).click();
        await expect(блок).toBeVisible();
        await expect(блок).toHaveClass(/ad-vidno/);

        const первый = page.locator('.ad-modal .ad-outcome-chip').first();
        await первый.click();
        await expect(блок).toBeHidden();
        /* инлайн не возвращается ни при одном переключении */
        expect(await блок.evaluate(e => e.getAttribute('style'))).toBeNull();
        expect(ошибки).toEqual([]);
    });

    test('у всех панелей вкладки один верхний отступ, и он не инлайн', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);

        const снято = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.ad-brk-panel')).map(e => ({
                id: e.id,
                pt: parseFloat(getComputedStyle(e).paddingTop),
                инлайн: e.getAttribute('style'),
                классы: e.className
            }));
        });

        expect(снято.length).toBeGreaterThan(1);
        const отступы = new Set(снято.map(п => п.pt));
        /* ОДНО ПОНЯТИЕ — ОДНО ЗНАЧЕНИЕ: до куска 175 было 8 у двух панелей
           и 0 у расписания. */
        expect(отступы.size).toBe(1);
        expect(СТУПЕНИ_ОТСТУПОВ).toContain([...отступы][0]);
        снято.forEach(п => expect(п.инлайн).toBeNull());
        expect(ошибки).toEqual([]);
    });

    test('переключение вкладок ставит класс, а не инлайн', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);

        const нажать = async ключ => {
            await page.locator('[data-trn-nav="' + ключ + '"]').click();
            await page.waitForTimeout(250);
            return page.evaluate(() => Array.from(document.querySelectorAll('.ad-brk-panel'))
                .map(e => ({ id: e.id, видна: e.getBoundingClientRect().height > 0,
                             инлайн: e.getAttribute('style'), скрыт: e.classList.contains('ad-skryt') })));
        };

        for (const ключ of ['schedule', 'regs', 'bracket']) {
            const панели = await нажать(ключ);
            const видимых = панели.filter(п => п.видна);
            expect(видимых.length).toBe(1);
            панели.forEach(п => {
                expect(п.инлайн).toBeNull();
                expect(п.скрыт).toBe(!п.видна);
            });
        }
        expect(ошибки).toEqual([]);
    });

    test('select крестовых слотов не рисуется браузерным', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);

        /* ЗАМЕР CSS, А НЕ ПРАВКА: вставляем образец разметки блока и мерим
           вид. До куска 175 здесь стоял класс `ad-input`, правила под
           который нет ни в одном css, и select был белым с чёрным текстом
           и кеглем 13.33 на тёмной админке. */
        const снято = await page.evaluate(() => {
            const песок = document.createElement('div');
            песок.innerHTML =
                '<div class="ad-xslot-section"><div class="ad-xslot-ryad">' +
                '<span class="ad-xslot-podpis">Слот</span>' +
                '<select class="ad-field-input ad-xslot-select"><option>—</option></select>' +
                '</div></div>';
            const куда = document.querySelector('.ad-brk-panel:not(.ad-skryt)') || document.body;
            куда.appendChild(песок);
            const s = getComputedStyle(песок.querySelector('select'));
            const блок = getComputedStyle(песок.querySelector('.ad-xslot-section'));
            const из = { кегль: parseFloat(s.fontSize), фон: s.backgroundColor, цвет: s.color,
                         padding: блок.padding, радиус: блок.borderRadius };
            песок.remove();
            return из;
        });

        expect(снято.кегль).toBeGreaterThanOrEqual(16);
        expect(снято.фон).not.toBe('rgb(255, 255, 255)');
        expect(снято.цвет).not.toBe('rgb(0, 0, 0)');
        expect(снято.padding).toBe('16px');
        expect(ошибки).toEqual([]);
    });

    test('мелкие кнопки окна счёта стоят на ступени и видят фокус', async ({ page }) => {
        const ошибки = await беды(page);
        await открыть(page);
        await открытьОкноСчёта(page);

        const кнопки = page.locator('.ad-score-minibtn');
        expect(await кнопки.count()).toBe(3);
        /* МЕРИМ ТОЛЬКО ВИДИМЫЕ: «Убрать сет» скрыта классом, пока сет один,
           и её прямоугольник нулевой. Первая редакция пробы требовала
           ступень у всех трёх и упала бы на нуле — поймал замером до
           отдачи, а не прогоном. */
        const высоты = await кнопки.evaluateAll(список => список
            .map(e => Math.round(e.getBoundingClientRect().height))
            .filter(в => в > 0));
        expect(высоты.length).toBeGreaterThan(0);
        высоты.forEach(в => expect([28, 36, 44]).toContain(в));

        /* ФОКУС БЕРЁТСЯ КЛАВИШЕЙ: `:focus-visible` не зажигается от
           element.focus() после нажатия мышью — урок прибора. */
        let дошли = false;
        for (let шаг = 0; шаг < 40 && !дошли; шаг++) {
            await page.keyboard.press('Tab');
            дошли = await page.evaluate(() => {
                const e = document.activeElement;
                return !!e && (e.className || '').toString().includes('ad-score-minibtn');
            });
        }
        if (дошли) {
            const обвод = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
            expect(обвод).not.toBe('none');
        }
        expect(ошибки).toEqual([]);
    });
});
