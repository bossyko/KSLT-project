/**
 * СЕКЦИЯ НОВОСТЕЙ — пять видов, три языка.
 *
 * Решения Кости 23.09, доска 347:9:
 *   три колонки (901 и шире) — три карточки;
 *   две колонки (900 и уже)  — четыре, два полных ряда;
 *   телефон боком            — лента 340 × 270, плитка «Все новости» в конце;
 *   карточка — на одной лестнице с турнирами: заголовок Bold, анонс 72%,
 *   дата 50%.
 *
 * Тест не знает таблицу «какой вид что показывает»: он спрашивает у браузера,
 * какая сетка сработала, и выводит ожидание из неё. От базы тоже не зависит —
 * если новостей нет, ставит фикстуру той же разметки, что строит
 * js/home-news.js.
 *
 * Прогон: npx playwright test tests/e2e/design-system/34-novosti.spec.js
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

const ПОРОГ = 4.5;

/** Ставит четыре новости, если база их не дала. */
async function новостиИлиФикстура(page) {
    return page.evaluate(() => {
        const с = document.getElementById('news');
        const g = document.querySelector('.hn-grid');
        if (!с || !g) return 'нет секции';
        if (с.style.display === 'none') с.style.removeProperty('display');
        if (g.querySelector('.hn-card')) return 'база';
        const карта = i =>
            '<a class="hn-card" href="pages/news.html?id=f' + i + '">'
          + '<div class="hn-img hn-own-cover"><span class="hn-cat">Турниры</span></div>'
          + '<div class="hn-body">'
          + '<h3>Заголовок новости номер ' + (i + 1) + ', иногда длинный и в две строки</h3>'
          + '<p>Короткий анонс новости для проверки вёрстки карточки.</p>'
          + '<span class="hn-date">19 сентября 2026</span>'
          + '</div></a>';
        let html = '';
        for (let i = 0; i < 4; i++) html += карта(i);
        html += '<a class="hn-more" href="pages/news.html"><span>Все новости</span><span>→</span></a>';
        g.innerHTML = html;
        return 'фикстура';
    });
}

/** Какая сетка сработала — спрашиваем браузер, а не таблицу в тесте. */
const сетка = page => page.evaluate(() => {
    const g = document.querySelector('.hn-grid');
    const s = getComputedStyle(g);
    const колонок = s.display === 'grid'
        ? s.gridTemplateColumns.split(' ').filter(Boolean).length : 0;
    return { режим: s.display, колонок, снап: s.scrollSnapType };
});

const снимок = page => page.evaluate(() => {
    const g = document.querySelector('.hn-grid');
    const к = g.getBoundingClientRect();
    const все = [...g.querySelectorAll('.hn-card')];
    const видно = все.filter(e => getComputedStyle(e).display !== 'none');
    const плитка = g.querySelector('.hn-more');

    const разбор = s => {
        const м = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/);
        return м ? [+м[1], +м[2], +м[3], м[4] === undefined ? 1 : +м[4]] : null;
    };
    const яркость = c => {
        const l = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    };
    let фон = разбор(getComputedStyle(видно[0] || g).backgroundColor);
    let n = (видно[0] || g).parentElement;
    while (n && фон && фон[3] < 1) {
        const p = разбор(getComputedStyle(n).backgroundColor);
        if (p && p[3] > 0) фон = [0,1,2].map(i => фон[i]*фон[3] + p[i]*(1-фон[3])).concat([фон[3] + p[3]*(1-фон[3])]);
        n = n.parentElement;
    }
    if (фон && фон[3] < 1) фон = [0,1,2].map(i => фон[i]*фон[3] + 10*(1-фон[3])).concat(1);
    const ступень = сел => {
        const э = видно[0] && видно[0].querySelector(сел);
        if (!э || getComputedStyle(э).display === 'none') return null;
        const c = getComputedStyle(э);
        const цв = разбор(c.color);
        const см = [0,1,2].map(i => цв[i]*цв[3] + фон[i]*(1-цв[3]));
        const a = яркость(см), b = яркость(фон);
        return { альфа: цв[3], кегль: parseFloat(c.fontSize), вес: c.fontWeight,
                 контраст: (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05) };
    };
    return {
        всего: все.length,
        видно: видно.length,
        коробки: видно.map(e => { const r = e.getBoundingClientRect();
            return { w: r.width, h: r.height, x: r.left - к.left, y: r.top }; }),
        ширинаКонтейнера: к.width,
        плитка: плитка ? getComputedStyle(плитка).display : 'нет',
        заголовок: ступень('h3'), анонс: ступень('p'), дата: ступень('.hn-date'),
        /* левый край заголовка и даты ВНУТРИ карточки: у заголовка был свой
           padding: 0 9px поверх полей тела — название уходило на 18 от края,
           дата стояла на 9, и левый край внутри карточки шёл лесенкой */
        края: (() => {
            const к0 = видно[0];
            if (!к0) return null;
            const r = к0.getBoundingClientRect();
            const о = сел => { const э = к0.querySelector(сел);
                if (!э || getComputedStyle(э).display === 'none') return null;
                return Math.round(э.getBoundingClientRect().left - r.left); };
            return { заголовок: о('h3'), дата: о('.hn-date') };
        })(),
        прокрутка: document.documentElement.scrollWidth, окно: window.innerWidth
    };
});

