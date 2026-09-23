/**
 * СЕКЦИЯ ЗНАЧКОВ `.section-badges-cta` — решения Кости 24.09, доска 358:9.
 *
 * Что здесь проверяется и почему именно так:
 *
 *  · ОТНОШЕНИЕ, А НЕ ЧИСЛО. Перебивка обязана читаться тише заголовка раздела.
 *    Тест сравнивает её с НАСТОЯЩИМ заголовком раздела на той же странице, а не
 *    с зашитым 21. Когда заголовок раздела переедет на другую ступень, тест
 *    скажет об этом сам.
 *  · ФОРМА СЕКЦИИ НЕ ТРОГАЕТСЯ: два ряда, туман и наезд коробки. Решение Кости.
 *  · ЛАЙМ ПРИНАДЛЕЖИТ ОДНОЙ КНОПКЕ. Ни одна часть плитки не берёт акцент.
 *  · ЦЕЛЬ НАЖАТИЯ 44 — на единственной кнопке секции было 43.
 *
 * Тест ждёт ПРИЗНАКИ, а не тишину сети: лендинг опрашивает базу и тянет чужие
 * картинки, networkidle там может не наступить вовсе (поймано 23.09).
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];
const ПОРОГ = 4.5;   /* WCAG 1.4.3, мелкий текст */

/** Разбор цвета и контраст — считаем, а не верим на слово. */
const снимок = page => page.evaluate(() => {
    const сек = document.querySelector('.section-badges-cta');
    if (!сек) return null;
    const отк = document.getElementById('badgesCtaCards');
    const зак = document.getElementById('badgesCtaLocked');
    const видимые = э => э ? [...э.children].filter(c => getComputedStyle(c).display !== 'none') : [];

    const разбор = s => (s.match(/[\d.]+/g) || []).map(Number);
    const яркость = ([r, g, b]) => {
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    /* фон берём с ближайшего непрозрачного предка */
    const фонПод = э => {
        let n = э, фон = null;
        while (n && n !== document.documentElement) {
            const p = разбор(getComputedStyle(n).backgroundColor);
            if (p.length && (p[3] === undefined || p[3] > 0)) {
                const a = p[3] === undefined ? 1 : p[3];
                фон = фон ? [0,1,2].map(i => фон[i] * фон[3] + p[i] * (1 - фон[3])).concat([1])
                          : [p[0], p[1], p[2], a];
                if (a === 1) break;
            }
            n = n.parentElement;
        }
        return фон ? фон.slice(0, 3) : [10, 10, 10];
    };
    const ступень = э => {
        if (!э) return null;
        const c = getComputedStyle(э);
        if (c.display === 'none') return null;
        const цв = разбор(c.color), фон = фонПод(э);
        const a = цв[3] === undefined ? 1 : цв[3];
        const см = [0,1,2].map(i => цв[i] * a + фон[i] * (1 - a));
        const x = яркость(см), y = яркость(фон);
        return {
            кегль: parseFloat(c.fontSize), вес: c.fontWeight,
            цвет: c.color, лайм: /204,\s*255,\s*0/.test(c.color),
            контраст: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
        };
    };

    const h2 = сек.querySelector('h2'), p = сек.querySelector('p');
    const к0 = видимые(отк)[0] || null;
    const кн = document.getElementById('badgesCtaBtn');
    const кр = кн ? кн.getBoundingClientRect() : null;

    /* заголовки РАЗДЕЛОВ на этой же странице — с чем сравниваем перебивку */
    const разделы = [...document.querySelectorAll('.section-header h2, section > h2')]
        .filter(e => e !== h2 && getComputedStyle(e).display !== 'none')
        .map(e => parseFloat(getComputedStyle(e).fontSize));

    const сетка = отк ? getComputedStyle(отк) : null;
    const тум = зак ? getComputedStyle(зак) : null;
    const коробка = document.querySelector('.badges-cta-box');

    /* перекрытие коробки и закрытого ряда — наезд обязан быть */
    let наезд = null;
    if (коробка && зак) {
        const a = зак.getBoundingClientRect(), b = коробка.getBoundingClientRect();
        наезд = Math.round(a.bottom - b.top);
    }

    return {
        колонок: сетка ? сетка.gridTemplateColumns.split(' ').filter(Boolean).length : 0,
        открытых: видимые(отк).length,
        закрытых: видимые(зак).length,
        коробки: видимые(отк).map(e => { const r = e.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top) }; }),
        заголовок: ступень(h2), подзаголовок: ступень(p),
        разделМакс: разделы.length ? Math.max(...разделы) : null,
        имя: ступень(к0 ? к0.querySelector('.badge-cta-name') : null),
        пояснение: ступень(к0 ? к0.querySelector('.badge-cta-desc') : null),
        кнопка: кр ? { w: Math.round(кр.width), h: Math.round(кр.height) } : null,
        лаймВПлитке: к0 ? [...к0.querySelectorAll('*')].some(e => /204,\s*255,\s*0/.test(getComputedStyle(e).color)) : false,
        туман: тум ? { блюр: тум.filter, маска: тум.maskImage || тум.webkitMaskImage, мышь: тум.pointerEvents } : null,
        наезд,
        эмодзиСкрыт: к0 ? к0.querySelector('.badge-cta-emoji').getAttribute('aria-hidden') === 'true' : false,
        закрытыйСкрыт: зак ? зак.getAttribute('aria-hidden') === 'true' : false,
        прокрутка: document.documentElement.scrollWidth, окно: window.innerWidth,
        широкий: window.matchMedia('(min-width: 993px)').matches,
        лента: window.matchMedia('(max-width: 992px) and (orientation: landscape) and (max-height: 500px)').matches
    };
});

