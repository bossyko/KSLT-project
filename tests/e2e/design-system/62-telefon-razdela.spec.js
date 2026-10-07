/**
 * УЗКИЕ ВИДЫ РАЗДЕЛА: ЦИФРЫ ОБЛОЖКИ, ПОЛОСА ФИЛЬТРОВ, КАРТОЧКА РАЗРЯДА — 07.10.
 *
 * Три беды, найденные Костей глазами и померенные после:
 *   • пара цифр на обложке стояла в первых двух дорожках из трёх — нулевой
 *     показатель прятался видом, а счёт колонок идёт по ДЕТЯМ;
 *   • липкая полоса фильтров рейтинга занимала 46% экрана на телефоне лёжа;
 *   • блок «Предстоящие» на странице разряда ловил правила витрины: крупная
 *     карточка 166 × 200, кнопка записи обрезана, второй турнир 0 × 0.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • СКОЛЬКО ДОРОЖЕК ВЫШЛО В БРАУЗЕРЕ. В файле селектор `:has()`, число
 *     даёт только замер — и оно зависит от ДАННЫХ: у разряда без призового
 *     фонда показателей два, у дружеских три;
 *   • ЦЕНТР ПАРЫ ПРОТИВ ЦЕНТРА ОБЛОЖКИ. Два числа разной ширины в равных
 *     дорожках центрируются каждое в своей половине;
 *   • ДОЛЮ ЭКРАНА У ЛИПКОЙ ПОЛОСЫ. Её держит не одно правило, а сумма
 *     полей, отбивок и переносов;
 *   • НАЛОЖЕНИЯ И ТЕКСТ ПОВЕРХ АФИШИ. Афиша лежит слоем `::before` и места
 *     под себя не занимает: поле и слой расходятся молча;
 *   • ЧТО БУДЕТ С НОВЫМ ТУРНИРОМ. Разряды проходятся ВСЕ: у каждого свой
 *     набор — с афишей и без, с кнопкой записи и без, один турнир и шесть.
 *
 * ПОРОГ: если карточек или цифр на экране нет, проверка ПАДАЕТ, а не
 * проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const РАЗРЯДЫ = ['tour', 'futures', 'challenger', 'masters', 'promasters', 'friendly'];

const ЯЗЫКИ = [
    { имя: 'ru', турниры: '/pages/tournaments.html', рейтинг: '/pages/players.html' },
    { имя: 'en', турниры: '/pages/tournaments-en.html', рейтинг: '/pages/players-en.html' },
    { имя: 'kg', турниры: '/pages/tournaments-kg.html', рейтинг: '/pages/players-kg.html' },
];

/**
 * Ждём ПРИЗНАК, а не тишину сети. Признак — ОТРИСОВАННАЯ страница, а не
 * «появились цифры»: 07.10 первый прогон у Кости встал по таймауту на
 * трёх разрядах, и снимок показал почему — в тестовой базе у них турниров
 * НЕТ ВОВСЕ. Ноль убирает показатель, все показатели нулевые, блок пуст,
 * и проба ждала того, чего быть не должно. ПУСТОЙ РАЗРЯД — ЗАКОННОЕ
 * СОСТОЯНИЕ, и проверяется он отдельно, а не таймаутом.
 */
async function обложка(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.trn-block, .trn-empty, .to-empty') !== null,
        null, { timeout: 20000 });
    await page.waitForTimeout(1200);
}

/* ═══ 1. ЦИФРЫ ОБЛОЖКИ — ПО ЦЕНТРУ ПРИ ЛЮБОМ ИХ ЧИСЛЕ ══════════════════ */

