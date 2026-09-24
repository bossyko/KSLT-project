/**
 * РАЗДЕЛ «О ПРОЕКТЕ КСЛТ» `#about` НА ГЛАВНОЙ — доска 427:9, компонент
 * Feature icon 429:191, решения Кости 24.09.
 *
 * Что проверяется и почему именно так:
 *
 *  · СЕТКА ВО ВСЮ ШИРИНУ. Плитки были заперты в колонке рядом с фотографией
 *    и сжимались до 133 на 1024 при кегле имени 16. Тест меряет ОТНОШЕНИЕ:
 *    ширина сетки равна ширине тела раздела.
 *  · ПЛИТКА ВЕДЁТ. Шесть плиток называли шесть разделов сайта и никуда не
 *    вели. Каждая — ссылка, и адрес её языка.
 *  · ПОРЯДОК ПО СМЫСЛУ. На узком: вступление → плитки → снимок. Было
 *    наоборот, снимок стоял первым.
 *  · ЛЕСТНИЦА ПАРАМИ. Имя строго крупнее строки под ним на каждом виде —
 *    раньше оба были 16 и отличались только весом.
 *  · ФОТОГРАФИЯ НЕ СЪЕДАЕТ ЭКРАН. На телефоне боком она занимала 340 из 390.
 *  · КОНТРАСТ ≥ 4.5. Строка плитки давала 3.14.
 *  · ДИКТОР. h2 → h3 без пропуска уровня, список из шести, иконки скрыты.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети.
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html',    суф: '' },
    { имя: 'en', адрес: '/index-en.html', суф: '-en' },
    { имя: 'kg', адрес: '/index-kg.html', суф: '-kg' }
];

async function дождаться(page, адрес) {
    await page.goto(адрес);
    await page.waitForSelector('#about .about-features', { timeout: 15000 });
    await page.evaluate(() => {
        const с = document.getElementById('about');
        if (с) с.scrollIntoView({ block: 'start' });
    });
    /* Снимок задаёт высоту тела: без него меряется недогруженное.
       Ждём только видимое — у картинки loading="lazy". */
    await page.waitForFunction(() => {
        const и = document.querySelector('#about .about-image img');
        return и && (и.complete || !и.getClientRects().length);
    }, null, { timeout: 8000 }).catch(() => {});
}

