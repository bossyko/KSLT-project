/**
 * УЗКИЕ ВИДЫ СЕКЦИИ ТУРНИРОВ — пять видов, три языка.
 *
 * Решения Кости 23.09, доски 341:9 (телефон), 341:105 (лента), 341:52 (планшет):
 *   телефон вертикально — одна широкая сверху, две под ней, всего три;
 *   телефон боком       — лента: карточка 340 × 270, снап, плитка «Все турниры»;
 *   планшет вертикально — пять карточек, 1 + 2 + 2;
 *   десктоп и планшет боком — как были.
 *
 * Тест НЕ ЗНАЕТ таблицу «какой вид что показывает»: он спрашивает у браузера,
 * какой слой сработал, и из этого выводит ожидание. Иначе с каждым новым слоем
 * появлялась бы вторая таблица, и однажды она разошлась бы с css.
 *
 * От базы тест тоже не зависит: если турниров нет, он ставит шесть фикстур той
 * же разметки, что строит js/tournament-card.js.
 *
 * Прогон: npx playwright test tests/e2e/design-system/33-turniry-vidy.spec.js
 */
const { test, expect } = require('@playwright/test');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/index.html' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

/** Какой слой сработал — теми же медиазапросами, что в css. */
const слои = page => page.evaluate(() => ({
    лента:   matchMedia('(max-width: 992px) and (orientation: landscape) and (max-height: 500px)').matches,
    телефон: matchMedia('(max-width: 640px)').matches,
    планшет: matchMedia('(min-width: 641px) and (max-width: 992px) and (orientation: portrait)').matches
}));

/** Сколько карточек обязано быть видно при этом слое. */
const ожидаемоКарточек = с => с.лента ? 6 : с.телефон ? 3 : с.планшет ? 5 : 6;

/** Ставит шесть карточек, если база их не дала. Разметка — как у tournament-card.js. */
async function карточкиИлиФикстура(page) {
    return page.evaluate(() => {
        const сетка = document.querySelector('.tournaments-grid');
        if (!сетка) return 'нет сетки';
        const раздел = document.getElementById('tournaments');
        if (раздел && getComputedStyle(раздел).display === 'none') раздел.style.display = '';
        if (сетка.querySelector('.tc')) return 'база';
        const карта = (i) =>
            '<a class="tc' + (i === 0 ? ' tc-featured' : '') + '" href="pages/tournament.html?id=f' + i + '">'
          + '<div class="tc-image"><div class="tc-noimage">T</div>'
          + '<span class="tc-badge tc-badge-open">Регистрация открыта</span></div>'
          + '<div class="tc-body">'
          + '<div class="tc-date">19 сентября 2026</div>'
          + '<h3 class="tc-title">Дружеский турнир в категории MASTERS ' + (i + 1) + '</h3>'
          + '<div class="tc-desc">Описание турнира для проверки вёрстки.</div>'
          + '<div class="tc-meta"><span class="tc-slots">10 пар</span><span>Bishkek Park</span></div>'
          + '<span class="tc-btn">Записаться</span>'
          + '</div></a>';
        let html = '';
        for (let i = 0; i < 6; i++) html += карта(i);
        html += '<a class="tc-more" href="pages/tournaments-overview.html"><span>Все турниры</span><span>→</span></a>';
        сетка.innerHTML = html;
        return 'фикстура';
    });
}

