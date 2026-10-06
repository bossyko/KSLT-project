/**
 * ЛЕНТА ФИЛЬТРОВ И ОДИН РОСТ КАРТОЧЕК — 05.10.
 *
 * Замер пяти видов нашёл в полосе девять целей нажатия и НИ ОДНОЙ 44, две
 * лаймовые «Все» в одном ряду из-за того, что семь чипов двух разных
 * смыслов лежали одной лентой, липкую полосу в 156 при экране 390 и
 * разброс высоты карточек до 108 в одной категории.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • ДОХОДИТ ЛИ НАЖАТИЕ. Высота коробки и цель нажатия — разные вещи.
 *     Слой 44 на ::after стоял и срабатывал у первого и последнего чипа в
 *     группе, а у средних нет: elementFromPoint возвращал ленту. Меряем
 *     попадание, а не наличие правила;
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя, число говорит
 *     замер;
 *   • СОВПАДЕНИЕ ДВУХ КРАЁВ — ленты и заголовка. Заморозка читает файлы
 *     по одному и сравнить их не может;
 *   • ОДИН РОСТ КАРТОЧЕК: он складывается из данных, а не из css.
 *
 * ПОРОГ: если чипов или карточек на экране нет, проверка ПАДАЕТ, а не
 * проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КНОПОК = [28, 36, 44, 52];
const СТУПЕНИ_МЕЖСТР = [1, 1.1, 1.3, 1.5, 1.65];

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/tournaments.html?category=masters' },
    { имя: 'en', адрес: '/pages/tournaments-en.html?category=masters' },
    { имя: 'kg', адрес: '/pages/tournaments-kg.html?category=masters' },
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(() => document.querySelectorAll('.trn-chip').length > 0,
        null, { timeout: 15000 });
    await page.waitForTimeout(1200);
}

for (const Я of ЯЗЫКИ) {

test.describe('лента фильтров · ' + Я.имя, () => {

    test('нажатие доходит до верхнего и нижнего края каждого живого чипа', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const видно = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
            const чипы = [...document.querySelectorAll('.trn-chip')].filter(видно);
            const живые = чипы.filter(c => !c.disabled);
            const плохие = [];
            const высоты = [];
            for (const ч of живые) {
                const r = ч.getBoundingClientRect();
                высоты.push(Math.round(r.height));
                if (!(r.top >= 0 && r.bottom <= window.innerHeight)) continue;
                const x = Math.round(r.left + r.width / 2);
                const своя = y => {
                    const э = document.elementFromPoint(x, Math.round(y));
                    return !!(э && (э === ч || ч.contains(э)));
                };
                if (!(своя(r.top + 2) && своя(r.top + r.height / 2) && своя(r.bottom - 2)))
                    плохие.push((ч.textContent || '').trim().slice(0, 14));
            }
            return { чипов: чипы.length, живых: живые.length, высоты: [...new Set(высоты)], плохие };
        });

        expect(з.чипов, 'ПОРОГ: без чипов проверка прошла бы вхолостую').toBeGreaterThan(0);
        expect(з.живых, 'хотя бы один чип должен быть нажимаемым').toBeGreaterThan(0);
        for (const в of з.высоты) {
            expect(ШКАЛА_КНОПОК, 'высота чипа — ступень кнопки, получилось ' + в).toContain(в);
            expect(в, 'цель нажатия по WCAG 2.5.5').toBeGreaterThanOrEqual(44);
        }
        expect(з.плохие,
            'слой 44 на ::after срабатывал у первого и последнего чипа и не ' +
            'срабатывал у средних — поэтому цель задана ВЫСОТОЙ').toEqual([]);
    });

    test('две группы, и в каждой ровно один выбранный', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const группы = [...document.querySelectorAll('.trn-chip-group[role="radiogroup"]')];
            return {
                групп: группы.length,
                подписи: группы.map(г => (г.getAttribute('aria-label') || '').trim()),
                выбрано: группы.map(г => г.querySelectorAll('.trn-chip[aria-checked="true"]').length),
                безРоли: [...document.querySelectorAll('.trn-chip')]
                    .filter(c => c.getAttribute('role') !== 'radio').length,
            };
        });
        expect(з.групп, 'статус и пол — два независимых набора').toBe(2);
        for (const п of з.подписи) expect(п.length, 'у группы есть имя для диктора').toBeGreaterThan(2);
        expect(з.выбрано, 'в ряду горели ДВЕ лаймовые «Все» из одной группы').toEqual([1, 1]);
        expect(з.безРоли, 'каждый чип — переключатель, а не просто кнопка').toBe(0);
    });

    test('нажатие переносит состояние, а не только краску', async ({ page }) => {
        await открыть(page, Я.адрес);
        const был = await page.evaluate(() => {
            const г = document.querySelectorAll('.trn-chip-group')[0];
            const ц = [...г.querySelectorAll('.trn-chip')].filter(c => !c.disabled && c.getAttribute('aria-checked') !== 'true')[0];
            if (!ц) return null;
            ц.setAttribute('data-проба', '1');
            return (ц.textContent || '').trim().slice(0, 14);
        });
        test.skip(был === null, 'в этой базе в первой группе нечего переключать');

        await page.locator('.trn-chip[data-проба="1"]').click();
        await page.waitForTimeout(300);

        const стало = await page.evaluate(() => {
            const г = document.querySelectorAll('.trn-chip-group')[0];
            const ц = г.querySelector('.trn-chip[data-проба="1"]');
            return {
                выбранных: г.querySelectorAll('.trn-chip[aria-checked="true"]').length,
                нашСостояние: ц.getAttribute('aria-checked'),
                нашКласс: ц.classList.contains('active'),
            };
        });
        expect(стало.выбранных, 'в группе всегда ровно один выбор').toBe(1);
        expect(стало.нашСостояние, 'состояние едет вместе с краской').toBe('true');
        expect(стало.нашКласс).toBe(true);
    });

    test('чип, который ничего не найдёт, погашен и не жмётся', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const видно = n => n.getBoundingClientRect().height > 0;
            const чипы = [...document.querySelectorAll('.trn-chip')].filter(видно);
            return чипы.map(ч => {
                const сч = ч.querySelector('.trn-chip-count');
                return {
                    текст: (ч.textContent || '').trim().slice(0, 14),
                    значение: ч.dataset.value,
                    число: сч ? (сч.textContent || '').trim() : null,
                    погашен: !!ч.disabled,
                    события: getComputedStyle(ч).pointerEvents,
                };
            });
        });
        for (const ч of з) {
            if (ч.значение === 'all' || ч.число === null) continue;
            if (ч.число === '') {
                expect(ч.погашен, 'ноль прятался в пустую строку: «' + ч.текст +
                    '» без числа не отличить от «числа не знаем»').toBe(true);
                expect(ч.события, 'погашенный чип не принимает нажатие').toBe('none');
            } else {
                expect(ч.погашен, 'чип с числом остаётся живым').toBe(false);
            }
        }
    });

    test('кегль и межстрочный чипа — ступени, и одни на весь ряд', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const окр = v => Math.round(parseFloat(v) * 100) / 100;
            const видно = n => n.getBoundingClientRect().height > 0;
            const чипы = [...document.querySelectorAll('.trn-chip')].filter(видно);
            return {
                кегли: [...new Set(чипы.map(c => окр(getComputedStyle(c).fontSize)))],
                отношения: [...new Set(чипы.map(c => {
                    const s = getComputedStyle(c);
                    return окр(parseFloat(s.lineHeight) / parseFloat(s.fontSize));
                }))],
                normal: чипы.filter(c => getComputedStyle(c).lineHeight === 'normal').length,
            };
        });
        expect(з.кегли.length, 'один кегль на весь ряд: было 12 и 14 при одной роли').toBe(1);
        expect(з.normal, '`normal` считается от шрифта — у разных людей своё число').toBe(0);
        for (const о of з.отношения)
            expect(СТУПЕНИ_МЕЖСТР, 'межстрочный на ступени, получилось ' + о).toContain(о);
    });

    test('левый край ленты совпадает с краем заголовка раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const видно = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
            const первый = document.querySelector('.trn-filters-inner > *');
            const голова = [...document.querySelectorAll('.trn-block-head')].filter(видно)[0];
            if (!первый || !голова) return null;
            return {
                лента: Math.round(первый.getBoundingClientRect().left),
                заголовок: Math.round(голова.getBoundingClientRect().left),
            };
        });
        test.skip(з === null, 'на экране нет блока с заголовком — сравнивать не с чем');
        expect(Math.abs(з.лента - з.заголовок),
            'лента считала отступ --gutter, а содержимое --pad-x: на 1512 ' +
            'расходились на 32 — ' + з.лента + ' против ' + з.заголовок).toBeLessThanOrEqual(1);
    });

    test('на низком горизонтальном лента не липнет', async ({ page }) => {
        const { width, height } = page.viewportSize();
        test.skip(!(height <= 500 && width >= height), 'вид не низкий горизонтальный');
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const л = document.querySelector('.trn-filters');
            return { положение: getComputedStyle(л).position,
                     доля: Math.round(л.getBoundingClientRect().height / window.innerHeight * 100) };
        });
        expect(з.положение, 'липкая полоса занимала 156 при экране 390 — сорок процентов')
            .toBe('static');
        expect(з.доля, 'полоса не съедает больше трети низкого экрана').toBeLessThan(34);
    });

    test('карточки категории одного роста', async ({ page }) => {
        await открыть(page, Я.адрес);
        await page.waitForTimeout(1500);
        const з = await page.evaluate(() => {
            const видно = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
            const пп = [...document.querySelectorAll('.to-compact')].filter(видно);
            const в = пп.map(n => Math.round(n.getBoundingClientRect().height));
            return { полос: пп.length, высоты: [...new Set(в)],
                     разброс: в.length ? Math.max(...в) - Math.min(...в) : null,
                     ширинаНазвания: [...new Set(пп.map(n => {
                         const i = n.querySelector('.to-compact-info');
                         return i ? Math.round(i.getBoundingClientRect().width) : 0; }))] };
        });
        test.skip(з.полос < 2, 'в этой базе меньше двух карточек — сравнивать нечего');
        expect(з.разброс,
            'высота была функцией от того, что заполнено: 202 против 94 в одной ' +
            'категории. Получилось ' + з.высоты.join('/')).toBe(0);
        for (const ш of з.ширинаНазвания)
            expect(ш, 'колонка названия сжималась до 39 из 341, и имя вставало лапшой')
                .toBeGreaterThan(100);
    });

    test('перелива вбок нет', async ({ page }) => {
        await открыть(page, Я.адрес);
        const п = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(п).toBe(0);
    });

    /* ФИЛЬТР ОСТАВЛЯЛ ДЫРЫ — 06.10. Заморозка видит код, но не видит, что
       вышло на экране: прятали карточку, а ячейка сетки оставалась. */
    test('фильтр пола не оставляет пустых ячеек', async ({ page }) => {
        await открыть(page, Я.адрес);
        const чип = page.locator('.trn-chip[data-filter="gender"][data-value="men"]');
        const есть = await чип.count() > 0 && await чип.isVisible();
        expect(есть, 'ПОРОГ: у masters полоса пола обязана быть — там есть и те, и другие')
            .toBe(true);
        await чип.click();
        await page.waitForTimeout(400);
        const r = await page.evaluate(() => {
            const вид = э => э.offsetParent !== null && э.getBoundingClientRect().height > 0;
            const сетки = ['liveGrid', 'tournamentsGrid', 'pastTournamentsGrid']
                .map(id => document.getElementById(id)).filter(Boolean);
            let ячеек = 0, пустых = 0, карточек = 0;
            сетки.forEach(g => [...g.children].filter(вид).forEach(ч => {
                ячеек++;
                const к = [...ч.querySelectorAll('.to-featured, .to-featured-side, .to-compact')].filter(вид).length;
                карточек += к;
                if (к === 0) пустых++;
            }));
            return { ячеек, пустых, карточек };
        });
        expect(r.ячеек, 'ПОРОГ: после фильтра на экране не осталось ячеек').toBeGreaterThan(0);
        expect(r.пустых, 'пустых ячеек в сетке: ' + r.пустых +
            '. Фильтр снова прячет карточку и оставляет слот').toBe(0);
        expect(r.карточек, 'карточек меньше, чем ячеек — ячейка без карточки это дыра')
            .toBe(r.ячеек);
    });

    /* КАРТА КАТЕГОРИЙ — ЭТО ДАННЫЕ, И ЗАМОРОЗКА ИХ НЕ ВИДИТ. */
    test('в мужских категориях полосы пола нет, и выбран «Все»', async ({ page }) => {
        const адрес = Я.адрес.replace('category=masters', 'category=challenger');
        await открыть(page, адрес);
        const r = await page.evaluate(() => {
            const чипы = [...document.querySelectorAll('.trn-chip[data-filter="gender"]')];
            const группа = чипы.length ? чипы[0].parentElement : null;
            const акт = чипы.find(c => c.classList.contains('active'));
            const полы = {};
            document.querySelectorAll('.to-featured, .to-featured-side, .to-compact')
                .forEach(к => { const г = к.dataset.gender || '—'; полы[г] = (полы[г] || 0) + 1; });
            return { видна: !!(группа && группа.offsetParent !== null),
                     активный: акт ? акт.dataset.value : null, полы,
                     карточек: document.querySelectorAll('.to-featured, .to-featured-side, .to-compact').length };
        });
        expect(r.карточек, 'ПОРОГ: в Challengers нет карточек — мерить нечего').toBeGreaterThan(0);
        expect(r.видна, 'полоса пола стоит там, где женских турниров не бывает: ' +
            'чип обещает пустой экран').toBe(false);
        expect(r.активный, 'после скрытия полосы выбранным обязан остаться «Все»').toBe('all');
        expect(r.полы.women || 0, 'в Challengers нашлись женские турниры — ' +
            'тогда карту категорий в KSLT_RULES надо менять, а не полосу').toBe(0);
    });

});

}
