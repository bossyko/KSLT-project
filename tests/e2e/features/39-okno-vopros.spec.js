// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-VOPROS: окно-вопрос приложения — своё, одно, с оснасткой (05.11).
 *
 * ПОЧЕМУ ЭТА ПРОБА ЕСТЬ. Костя 02.11: «почему оно такого цвета, белый
 * фон, когда у нас всё тёмное». Замер 05.11 показал: все окна разметки
 * следуют теме, а белыми были ТРИ системных окна WebView — `confirm` в
 * профиле и два `alert` в турнирах. Их рисует Android: белыми, без
 * перевода, и они держат экран.
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож `check-okno-vopros.js`
 * читает файлы как текст: он видит, что системных окон не осталось и что
 * дом один. Он НЕ видит, доехало ли это до живого дерева — какого цвета
 * окно встало, ушла ли роль с коробки, какой высоты вышла кнопка, не
 * копятся ли узлы при замене окна. Это работа прогона.
 *
 * БАЗУ ПРОБА НЕ ТРОГАЕТ: окно зовётся напрямую у дома, как это делает
 * продукт, без нажатия кнопок, которые пишут.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождатьсяДома(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    /* ПРИЗНАК, А НЕ ТИШИНА СЕТИ: ждём сам дом и дом оснастки. */
    await page.waitForFunction(() => !!window.KSLT_VOPROS && !!window.KSLT_OKNO,
        null, { timeout: 20000 });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    return ошибки;
}

async function открытьВопрос(page) {
    await page.evaluate(() => {
        window.KSLT_VOPROS.окно({
            title: 'Обменять баллы',
            body: '<p class="gi-text">50 Обменять баллов?</p>',
            actions: [{ label: 'Отмена' }, { label: 'Обменять', primary: true }]
        });
    });
    /* ЖДЁМ КОНЦА ПЕРЕХОДА, А НЕ ПОЯВЛЕНИЯ ОКНА. У коробки стоит
       `transform: scale(0.92)`, который едет к единице за 0.25 с, а
       `getBoundingClientRect()` отдаёт размер С УЧЁТОМ transform.
       Прогон 05.11 падал на всех пяти видах с «высотой 41» — это 44,
       помноженные на 0.92: проба мерила посреди анимации. ПРОБА,
       КОТОРАЯ МЕРИТ ВО ВРЕМЯ ПЕРЕХОДА, ВРЁТ ТАК ЖЕ, КАК СЖАТОЕ ОКНО
       ВМЕСТО ЗАГРУЗКИ НА НУЖНОЙ ШИРИНЕ. */
    await page.waitForFunction(() => {
        const o = document.getElementById('giModal');
        if (!o || !o.classList.contains('open')) return false;
        if (getComputedStyle(o).visibility !== 'visible') return false;
        const к = o.querySelector('.gi-box');
        const t = getComputedStyle(к).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }, null, { timeout: 5000 });
}