const снимок = page => page.evaluate(() => {
    const сек = document.getElementById('about');
    if (!сек) return null;
    const R = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), п: Math.round(r.right), в: Math.round(r.top),
                 н: Math.round(r.bottom), ш: Math.round(r.width), вы: Math.round(r.height) }; };
    const кегль = э => э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;

    const ч = c => (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
    const яркость = ([r, g, b]) => { const f = v => { v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const фон = э => { let n = э; while (n) { const v = ч(getComputedStyle(n).backgroundColor);
        if (v.length === 4 && v[3] > 0 && v[3] < 1) { n = n.parentElement; continue; }
        if (v.length < 4 || v[3] > 0) return v.slice(0, 3); n = n.parentElement; } return [0, 0, 0]; };
    const смесь = (fg, bg) => { const a = fg[3] === undefined ? 1 : fg[3];
        return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); };
    const контраст = э => { const b = фон(э);
        const a = яркость(смесь(ч(getComputedStyle(э).color), b)), c = яркость(b);
        return +(((Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)).toFixed(2)); };

    const тело = сек.querySelector('.about-body');
    const сетка = сек.querySelector('.about-features');
    const лид = сек.querySelector('.about-lead');
    const карт = сек.querySelector('.about-image img');
    const плитки = [...сек.querySelectorAll('.feature')];

    const поРядам = {};
    плитки.forEach(п => { const в = R(п).в; (поРядам[в] = поРядам[в] || []).push(п); });
    const ряды = Object.keys(поРядам).sort((a, b) => a - b).map(в => поРядам[в]);

    return {
        тело: R(тело), сетка: R(сетка), лид: R(лид), картинка: R(карт),
        экран: { ш: window.innerWidth, вы: window.innerHeight },
        колонок: getComputedStyle(сетка).gridTemplateColumns.split(' ').length,
        вРядах: ряды.map(р => р.length),
        высотыРядов: ряды.map(р => [...new Set(р.map(п => R(п).вы))]),
        цели: плитки.map(п => R(п).вы),
        ссылки: плитки.map(п => п.tagName.toLowerCase() + ':' + (п.getAttribute('href') || 'нет')),
        имя: кегль(сек.querySelector('.feature h3')),
        строка: кегль(сек.querySelector('.feature p')),
        кеглЛида: кегль(лид),
        контрастСтроки: контраст(сек.querySelector('.feature p')),
        плашка: (() => { const п = сек.querySelector('.feature-icon');
            const s = п.querySelector('svg');
            return { плашка: R(п), иконка: s ? R(s) : null,
                     скрыта: s ? s.getAttribute('aria-hidden') === 'true' : null }; })(),
        заголовки: [...сек.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(э => э.tagName.toLowerCase()),
        список: { ul: !!сек.querySelector('ul.about-features'),
                  li: сек.querySelectorAll('ul.about-features > li').length },
        размерыКартинки: { w: карт.getAttribute('width'), h: карт.getAttribute('height') },
        эмодзи: /[\u{1F000}-\u{1FAFF}]/u.test(сек.textContent),
        горПрокрутка: document.documentElement.scrollWidth > window.innerWidth + 1
    };
});

СТРАНИЦЫ.forEach(({ имя, адрес, суф }) => {
    test.describe('«О проекте» · ' + имя, () => {

        test('сетка плиток идёт во всю ширину тела раздела', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с, 'раздел #about на странице').not.toBeNull();
            expect(Math.abs(с.сетка.ш - с.тело.ш), 'сетка ' + с.сетка.ш + ', тело ' + с.тело.ш)
                .toBeLessThanOrEqual(2);
        });

        test('каждая плитка — ссылка своего языка', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.ссылки.length, 'плиток шесть').toBe(6);
            const ждём = ['tournaments-overview', 'partners', 'players', 'courts', 'coaches', 'pricing'];
            с.ссылки.forEach((з, i) => {
                expect(з, 'плитка ' + (i + 1)).toBe('a:pages/' + ждём[i] + суф + '.html');
            });
        });

        test('порядок по смыслу: вступление, плитки, снимок', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.лид.в, 'вступление выше плиток').toBeLessThan(с.сетка.в);
            if (с.экран.ш <= 992) {
                expect(с.сетка.в, 'на узком плитки выше снимка').toBeLessThan(с.картинка.в);
            } else {
                expect(с.картинка.в, 'на широком снимок в одной строке со вступлением')
                    .toBeLessThan(с.сетка.в);
            }
        });

        test('плитки ряда одной высоты, цель нажатия не ниже 44', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            с.высотыРядов.forEach((набор, i) => {
                expect(набор.length, 'ряд ' + (i + 1) + ' — высоты ' + набор.join(', ')).toBe(1);
            });
            с.цели.forEach((в, i) => {
                expect(в, 'плитка ' + (i + 1) + ': высота ' + в).toBeGreaterThanOrEqual(44);
            });
        });

        test('лестница читается парами: лид ≥ имя > строка', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.имя, 'имя ' + с.имя + ' крупнее строки ' + с.строка).toBeGreaterThan(с.строка);
            expect(с.кеглЛида, 'лид ' + с.кеглЛида + ' не мельче имени ' + с.имя)
                .toBeGreaterThanOrEqual(с.имя);
        });

        test('строка плитки проходит порог WCAG 4.5', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.контрастСтроки, 'контраст строки плитки').toBeGreaterThanOrEqual(4.5);
        });

        test('плашка иконки 44, иконка 24, от диктора скрыта', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.плашка.плашка.ш + '×' + с.плашка.плашка.вы, 'плашка').toBe('44×44');
            expect(с.плашка.иконка.ш + '×' + с.плашка.иконка.вы, 'иконка').toBe('24×24');
            expect(с.плашка.скрыта, 'иконка скрыта от диктора').toBe(true);
            expect(с.эмодзи, 'эмодзи в разделе не осталось').toBe(false);
        });

        test('уровень заголовка не пропущен, шесть пунктов — список', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.заголовки.join(' '), 'заголовки раздела').toBe('h2 h3 h3 h3 h3 h3 h3');
            expect(с.список.ul, 'сетка это ul').toBe(true);
            expect(с.список.li, 'шесть li').toBe(6);
        });

        test('фотография не съедает экран и знает свой размер', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.размерыКартинки.w, 'width в разметке').toBe('1400');
            expect(с.размерыКартинки.h, 'height в разметке').toBe('691');
            expect(с.картинка.вы, 'высота снимка ' + с.картинка.вы + ' при экране ' + с.экран.вы)
                .toBeLessThanOrEqual(Math.round(с.экран.вы * 0.45));
            expect(с.горПрокрутка, 'горизонтальной прокрутки нет').toBe(false);
        });
    });
});