for (const стр of СТРАНИЦЫ) {

    test.describe('новости · ' + стр.имя, () => {

        test.beforeEach(async ({ page }) => {
            /* НЕ waitForLoadState('networkidle'). Страница опрашивает базу и
               тянет чужие обложки — тишины сети может не наступить вовсе.
               23.09 это уронило en/desktop на ровном месте: 30 секунд
               ожидания и ⊗1 на навигации при полностью исправной вёрстке.
               Ждём ПРИЗНАКИ, а не тишину, — тем же приёмом, что 30-ритм и
               31-live: сперва доказательство, что наш css применился, потом
               что страница перестала расти. */
            await page.goto(стр.адрес, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => {
                const g = document.querySelector('.hn-grid');
                return !g || ['grid', 'flex'].includes(getComputedStyle(g).display);
            }, null, { timeout: 15000 });
            /* даём базе шанс дорисовать карточки, но НЕ падаем без них:
               пустая таблица — это не сломанная вёрстка, для неё есть фикстура */
            await page.waitForFunction(
                () => !!document.querySelector('.hn-grid .hn-card'),
                null, { polling: 300, timeout: 8000 }
            ).catch(() => {});
            const итог = await новостиИлиФикстура(page);
            expect(итог, 'секция новостей есть в разметке').not.toBe('нет секции');
            await page.waitForFunction(() => {
                const h = document.documentElement.scrollHeight;
                if (window.__прежняяВысота === h) return true;
                window.__прежняяВысота = h;
                return false;
            }, null, { polling: 300, timeout: 15000 }).catch(() => {});
        });

        test('видно столько, сколько заполняет ряды целиком', async ({ page }) => {
            const с = await сетка(page);
            const сн = await снимок(page);
            /* лента — все; три колонки — три; две колонки — четыре */
            const ждём = с.режим === 'flex' ? сн.всего : (с.колонок >= 3 ? 3 : 4);
            expect(сн.видно, 'сетка: ' + JSON.stringify(с)).toBe(Math.min(ждём, сн.всего));
        });

        test('в сетке ни один ряд не остаётся полупустым', async ({ page }) => {
            const с = await сетка(page);
            test.skip(с.режим === 'flex', 'в ленте рядов нет');
            const сн = await снимок(page);
            const ряды = {};
            сн.коробки.forEach(b => { const y = Math.round(b.y); (ряды[y] = ряды[y] || []).push(b); });
            const счёт = Object.keys(ряды).map(y => ряды[y].length);
            if (счёт.length > 1) {
                expect(Math.min(...счёт), 'ряды: ' + счёт.join(' + ') + ' при ' + с.колонок + ' колонках')
                    .toBe(Math.max(...счёт));
            }
        });

        test('лента — полоса со снапом и плиткой, сетка — сетка', async ({ page }) => {
            const с = await сетка(page);
            const сн = await снимок(page);
            if (с.режим === 'flex') {
                expect(с.снап).toContain('x');
                expect(Math.round(сн.коробки[0].w)).toBe(340);
                expect(Math.round(сн.коробки[0].h)).toBe(270);
                const вкадре = сн.коробки.filter(b => b.x + b.w <= сн.ширинаКонтейнера + 1).length;
                expect(вкадре, 'целых карточек в кадре').toBe(2);
                expect(сн.плитка, 'плитка «Все новости» в конце полосы').toBe('flex');
            } else {
                expect(сн.плитка, 'в сетке плитки нет — её роль у ссылки в шапке').toBe('none');
            }
        });

        test('карточки одного ряда одной высоты', async ({ page }) => {
            const сн = await снимок(page);
            const ряды = {};
            сн.коробки.forEach(b => { const y = Math.round(b.y); (ряды[y] = ряды[y] || []).push(Math.round(b.h)); });
            Object.keys(ряды).forEach(y => {
                const в = ряды[y];
                expect(Math.max(...в) - Math.min(...в), 'ряд ' + y + ': ' + в.join(' · ')).toBeLessThanOrEqual(1);
            });
        });

        test('лестница цвета карточки — три ступени, и все читаются', async ({ page }) => {
            const сн = await снимок(page);
            test.skip(!сн.заголовок, 'в секции нет карточек');
            expect(сн.заголовок.альфа, 'заголовок — верхняя ступень').toBe(1);
            expect(сн.заголовок.вес, 'заголовок Bold — ступень card title').toBe('700');
            expect(сн.дата.альфа, 'дата ниже заголовка').toBeLessThan(сн.заголовок.альфа);
            if (сн.анонс) expect(сн.анонс.альфа, 'анонс выше даты').toBeGreaterThan(сн.дата.альфа);
            /* дата жила на 35% белого — 3.22 при кегле 12 */
            ['заголовок', 'дата'].forEach(имя => {
                expect(сн[имя].контраст, имя + ': ' + сн[имя].контраст.toFixed(2)).toBeGreaterThanOrEqual(ПОРОГ);
            });
        });

        test('кегль заголовка — ступень лестницы для этого вида', async ({ page }) => {
            const с = await сетка(page);
            const узко = await page.evaluate(() => matchMedia('(max-width: 640px)').matches);
            /* ТЕЛЕФОННАЯ СТУПЕНЬ — не только по ширине. Лента живёт на 844, но
               телефон боком — всё ещё телефон, и карточка там 340, как у турнира,
               который в той же ленте набран 14. Обход 23.09 положил их рядом. */
            const телефонная = узко || с.режим === 'flex';
            const сн = await снимок(page);
            test.skip(!сн.заголовок, 'в секции нет карточек');
            expect(сн.заголовок.кегль, телефонная ? 'телефонная ступень 14' : 'широкая ступень 16')
                .toBe(телефонная ? 14 : 16);
        });

        test('заголовок и дата стоят на одном левом крае', async ({ page }) => {
            const сн = await снимок(page);
            test.skip(!сн.края || сн.края.заголовок === null || сн.края.дата === null,
                'в секции нет карточек или дата скрыта');
            expect(сн.края.заголовок,
                'заголовок ' + сн.края.заголовок + ' против даты ' + сн.края.дата +
                ' — отступы держит тело карточки, а не заголовок')
                .toBe(сн.края.дата);
        });

        test('дата в тесной карточке — того же кегля, что у турнира', async ({ page }) => {
            const с = await сетка(page);
            const узко = await page.evaluate(() => matchMedia('(max-width: 640px)').matches);
            const тесная = узко || с.режим === 'flex';
            const сн = await снимок(page);
            test.skip(!сн.дата, 'в секции нет карточек');
            /* карточка одной ширины — мета одного кегля: на телефоне обе секции
               идут по две в ряд по 163, в ленте обе по 340. У турнира там 11,
               у новости оставалось 12 — и на телефоне, и в ленте. */
            expect(сн.дата.кегль, тесная ? 'тесная карточка — 11' : 'широкая — 12')
                .toBe(тесная ? 11 : 12);
        });

        test('плашка категории — бейдж по компоненту, а не своя таблетка', async ({ page }) => {
            const п = await page.evaluate(() => {
                const э = document.querySelector('.hn-cat');
                if (!э) return null;
                const c = getComputedStyle(э), r = э.getBoundingClientRect();
                const разбор = s => (s.match(/[\d.]+/g) || []).map(Number);
                const яркость = ([r0,g,b]) => { const f = v => { v/=255;
                    return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
                    return 0.2126*f(r0)+0.7152*f(g)+0.0722*f(b); };
                const фон = разбор(c.backgroundColor);
                const текст = разбор(c.color);
                const альфаФона = фон.length === 4 ? фон[3] : 1;
                const см = [0,1,2].map(i => текст[i]*(текст[3] === undefined ? 1 : текст[3]) + фон[i]*(1-(текст[3] === undefined ? 1 : текст[3])));
                const a = яркость(см), b = яркость(фон.slice(0,3));
                return { высота: Math.round(r.height), кегль: parseFloat(c.fontSize), вес: c.fontWeight,
                         разрядка: c.letterSpacing, регистр: c.textTransform, альфаФона,
                         контраст: (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05) };
            });
            test.skip(!п, 'в секции нет карточек с плашкой');
            /* подложка непрозрачна — иначе контраст зависит от афиши под ней */
            expect(п.альфаФона, 'подложка плашки должна быть непрозрачной').toBe(1);
            expect(п.высота, 'высота по компоненту Badge 27:53').toBe(24);
            expect(п.кегль, 'кегль 11').toBe(11);
            expect(п.вес, 'Medium, а не Bold').toBe('500');
            expect(п.разрядка, 'разрядка 0.5').toBe('0.5px');
            expect(п.регистр).toBe('uppercase');
            expect(п.контраст, 'контраст плашки: ' + п.контраст.toFixed(2)).toBeGreaterThanOrEqual(ПОРОГ);
        });

        test('секция не создаёт горизонтальной прокрутки', async ({ page }) => {
            const сн = await снимок(page);
            expect(сн.прокрутка).toBeLessThanOrEqual(сн.окно + 1);
        });
    });
}
