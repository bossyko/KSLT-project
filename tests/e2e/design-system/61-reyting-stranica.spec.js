/**
 * СТРАНИЦА «ВЕСЬ РЕЙТИНГ» — ОБЛОЖКА, ФИЛЬТРЫ И ТАБЛИЦА. 06.10.
 *
 * Замер пяти видов нашёл четвёртое семейство обложек со своими числами:
 * заголовок clamp(1.9rem, 4.4vw, 3.1rem) давал 49.6 · 45.1 · 37.1 · 33.8 ·
 * 26 — ни одно число, кроме последнего, не стоит на шкале; пол 460 своим
 * числом; чип пола 37 на 768 и 390 — такой ступени на шкале кнопок нет
 * вовсе; таблица 1398 при окне 1512.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя токена, число
 *     говорит замер — и только на нужной ширине;
 *   • ДОХОДИТ ЛИ НАЖАТИЕ до чипа пола: высота коробки и цель нажатия
 *     разные вещи;
 *   • ЧТО НА ОБЛОЖКЕ НЕТ ЧИСЕЛ. Это решение Кости, а не свойство css:
 *     плашку может вернуть любой, кто правит отрисовку;
 *   • ДОЛЮ ЭКРАНА, которую съедает обложка на низком горизонтальном.
 *
 * ПОРОГИ: если обложки, чипов или строк таблицы на экране нет, проверка
 * ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ШКАЛА_КНОПОК = [28, 36, 44, 52];

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/players.html', сезон: 'Сезон 2026' },
    { имя: 'en', адрес: '/pages/players-en.html', сезон: 'Season 2026' },
    { имя: 'kg', адрес: '/pages/players-kg.html', сезон: '2026-сезон' },
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(() => document.querySelectorAll('.pl-hero-title').length > 0,
        null, { timeout: 15000 });
    await page.waitForTimeout(1200);
}

const кегль = async (page, сел) => page.evaluate(с => {
    const э = document.querySelector(с);
    if (!э) return null;
    const c = getComputedStyle(э);
    return { fs: Math.round(parseFloat(c.fontSize)), fw: c.fontWeight,
             lh: Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100 };
}, сел);

for (const Я of ЯЗЫКИ) {

test.describe('страница рейтинга · ' + Я.имя, () => {

    test('обложка не съедает экран и стоит на общем полу раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const о = document.querySelector('.pl-hero');
            if (!о) return null;
            return { h: Math.round(о.getBoundingClientRect().height),
                     экран: window.innerHeight,
                     пол: getComputedStyle(о).minHeight };
        });
        expect(r, 'ПОРОГ: обложки нет на экране').not.toBeNull();
        /* ДОЛЯ ЭКРАНА, А НЕ ЧИСЛО: у турниров обложка на телефоне боком
           съедала первый экран целиком, и ровно это мы не повторяем. */
        const доля = r.h / r.экран;
        expect(доля, 'обложка занимает ' + Math.round(доля * 100) + '% экрана (' +
            r.h + ' при ' + r.экран + ')').toBeLessThanOrEqual(0.55);
        expect(r.пол, 'пол обложки снова записан своим числом, а не токеном раздела')
            .not.toBe('460px');
    });

    test('заголовок и подзаголовок обложки стоят на ступенях шкалы', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await кегль(page, '.pl-hero-title');
        const п = await кегль(page, '.pl-hero-subtitle');
        expect(з, 'ПОРОГ: заголовка обложки нет').not.toBeNull();
        expect(ШКАЛА_КЕГЛЕЙ, 'кегль заголовка ' + з.fs + ' — такой ступени на шкале нет. ' +
            'Было clamp: 49.6 · 45.1 · 37.1 · 33.8 · 26').toContain(з.fs);
        expect(з.lh, 'межстрочный заголовка ' + з.lh + ' — заголовку положен 1.1').toBe(1.1);
        if (п) {
            expect(ШКАЛА_КЕГЛЕЙ, 'кегль подзаголовка ' + п.fs + ' — такой ступени нет. ' +
                'Было 20.8').toContain(п.fs);
            expect(п.fs, 'подзаголовок не тише заголовка: ' + п.fs + ' против ' + з.fs)
                .toBeLessThan(з.fs);
        }
    });

    test('на обложке нет чисел — только название и сезон', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const с = document.querySelector('.pl-hero-content');
            return { плашек: document.querySelectorAll('.pl-hero-stat').length,
                     текст: с ? с.innerText.replace(/\s+/g, ' ').trim() : null };
        });
        expect(r.текст, 'ПОРОГ: содержимого обложки нет').not.toBeNull();
        expect(r.плашек, 'на обложку вернулись плашки с числами. Слово Кости 06.10: ' +
            '«онлайн убери» и «391 игроков — убери тоже, числа не надо»').toBe(0);
        /* Единственное число, которому здесь место, — год сезона. */
        const числа = (r.текст.match(/\d+/g) || []).filter(ч => ч !== '2026');
        expect(числа, 'на обложке стоят числа помимо года сезона: ' + числа.join(', ') +
            ' — «' + r.текст + '»').toEqual([]);
        expect(r.текст, 'в обложке пропал сезон').toContain('2026');
    });

    test('чип пола — ступень шкалы кнопок, и нажатие доходит', async ({ page }) => {
        await открыть(page, Я.адрес);
        const чипы = page.locator('.pl-gender-tab');
        const сколько = await чипы.count();
        expect(сколько, 'ПОРОГ: чипов пола нет — мерить нечего').toBeGreaterThan(0);

        const высоты = await page.evaluate(() =>
            [...document.querySelectorAll('.pl-gender-tab')]
                .filter(э => э.offsetParent !== null)
                .map(э => Math.round(э.getBoundingClientRect().height)));
        for (const h of высоты) {
            expect(ШКАЛА_КНОПОК, 'чип пола высотой ' + h + ' — такой ступени на шкале ' +
                'кнопок нет (28 · 36 · 44 · 52). Замер 06.10 давал 37 на 768 и 390')
                .toContain(h);
        }
        const к = await кегль(page, '.pl-gender-tab');
        expect(ШКАЛА_КЕГЛЕЙ, 'кегль чипа ' + к.fs + ' мимо шкалы').toContain(к.fs);

        /* НАЖАТИЕ, А НЕ КЛАСС: цель нажатия и коробка — разные вещи. */
        const второй = чипы.nth(1);
        if (await второй.count()) {
            await второй.click();
            await page.waitForTimeout(400);
            const активных = await page.evaluate(() =>
                document.querySelectorAll('.pl-gender-tab.active').length);
            expect(активных, 'после нажатия выбранным должен быть ровно один чип').toBe(1);
        }
    });

    test('таблица рейтинга живёт в колонке, а не во всю ширину окна', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const т = document.querySelector('.pl-table');
            if (!т) return null;
            const ряды = [...т.querySelectorAll('.pl-row:not(.pl-row-header)')]
                .filter(э => э.offsetParent !== null);
            const к = т.getBoundingClientRect();
            return { ширина: Math.round(к.width), окно: window.innerWidth,
                     слева: Math.round(к.left),
                     справа: Math.round(window.innerWidth - к.right),
                     рядов: ряды.length,
                     высоты: [...new Set(ряды.slice(0, 10)
                         .map(э => Math.round(э.getBoundingClientRect().height)))] };
        });
        expect(r, 'ПОРОГ: таблицы рейтинга нет на экране').not.toBeNull();
        expect(r.рядов, 'ПОРОГ: в таблице нет строк').toBeGreaterThan(0);
        expect(r.ширина, 'таблица ' + r.ширина + ' при окне ' + r.окно +
            ' — снова во всю ширину. ATP, WTA и ITF держат рейтинг в узкой колонке')
            .toBeLessThanOrEqual(1100);
        if (r.окно > 1100) {
            expect(Math.abs(r.слева - r.справа), 'таблица уже окна, но не по центру: ' +
                'слева ' + r.слева + ', справа ' + r.справа).toBeLessThanOrEqual(2);
        }
        /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: у последней строки нет нижней границы, и она
           законно на пиксель ниже соседей. Мерим разброс, а не равенство —
           первая редакция этой проверки требовала одну высоту и падала на
           52 против 53. */
        const разброс = Math.max(...r.высоты) - Math.min(...r.высоты);
        expect(разброс, 'строки таблицы разной высоты на одном виде: ' +
            r.высоты.join(', ') + ' — разброс ' + разброс).toBeLessThanOrEqual(1);
    });

    test('страница не переливает за край экрана', async ({ page }) => {
        await открыть(page, Я.адрес);
        const п = await page.evaluate(() =>
            Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
        expect(п, 'страница рейтинга переливает вбок на ' + п).toBe(0);
    });

});

}