for (const Я of ЯЗЫКИ) {
test.describe('цифры обложки · ' + Я.имя, () => {

    for (const разряд of РАЗРЯДЫ) {
        test('дорожек столько же, сколько живых цифр · ' + разряд, async ({ page }) => {
            await обложка(page, Я.турниры + '?category=' + разряд);
            const з = await page.evaluate(() => {
                const б = document.querySelector('.tournament-hero-stats');
                const s = getComputedStyle(б);
                const дорожек = s.display === 'grid'
                    ? s.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
                    : null;
                const видимых = [...б.children]
                    .filter(c => getComputedStyle(c).display !== 'none').length;
                const обл = б.closest('.tournament-hero');
                const rб = б.getBoundingClientRect(), rо = обл.getBoundingClientRect();
                const живые = [...б.children].filter(c => c.getBoundingClientRect().width > 0)
                    .map(c => c.getBoundingClientRect());
                const центрПары = живые.length
                    ? (живые[0].left + живые[живые.length - 1].right) / 2 : null;
                return {
                    детей: б.children.length, видимых, дорожек,
                    центрПары, центрОбложки: rо.left + rо.width / 2,
                    центрБлока: rб.left + rб.width / 2,
                    высотаБлока: rб.height,
                };
            });

            // ПУСТОЙ РАЗРЯД — ЗАКОННОЕ СОСТОЯНИЕ: турниров нет, цифр тоже.
            // Тогда проверяем ровно одно: пустая обложка не держит полосу.
            if (з.детей === 0) {
                expect(з.высотаБлока, 'цифр нет, а блок всё равно занимает место')
                    .toBeLessThanOrEqual(1);
                return;
            }
            // НОЛЬ УБИРАЕТ ПОКАЗАТЕЛЬ ИЗ ДЕРЕВА: спрятанных детей быть не должно
            expect(з.видимых, 'спрятанный показатель остался в дереве — счёт дорожек соврёт')
                .toBe(з.детей);
            if (з.дорожек !== null) {
                expect(з.дорожек, 'дорожек не столько, сколько цифр').toBe(з.видимых);
            }
            expect(Math.abs(з.центрПары - з.центрОбложки),
                'центр пары цифр ушёл от центра обложки').toBeLessThanOrEqual(8);
        });
    }

    test('заголовок и цифры стоят одной группой, а не по краям обложки', async ({ page }) => {
        await обложка(page, Я.турниры + '?category=masters');
        const з = await page.evaluate(() => {
            const h1 = document.querySelector('#categoryTitle');
            const ст = document.querySelector('.tournament-hero-stats');
            const обл = ст.closest('.tournament-hero');
            return {
                зазор: ст.getBoundingClientRect().top - h1.getBoundingClientRect().bottom,
                высотаОбложки: обл.getBoundingClientRect().height,
            };
        });
        expect(з.высотаОбложки, 'ПОРОГ: обложки нет').toBeGreaterThan(100);
        // ОТНОШЕНИЕ, А НЕ ЧИСЛО: зазор не растёт вместе с обложкой
        expect(з.зазор, 'между заголовком и цифрами встала пустая полоса')
            .toBeLessThanOrEqual(з.высотаОбложки / 3);
    });
});
}

/* ═══ 2. КАРТОЧКИ РАЗРЯДА — БЕЗ НАЛОЖЕНИЙ И С ЦЕЛОЙ КНОПКОЙ ════════════ */

for (const Я of ЯЗЫКИ) {
test.describe('карточки разряда · ' + Я.имя, () => {

    for (const разряд of РАЗРЯДЫ) {
        test('ничего не наехало и кнопка записи цела · ' + разряд, async ({ page }) => {
            await обложка(page, Я.турниры + '?category=' + разряд);
            await page.waitForTimeout(900);
            const з = await page.evaluate(() => {
                const карточки = [...document.querySelectorAll(
                    '.trn-block .to-compact, .trn-block .to-featured, .trn-block .to-featured-side')]
                    .filter(c => c.getBoundingClientRect().height > 0);
                const беды = [];
                карточки.forEach(c => {
                    const rc = c.getBoundingClientRect(), s = getComputedStyle(c);
                    const имя = (c.className || '').split(' ')[0];
                    // слой-ссылка лежит поверх нарочно — он не в счёт
                    const дети = [...c.children].filter(x => !/cover/.test(x.className || ''))
                        .map(x => {
                            const r = x.getBoundingClientRect();
                            return { n: (x.className || '').split(' ')[0], l: r.left, t: r.top,
                                     r: r.right, b: r.bottom, w: r.width, h: r.height };
                        });
                    дети.forEach(a => {
                        if (a.w < 1 && a.h > 1) беды.push(имя + ': ширина НОЛЬ у ' + a.n);
                    });
                    for (let i = 0; i < дети.length; i++)
                        for (let j = i + 1; j < дети.length; j++) {
                            const a = дети[i], b = дети[j];
                            if (a.w < 1 || b.w < 1) continue;
                            const dx = Math.min(a.r, b.r) - Math.max(a.l, b.l);
                            const dy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
                            if (dx > 1 && dy > 1) беды.push(имя + ': наложение ' + a.n + ' × ' + b.n);
                        }
                    // текст поверх афиши: слой рисуется только когда он не снят
                    const рисуется = c.classList.contains('to-compact-thumb') &&
                        getComputedStyle(c, '::before').display !== 'none';
                    if (рисуется) {
                        const аф = parseFloat(s.getPropertyValue('--to-thumb')) || 120;
                        дети.forEach(a => {
                            if (a.w > 0 && a.l - rc.left < аф - 1)
                                беды.push(имя + ': ' + a.n + ' лёг на афишу');
                        });
                    }
                    const кн = c.querySelector('.to-compact-regbtn, .btn-register, .tc-btn');
                    if (кн) {
                        const rk = кн.getBoundingClientRect();
                        if (rk.height > 0) {
                            if (rk.height < 43.5) беды.push(имя + ': кнопка записи ' + Math.round(rk.height));
                            if (rk.bottom > rc.bottom + 1 || rk.right > rc.right + 1)
                                беды.push(имя + ': кнопка записи вышла за карточку');
                        }
                    }
                });
                return {
                    карточек: карточки.length, беды,
                    /* Страница отрисовалась, карточек нет — значит разряд пуст,
                       а не проба промахнулась мимо разметки */
                    пусто: document.querySelectorAll('.trn-block').length > 0,
                    перелив: document.documentElement.scrollWidth - window.innerWidth,
                };
            });

            // Разряд без турниров карточек не рисует — и это не беда пробы
            if (з.карточек === 0) {
                expect(з.пусто, 'карточек нет, но и слова о пустоте тоже').toBe(true);
                return;
            }
            expect(з.беды, 'карточки разряда поехали').toEqual([]);
            expect(з.перелив, 'страница переливается вбок').toBeLessThanOrEqual(0);
        });
    }
});
}