const снимок = page => page.evaluate(() => {
    const сетка = document.querySelector('.tournaments-grid');
    const все = [...document.querySelectorAll('.tournaments-grid > .tc')];
    const видно = все.filter(k => getComputedStyle(k).display !== 'none');
    const к = сетка.getBoundingClientRect();
    const плитка = document.querySelector('.tc-more');
    const текст = (э, сел) => { const n = э && э.querySelector(сел); if (!n) return null;
        const c = getComputedStyle(n); return { кегль: parseFloat(c.fontSize), вес: c.fontWeight, высота: n.getBoundingClientRect().height }; };
    return {
        всего: все.length,
        видно: видно.length,
        режим: getComputedStyle(сетка).display,
        снап: getComputedStyle(сетка).scrollSnapType,
        ширинаКонтейнера: к.width,
        /* x считаем ОТ ЛЕВОГО КРАЯ ПОЛОСЫ, а не от края окна: иначе сравнение
           «влезла ли карточка в кадр» сложило бы координату окна с шириной
           контейнера — две разные системы отсчёта. */
        коробки: видно.map(k => { const r = k.getBoundingClientRect();
            return { w: r.width, h: r.height, x: r.left - к.left, y: r.top }; }),
        плитка: плитка ? getComputedStyle(плитка).display : 'нет',
        главная: текст(видно[0], '.tc-title'),
        обычная: видно[1] ? текст(видно[1], '.tc-title') : null,
        мета: текст(видно[0], '.tc-meta'),
        кнопка: текст(видно[0], '.tc-btn'),
        прокруткаДокумента: document.documentElement.scrollWidth,
        окно: window.innerWidth
    };
});