test.describe('Окно-вопрос приложения', () => {

    test('окно тёмное, а не белое', async ({ page }) => {
        const ошибки = await дождатьсяДома(page);
        await открытьВопрос(page);
        const цвета = await page.evaluate(() => {
            const к = document.querySelector('#giModal .gi-box');
            const п = document.getElementById('giModal');
            return { коробка: getComputedStyle(к).backgroundColor,
                     подложка: getComputedStyle(п).backgroundColor };
        });
        /* БЕЛОЕ ОКНО НА ТЁМНОЙ ТЕМЕ — ИМЕННО ТО, НА ЧТО ПОЖАЛОВАЛИСЬ.
           Порог взят отношением, а не числом: сумма каналов у тёмного
           фона заведомо ниже половины. */
        const сумма = цвета.коробка.match(/\d+/g).slice(0, 3).reduce((a, b) => a + Number(b), 0);
        expect(сумма, 'фон окна ' + цвета.коробка).toBeLessThan(255 * 3 / 2);
        expect(ошибки, 'ошибки страницы').toEqual([]);
    });

    test('роль диалога стоит один раз — на подложке, с подписью', async ({ page }) => {
        await дождатьсяДома(page);
        await открытьВопрос(page);
        const о = await page.evaluate(() => {
            const п = document.getElementById('giModal');
            const к = п.querySelector('.gi-box');
            return {
                подложкаРоль: п.getAttribute('role'),
                подложкаПодпись: п.getAttribute('aria-label') || п.getAttribute('aria-labelledby'),
                коробкаРоль: к.getAttribute('role'),
                ролейВсего: п.querySelectorAll('[role="dialog"]').length + (п.getAttribute('role') === 'dialog' ? 1 : 0)
            };
        });
        expect(о.подложкаРоль, 'роль на подложке').toBe('dialog');
        expect(о.подложкаПодпись, 'подпись для диктора').toBeTruthy();
        expect(о.коробкаРоль, 'роль на коробке — её ставит дом, а не разметка').toBeNull();
        expect(о.ролейВсего, 'диалогов в одном окне').toBe(1);
    });

    test('кнопка окна не мельче ступени 44', async ({ page }) => {
        await дождатьсяДома(page);
        await открытьВопрос(page);
        /* СЛЕД СОБИРАЕТСЯ СРАЗУ, А НЕ ВТОРЫМ ПРОГОНОМ. Прогон 05.11 упал
           на всех пяти видах («высотой 41»), а тот же замер в браузере
           руками давал 44 — и по одному числу разобрать было нечего.
           Поэтому падение несёт с собой всё, из чего высота сложилась. */
        const кнопки = await page.evaluate(() =>
            [...document.querySelectorAll('#giModal .gi-btn')].map(b => {
                const cs = getComputedStyle(b);
                return {
                    подпись: b.textContent,
                    в: Math.round(b.getBoundingClientRect().height),
                    пол: cs.minHeight,
                    отступы: cs.paddingTop + '/' + cs.paddingBottom,
                    строка: cs.lineHeight,
                    показ: cs.display,
                    кегль: cs.fontSize
                };
            }));
        const одежда = await page.evaluate(() => {
            const l = document.querySelector('link[href*="app.css"]');
            return l ? l.getAttribute('href') : 'нет';
        });
        expect(кнопки.length, 'кнопок в вопросе').toBe(2);
        for (const к of кнопки) {
            expect(к.в, 'кнопка «' + к.подпись + '» высотой ' + к.в +
                ' · пол ' + к.пол + ' · отступы ' + к.отступы +
                ' · строка ' + к.строка + ' · показ ' + к.показ +
                ' · кегль ' + к.кегль + ' · одежда ' + одежда).toBeGreaterThanOrEqual(44);
        }
    });

    test('сообщение без выбора рисует одну кнопку', async ({ page }) => {
        await дождатьсяДома(page);
        await page.evaluate(() => window.KSLT_VOPROS.сказать('Суммарный NTRP превышает лимит', '7.5 > 7.0'));
        await page.waitForFunction(() => {
            const o = document.getElementById('giModal');
            if (!o || !o.classList.contains('open')) return false;
            const к = o.querySelector('.gi-box');
            const t = getComputedStyle(к).transform;
            return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
        }, null, { timeout: 5000 });
        const о = await page.evaluate(() => ({
            кнопок: document.querySelectorAll('#giModal .gi-btn').length,
            заголовок: document.querySelector('#giModal .gi-title').textContent
        }));
        expect(о.кнопок, 'кнопок в сообщении').toBe(1);
        expect(о.заголовок).toContain('NTRP');
    });

    test('замена окна не копит ни узлы, ни стопку', async ({ page }) => {
        await дождатьсяДома(page);
        await открытьВопрос(page);
        await page.evaluate(() => window.KSLT_VOPROS.сказать('Второе', ''));
        await page.waitForTimeout(400);
        const о = await page.evaluate(() => ({
            узлов: document.querySelectorAll('.gi-overlay').length,
            вСтопке: window.KSLT_OKNO.открытые()
        }));
        /* УЗЕЛ, ВЫДЕРНУТЫЙ ИЗ ДЕРЕВА С КЛАССОМ `open`, остаётся в стопке
           дома навсегда, и Esc потом закрывает мёртвое окно. */
        expect(о.узлов, 'окон в дереве').toBe(1);
        expect(о.вСтопке, 'окон в стопке дома').toBe(1);
    });

    test('Esc закрывает окно', async ({ page }) => {
        await дождатьсяДома(page);
        await открытьВопрос(page);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const осталось = await page.evaluate(() =>
            document.querySelectorAll('.gi-overlay.open').length);
        expect(осталось, 'открытых окон после Esc').toBe(0);
    });
});