/* ═══ 3. ЛИПКАЯ ПОЛОСА ФИЛЬТРОВ РЕЙТИНГА ═══════════════════════════════ */

for (const Я of ЯЗЫКИ) {
test.describe('полоса фильтров рейтинга · ' + Я.имя, () => {

    for (const [имя, адрес] of [['обзорная', ''], ['разряд', '?tab=men-masters']]) {
        test('полоса не забирает треть экрана · ' + имя, async ({ page }) => {
            await page.goto(Я.рейтинг + адрес);
            await page.waitForFunction(
                () => document.querySelectorAll('.pl-gender-tab').length > 0,
                null, { timeout: 20000 });
            await page.waitForTimeout(900);
            const з = await page.evaluate(() => {
                const п = document.querySelector('.pl-filters-section');
                const r = п.getBoundingClientRect();
                const чипы = [...document.querySelectorAll('.pl-gender-tab')];
                // Цель нажатия меряется ПОПАДАНИЕМ, а не высотой коробки
                const мелкие = [];
                чипы.forEach(ч => {
                    const rr = ч.getBoundingClientRect();
                    if (rr.top < 0 || rr.bottom > window.innerHeight) return;
                    const x = Math.round(rr.left + rr.width / 2);
                    const центрY = rr.top + rr.height / 2;
                    const своя = y => {
                        const э = document.elementFromPoint(x, Math.round(y));
                        return !!(э && (э === ч || ч.contains(э)));
                    };
                    let верх = центрY, низ = центрY;
                    while (верх > 1 && своя(верх - 1)) верх--;
                    while (низ < window.innerHeight - 1 && своя(низ + 1)) низ++;
                    /* ШАГ ОБХОДА — ЦЕЛЫЙ ПИКСЕЛЬ, И ОДИН ОН ТЕРЯЕТ. Прогон
                       07.10 дал 43 у коробки ровно 44: сравнивать надо не с
                       числом, а с САМОЙ коробкой. Проверяются два отношения:
                       попадание покрывает всю коробку, и коробка стоит на
                       ступени шкалы кнопок. */
                    const коробка = Math.round(rr.height);
                    if (низ - верх < коробка - 1 || коробка < 44)
                        мелкие.push({ попадание: Math.round(низ - верх), коробка });
                });
                return {
                    чипов: чипы.length,
                    высота: Math.round(r.height),
                    доля: r.height / window.innerHeight,
                    липкая: getComputedStyle(п).position === 'sticky',
                    мелкие,
                };
            });

            expect(з.чипов, 'ПОРОГ: без чипов пола проверка прошла бы вхолостую')
                .toBeGreaterThan(0);
            // ОТНОШЕНИЕ, А НЕ ЧИСЛО: липкая полоса не забирает треть экрана
            if (з.липкая) {
                expect(з.доля, 'липкая полоса фильтров заняла ' +
                    Math.round(з.доля * 100) + '% экрана (' + з.высота + ')')
                    .toBeLessThanOrEqual(0.34);
            }
            expect(з.мелкие, 'цель нажатия чипа пола меньше 44').toEqual([]);
        });
    }
});
}