for (const стр of СТРАНИЦЫ) {

    test.describe('узкие виды турниров · ' + стр.имя, () => {

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
                const g = document.querySelector('.tournaments-grid');
                return !g || ['grid', 'flex'].includes(getComputedStyle(g).display);
            }, null, { timeout: 15000 });
            /* даём базе шанс дорисовать карточки, но НЕ падаем без них:
               пустая таблица — это не сломанная вёрстка, для неё есть фикстура */
            await page.waitForFunction(
                () => !!document.querySelector('.tournaments-grid .tc'),
                null, { polling: 300, timeout: 8000 }
            ).catch(() => {});
            const итог = await карточкиИлиФикстура(page);
            expect(итог, 'секция турниров есть в разметке').not.toBe('нет сетки');
            await page.waitForFunction(() => {
                const h = document.documentElement.scrollHeight;
                if (window.__прежняяВысота === h) return true;
                window.__прежняяВысота = h;
                return false;
            }, null, { polling: 300, timeout: 15000 }).catch(() => {});
        });

        test('видно ровно столько карточек, сколько заполняет ряды', async ({ page }) => {
            const с = await слои(page);
            const сн = await снимок(page);
            expect(сн.видно, 'слой: ' + JSON.stringify(с)).toBe(Math.min(ожидаемоКарточек(с), сн.всего));
        });

        test('главная карточка шире остальных — кроме ленты', async ({ page }) => {
            const с = await слои(page);
            const сн = await снимок(page);
            test.skip(сн.видно < 2, 'карточек меньше двух');
            if (с.лента) {
                /* В ленте роль главной несёт ПОРЯДОК: при 340 в ширину второй
                   формы не помещается. Карточки одинаковые — это решение. */
                expect(Math.round(сн.коробки[0].w)).toBe(Math.round(сн.коробки[1].w));
            } else {
                expect(сн.коробки[0].w).toBeGreaterThan(сн.коробки[1].w);
            }
        });

        test('лента — полоса со снапом, сетка — сетка', async ({ page }) => {
            const с = await слои(page);
            const сн = await снимок(page);
            if (с.лента) {
                expect(сн.режим).toBe('flex');
                expect(сн.снап).toContain('x');
                expect(Math.round(сн.коробки[0].w)).toBe(340);
                expect(Math.round(сн.коробки[0].h)).toBe(270);
                /* Две целые в кадре и кусок третьей: без выглядывающей полоса
                   читается как законченный ряд, и её никто не листает. */
                const вкадре = сн.коробки.filter(b => b.x + b.w <= сн.ширинаКонтейнера + 1).length;
                expect(вкадре, 'целых карточек в кадре').toBe(2);
                expect(сн.коробки[2].x, 'третья начинается внутри кадра').toBeLessThan(сн.ширинаКонтейнера);
                expect(сн.плитка, 'плитка «Все турниры» в конце полосы').toBe('flex');
            } else {
                expect(сн.режим).toBe('grid');
                expect(сн.плитка, 'в сетке плитки нет — её роль у ссылки в шапке').toBe('none');
            }
        });

        test('все карточки одного ряда одной высоты', async ({ page }) => {
            const сн = await снимок(page);
            const ряды = {};
            сн.коробки.forEach(b => { const y = Math.round(b.y); (ряды[y] = ряды[y] || []).push(Math.round(b.h)); });
            Object.keys(ряды).forEach(y => {
                const в = ряды[y];
                expect(Math.max(...в) - Math.min(...в), 'ряд ' + y + ': ' + в.join(' · ')).toBeLessThanOrEqual(1);
            });
        });

        test('подпись мельче названия, а не вровень с ним', async ({ page }) => {
            const сн = await снимок(page);
            test.skip(!сн.мета || !сн.главная, 'в карточке нет меты');
            expect(сн.мета.кегль, 'мета ' + сн.мета.кегль + ' против названия ' + сн.главная.кегль)
                .toBeLessThan(сн.главная.кегль);
        });

        test('на узких видах цель нажатия кнопки не меньше 44', async ({ page }) => {
            const с = await слои(page);
            test.skip(!с.телефон && !с.лента, 'вид не узкий');
            const сн = await снимок(page);
            test.skip(!сн.кнопка, 'у карточки нет кнопки');
            expect(Math.round(сн.кнопка.высота)).toBeGreaterThanOrEqual(44);
        });

        test('лестница цвета в карточке — три ступени, и все читаются', async ({ page }) => {
            /* 23.09 Костя: «дата название описание все одного белого цвета, всё
               сливается». Причина была в моей же правке — дата ушла с лайма на
               белый и встала на одну ступень с названием. Теперь ступеней три:
               100 — что это, 72 — про что это, 50 — подробности. Проверяем не
               строки в css, а то, что нарисовал браузер, и считаем контраст. */
            const л = await page.evaluate(() => {
                const карта = document.querySelector('.tournaments-grid > .tc');
                if (!карта) return null;
                const разбор = s => {
                    const м = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/);
                    return м ? [+м[1], +м[2], +м[3], м[4] === undefined ? 1 : +м[4]] : null;
                };
                const яркость = c => {
                    const l = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
                };
                /* фон карточки полупрозрачный — складываем с предками до непрозрачного */
                let фон = разбор(getComputedStyle(карта).backgroundColor);
                let n = карта.parentElement;
                while (n && фон && фон[3] < 1) {
                    const p = разбор(getComputedStyle(n).backgroundColor);
                    if (p && p[3] > 0) фон = [0,1,2].map(i => фон[i]*фон[3] + p[i]*(1-фон[3])).concat([фон[3] + p[3]*(1-фон[3])]);
                    n = n.parentElement;
                }
                if (фон && фон[3] < 1) фон = [0,1,2].map(i => фон[i]*фон[3] + 10*(1-фон[3])).concat(1);
                const ступень = сел => {
                    const э = карта.querySelector(сел);
                    if (!э || getComputedStyle(э).display === 'none') return null;
                    const c = разбор(getComputedStyle(э).color);
                    const см = [0,1,2].map(i => c[i]*c[3] + фон[i]*(1-c[3]));
                    const a = яркость(см), b = яркость(фон);
                    return { альфа: c[3], контраст: (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05) };
                };
                return { название: ступень('.tc-title'), дата: ступень('.tc-date'),
                         описание: ступень('.tc-desc'), места: ступень('.tc-meta') };
            });
            test.skip(!л || !л.название, 'в секции нет карточек');
            expect(л.название.альфа, 'название — верхняя ступень').toBe(1);
            expect(л.дата.альфа, 'дата ниже названия').toBeLessThan(л.название.альфа);
            expect(л.места.альфа, 'места ниже даты').toBeLessThan(л.дата.альфа);
            if (л.описание) expect(л.описание.альфа, 'описание на одной ступени с датой').toBe(л.дата.альфа);
            /* «места» жили на 35% белого — 3.22 при кегле 14, ниже порога 4.5 */
            ['название', 'дата', 'места'].forEach(имя => {
                expect(л[имя].контраст, имя + ': ' + л[имя].контраст.toFixed(2)).toBeGreaterThanOrEqual(4.5);
            });
        });

        test('секция не создаёт горизонтальной прокрутки', async ({ page }) => {
            const сн = await снимок(page);
            expect(сн.прокруткаДокумента).toBeLessThanOrEqual(сн.окно + 1);
        });
    });
}