for (const стр of СТРАНИЦЫ) {

    test.describe('значки · ' + стр.имя, () => {

        test.beforeEach(async ({ page }) => {
            /* НЕ networkidle: страница опрашивает базу и тянет чужие обложки. */
            await page.goto(стр.адрес, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => {
                const g = document.getElementById('badgesCtaCards');
                return !g || getComputedStyle(g).display === 'grid';
            }, null, { timeout: 15000 });
            await page.waitForFunction(
                () => !!document.querySelector('#badgesCtaCards .badge-cta-card'),
                null, { polling: 300, timeout: 10000 }
            ).catch(() => {});
            const есть = await page.evaluate(() => !!document.querySelector('.section-badges-cta'));
            expect(есть, 'секция значков есть в разметке').toBe(true);
            await page.waitForFunction(() => {
                const h = document.documentElement.scrollHeight;
                if (window.__прежняяВысота === h) return true;
                window.__прежняяВысота = h; return false;
            }, null, { polling: 300, timeout: 15000 }).catch(() => {});
        });

        test('колонок столько, сколько решено для этого вида', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.открытых, 'значки не отрисовались');
            /* шесть на широком и в ленте; три на всём, что уже 993 и не лента */
            const ждём = (с.широкий || с.лента) ? 6 : 3;
            expect(с.колонок, 'широкий ' + с.широкий + ' · лента ' + с.лента).toBe(ждём);
        });

        test('плитки одного ряда одной высоты', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.открытых, 'значки не отрисовались');
            const ряды = {};
            с.коробки.forEach(b => { (ряды[b.y] = ряды[b.y] || []).push(b.h); });
            Object.keys(ряды).forEach(y => {
                const в = ряды[y];
                expect(Math.max(...в) - Math.min(...в), 'ряд ' + y + ': ' + в.join(' · ')).toBeLessThanOrEqual(1);
            });
        });

        test('перебивка читается ТИШЕ заголовка раздела', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.разделМакс, 'на странице нет заголовков разделов');
            /* ГЛАВНЫЙ ТЕСТ СЕКЦИИ. Сравниваем с живым заголовком раздела, а не
               с числом: «Играй. Расти. Собирай достижения.» — мотивация, а не
               раздел вроде «Турниры». До 24.09 на 768 и 390 они совпадали. */
            expect(с.заголовок.кегль,
                'перебивка ' + с.заголовок.кегль + ' против раздела ' + с.разделМакс)
                .toBeLessThan(с.разделМакс);
            expect(Number(с.заголовок.вес), 'перебивка легче раздела по весу').toBeLessThan(800);
        });

        test('подзаголовок на ступень ниже заголовка перебивки', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.подзаголовок, 'подзаголовка нет');
            expect(с.подзаголовок.кегль,
                'заголовок ' + с.заголовок.кегль + ' · подзаголовок ' + с.подзаголовок.кегль)
                .toBeLessThan(с.заголовок.кегль);
        });

        test('лайм остался только у кнопки', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.имя, 'значки не отрисовались');
            expect(с.имя.лайм, 'подпись значка: ' + с.имя.цвет).toBe(false);
            expect(с.лаймВПлитке, 'внутри плитки не должно быть акцентного текста').toBe(false);
            expect(с.имя.контраст, 'контраст подписи: ' + с.имя.контраст.toFixed(2)).toBeGreaterThanOrEqual(ПОРОГ);
        });

        test('кнопка не ниже порога цели нажатия', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.кнопка, 'кнопки нет');
            /* было 43 на узких видах — на единственной кнопке секции */
            expect(с.кнопка.h, 'высота кнопки ' + с.кнопка.h).toBeGreaterThanOrEqual(44);
        });

        test('форма секции цела: два ряда, туман, наезд', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.закрытых, 'закрытого ряда нет — база вернула мало значков');
            expect(с.туман.блюр, 'второй ряд размыт').toContain('blur');
            expect(с.туман.маска, 'второй ряд растворяется маской').toContain('gradient');
            expect(с.туман.мышь, 'под туманом нечего нажимать').toBe('none');
            expect(с.наезд, 'коробка кнопки наезжает на закрытый ряд').toBeGreaterThan(0);
        });

        test('пояснение к значку — только там, где есть место', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.имя, 'значки не отрисовались');
            /* решение 24.09: перебивка-баннер не разрастается ради второй строки */
            if (с.широкий) expect(с.пояснение, 'на широком пояснение видно').not.toBeNull();
            else expect(с.пояснение, 'от 992 и уже пояснение скрыто').toBeNull();
        });

        test('значки не мешают экранному диктору', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с || !с.открытых, 'значки не отрисовались');
            expect(с.эмодзиСкрыт, 'эмодзи помечен aria-hidden').toBe(true);
            expect(с.закрытыйСкрыт, 'закрытый ряд выведен из дерева доступности').toBe(true);
        });

        test('секция не создаёт горизонтальной прокрутки', async ({ page }) => {
            const с = await снимок(page);
            test.skip(!с, 'секции нет');
            expect(с.прокрутка).toBeLessThanOrEqual(с.окно + 1);
        });
    });
}
