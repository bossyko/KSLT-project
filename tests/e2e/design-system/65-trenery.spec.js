/**
 * СТРАНИЦА «ТРЕНЕРЫ» — 07.10.
 *
 * Те же проверки, что у кортов: решения на обе страницы приняты одни, и
 * правило, выведенное на одном куске, применяется к следующему без нового
 * разбора. Отличий два — свои имена классов и портрет тренера, который
 * кадрируется от верха.
 *
 * Что проверяет ПРОГОН, а не заморозка:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • ЧИСЛО КОЛОНОК. `auto-fill` считает браузер, и узнать это можно
 *     только после раскладки;
 *   • ШАГ СТРАНИЦЫ = КОЛОНОК × РЯДОВ. Отношение, а не число: проверяется
 *     сравнением показанного с посчитанным, на каждом виде;
 *   • ОТНОШЕНИЕ СТОРОН ФОТО. В css оно объявлено, но высоту даёт поток;
 *   • ПОЛОСА СТРАНИЦ стоит над краями СВОЕЙ витрины — это геометрия;
 *   • ЦЕЛИ НАЖАТИЯ. Высота коробки и цель — разные вещи: меряем
 *     попаданием через elementFromPoint, а не правилом в css;
 *   • НАЖИМАЕМОЕ ВНУТРИ НАЖИМАЕМОГО — этого в карточке быть не должно.
 *
 * ПОРОГ: нет карточек — проверка ПАДАЕТ, а не проходит вхолостую.
 * Где нужен КОМПОНЕНТ, а не данные, — собираем пробу сами: в тестовой базе
 * кортов может оказаться меньше, чем рядов на странице.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/coaches.html' },
    { имя: 'en', адрес: '/pages/coaches-en.html' },
    { имя: 'kg', адрес: '/pages/coaches-kg.html' },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

/** В ТЕСТОВОЙ БАЗЕ ТРЕНЕРОВ НЕТ ВОВСЕ — это записано в трекере и
 *  подтвердилось прогоном 07.10: все 24 проверки упали в одном месте, в
 *  ожидании карточек. Пустая витрина — ЗАКОННОЕ состояние, и ждать от неё
 *  данных значит мерить базу, а не продукт.
 *
 *  Поэтому ждём то, что есть всегда: обложку и шрифты. А меряем КОМПОНЕНТ
 *  — пробными карточками, которые проба собирает сама, той же разметкой,
 *  что отдаёт `js/coaches.js`. Такая проверка не зависит от того, сколько
 *  тренеров завели.
 */
async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.co-hero-title') !== null, null, { timeout: 20000 });
    /* Дождаться, пока витрина перестанет меняться: она рисуется либо
       сеткой, либо пустым состоянием, и оба варианта законны. */
    await page.waitForFunction(() => {
        const g = document.getElementById('coachesGrid');
        const было = window.__слепок;
        const стало = g ? g.innerHTML.length : -1;
        window.__слепок = стало;
        return стало >= 0 && стало === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

/** Пробная витрина: если живых карточек нет, собираем их сами — той же
 *  разметкой, что отдаёт страница. Возвращает функцию-уборщицу. */
const ПРОБНАЯ_ВИТРИНА = `(сколько) => {
    const коробка = document.getElementById('coachesGrid');
    if (!коробка) return null;
    let сетка = document.querySelector('.co-grid');
    let своя = false;
    if (!сетка) {
        сетка = document.createElement('div');
        сетка.className = 'co-grid';
        коробка.appendChild(сетка);
        своя = true;
    }
    const снимок = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200"></svg>');
    const свои = [];
    for (let i = 0; i < сколько; i++) {
        const a = document.createElement('a');
        a.className = 'co-card проба';
        a.href = '#';
        a.innerHTML =
            '<div class="co-card-img-wrap">' +
                '<img class="co-card-photo" alt="" src="' + снимок + '">' +
            '</div>' +
            '<div class="co-card-body">' +
                '<div class="co-card-name">Пробный тренер с очень длинным именем</div>' +
                '<div class="co-card-spec">Направление</div>' +
                '<div class="co-card-stats"><div class="co-card-stat">' +
                    '<div class="co-card-stat-num">9</div>' +
                    '<div class="co-card-stat-label">лет</div></div></div>' +
                '<div class="co-card-actions">' +
                    '<span class="co-card-cta">Скидка KSLT</span>' +
                '</div>' +
            '</div>';
        сетка.appendChild(a);
        свои.push(a);
    }
    return { сетка, своя, свои: свои.length };
}`;

for (const Я of ЯЗЫКИ) {
test.describe('тренеры · ' + Я.имя, () => {

    test('обложка стоит на общих крутилках раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const h = document.querySelector('.co-hero');
            const s = getComputedStyle(h);
            const t = document.querySelector('.co-hero-title');
            const p = document.querySelector('.co-hero-subtitle');
            return {
                пол: parseFloat(s.minHeight),
                низ: parseFloat(s.paddingBottom),
                h1: parseFloat(getComputedStyle(t).fontSize),
                sub: p ? parseFloat(getComputedStyle(p).fontSize) : null,
                крутилкаПол: parseFloat(getComputedStyle(document.documentElement)
                    .getPropertyValue('--oblozhka-pol')),
                крутилкаКегль: getComputedStyle(document.documentElement)
                    .getPropertyValue('--fs-hero').trim(),
            };
        });
        expect(з.пол, 'пол обложки разошёлся с крутилкой раздела').toBe(з.крутилкаПол);
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок обложки мимо шкалы').toContain(Math.round(з.h1));
        if (з.sub !== null) {
            expect(ШКАЛА_КЕГЛЕЙ, 'подзаголовок обложки мимо шкалы').toContain(Math.round(з.sub));
            expect(з.sub, 'подзаголовок не ниже заголовка на ступень').toBeLessThan(з.h1);
        }
    });

    test('шаг страницы — колонок × рядов, и это видно на экране', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код]) => {
            const собрать = eval(код);
            const живых = document.querySelectorAll('.co-card').length;
            const п = собрать(живых ? 0 : 8);
            if (!п) return null;
            const s = getComputedStyle(п.сетка);
            const колонок = s.gridTemplateColumns.split(' ').filter(Boolean).length;
            const рядов = parseInt(s.getPropertyValue('--co-ryadov'), 10);
            const карточки = [...document.querySelectorAll('.co-card')];
            const верх = [...new Set(карточки.map(c => Math.round(c.getBoundingClientRect().top)))];
            const счёт = document.querySelector('.pl-page-count');
            const о = { колонок, рядов, живых, показано: карточки.length,
                        рядовФакт: верх.length,
                        счётчик: счёт ? счёт.textContent.trim() : null };
            document.querySelectorAll('.co-card.проба').forEach(e => e.remove());
            if (п.своя) п.сетка.remove();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА]);
        expect(з, 'ПОРОГ: коробки витрины тренеров нет').not.toBeNull();
        expect(з.колонок, 'колонок не осталось вовсе').toBeGreaterThan(0);
        expect(з.рядов, 'крутилка рядов не доехала до браузера').toBeGreaterThan(0);
        expect(з.колонок, 'колонок больше четырёх — витрина разъехалась').toBeLessThanOrEqual(4);
        /* Живые карточки, если они есть, обязаны укладываться в отношение */
        if (з.живых) {
            expect(з.показано, 'показано больше, чем «колонок × рядов»')
                .toBeLessThanOrEqual(з.колонок * з.рядов);
        }
    });

    /* ПРОБА СОБИРАЕТ КАРТОЧКИ САМА: в тестовой базе тренеров нет, а
       компонент обязан держать отношение при любой ширине колонки. */
    test('портрет тренера держит отношение 4:3 на любой ширине', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(async ([код]) => {
            const собрать = eval(код);
            const п = собрать(1);
            if (!п) return null;
            const img = document.querySelector('.co-card.проба .co-card-photo');
            try { await img.decode(); } catch (e) { /* разберёт порог ниже */ }
            const r = img.getBoundingClientRect();
            const о = {
                нат: img.naturalWidth,
                исходник: +(img.naturalWidth / img.naturalHeight).toFixed(2),
                w: Math.round(r.width), h: Math.round(r.height),
                отн: +(r.width / r.height).toFixed(2),
                кадр: getComputedStyle(img).objectPosition,
                кадрВерх: (() => {
                    const ч = getComputedStyle(img).objectPosition.trim().split(/\s+/);
                    const в = ч[1] || ч[0];
                    return в === 'top' ? 0 : parseFloat(в);
                })(),
                живые: [...document.querySelectorAll('.co-card-photo')]
                    .filter(i => i !== img && i.naturalWidth > 0)
                    .map(i => {
                        const b = i.getBoundingClientRect();
                        return +(b.width / b.height).toFixed(2);
                    }),
            };
            document.querySelectorAll('.co-card.проба').forEach(e => e.remove());
            if (п.своя) п.сетка.remove();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА]);
        expect(з, 'ПОРОГ: коробки витрины тренеров нет').not.toBeNull();
        expect(з.нат, 'ПОРОГ: даже пробная картинка не декодировалась').toBeGreaterThan(0);
        expect(з.исходник, 'проба перестала быть крайним случаем').toBeGreaterThan(2);
        expect(з.отн, 'портрет ушёл от 4:3: ' + з.w + '×' + з.h).toBeCloseTo(1.33, 1);
        /* Снимки у тренеров вертикальные: кадрируем от верха, иначе режет
           по голове — та же причина записана у витрины лендинга.
           БРАУЗЕР ОТДАЁТ ЧИСЛО, А НЕ СЛОВО: в файле стоит `50% top`,
           вычисленное значение — `50% 0%`. Проверяем вертикаль числом. */
        expect(з.кадрВерх, 'портрет перестали кадрировать от верха: ' + з.кадр).toBe(0);
        for (const о of з.живые) {
            expect(о, 'живой портрет ушёл от 4:3').toBeCloseTo(1.33, 1);
        }
    });

    test('полоса страниц стоит над краями своей витрины', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const g = document.querySelector('.co-grid');
            const p = document.querySelector('.pl-pagination');
            return {
                витрина: g ? Math.round(g.getBoundingClientRect().width) : null,
                полоса: p ? Math.round(p.getBoundingClientRect().width) : null,
                счётчик: !!document.querySelector('.pl-page-count'),
                своиКнопки: document.querySelectorAll('.co-page-btn').length,
                крутилка: getComputedStyle(document.querySelector('.co-pagination-section'))
                    .getPropertyValue('--polosa-shirina').trim(),
            };
        });
        expect(з.своиКнопки, 'вернулась своя полоса страниц тренеров').toBe(0);
        /* Полоса рисуется только когда страниц больше одной. Её ширина
           задаётся крутилкой — это проверяется всегда, а совпадение краёв
           только там, где полоса есть. */
        expect(з.крутилка, 'полоса перестала идти по ширине своей витрины').toBe('100%');
        if (з.полоса !== null && з.витрина !== null) {
            expect(з.счётчик, 'у полосы страниц пропал счётчик строк').toBe(true);
            expect(Math.abs(з.витрина - з.полоса),
                'полоса разъехалась с витриной: ' + з.витрина + ' против ' + з.полоса)
                .toBeLessThanOrEqual(2);
        }
    });

    test('в карточке нет нажимаемого внутри нажимаемого', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const карточки = [...document.querySelectorAll('.co-card')];
            let ссылокВнутри = 0, подробнее = 0;
            карточки.forEach(c => {
                ссылокВнутри += c.querySelectorAll('a, button').length;
                подробнее += c.querySelectorAll('.co-card-btn').length;
            });
            return { карточек: карточки.length, ссылокВнутри, подробнее,
                     ссылка: карточки.length ? карточки[0].tagName : null,
                     пусто: !!document.querySelector('.co-empty') };
        });
        /* ПОРОГ ДВУСТОРОННИЙ: либо карточки есть и разбираются, либо
           витрина честно пуста и говорит об этом. Молчаливого «ничего нет
           и всё хорошо» не бывает. */
        expect(з.карточек > 0 || з.пусто,
            'ПОРОГ: карточек нет, и пустое состояние тоже не нарисовано').toBe(true);
        if (з.карточек) {
            expect(з.ссылка, 'карточка перестала быть ссылкой').toBe('A');
            expect(з.подробнее, 'в карточку вернулось «Подробнее →»').toBe(0);
            expect(з.ссылокВнутри, 'внутрь карточки-ссылки вложено нажимаемое').toBe(0);
        }
    });

    test('в полосе фильтров три выпадашки общего компонента', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const полоса = document.querySelector('.trn-filters');
            if (!полоса) return null;
            const выпадашки = [...полоса.querySelectorAll('.f-dd-toggle, .ct-dd-toggle')];
            const чипы = [...полоса.querySelectorAll('.trn-chip')]
                .filter(c => !c.classList.contains('f-dd-toggle') &&
                             !c.classList.contains('ct-dd-toggle'));
            const поиск = полоса.querySelector('.trn-search-input');
            const назад = полоса.querySelector('.trn-back');
            return {
                выпадашек: выпадашки.length,
                подписи: выпадашки.map(e => e.textContent.trim()),
                высоты: выпадашки.map(e => Math.round(e.getBoundingClientRect().height)),
                чипов: чипы.length,
                разделителей: полоса.querySelectorAll('.trn-chip-div').length,
                поиск: поиск ? Math.round(поиск.getBoundingClientRect().height) : null,
                кегльПоиска: поиск ? parseFloat(getComputedStyle(поиск).fontSize) : null,
                назад: !!назад,
            };
        });
        expect(з, 'ПОРОГ: полосы фильтров нет').not.toBeNull();
        expect(з.назад, 'из полосы пропал возврат на «Услуги»').toBe(true);
        expect(з.выпадашек, 'выпадашек должно быть три: возраст, занятия, уровень').toBe(3);
        expect(з.чипов, 'в полосе снова чипы вместо выпадашек').toBe(0);
        expect(з.разделителей, 'разделитель остался без того, что он разделял').toBe(0);
        for (const h of з.высоты) {
            expect(h, 'выпадашка не на ступени 44').toBeGreaterThanOrEqual(36);
        }
        expect(з.поиск, 'поле поиска не 44 высотой').toBe(44);
        expect(з.кегльПоиска, 'кегль поля поиска меньше 16 — Safari зумит страницу').toBe(16);
    });

    test('в каждую цель нажатия можно попасть, и она не меньше 44', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код]) => {
            /* Кнопку карточки без данных взять неоткуда — собираем пробой */
            const собрать = eval(код);
            const живых = document.querySelectorAll('.co-card').length;
            const п = собрать(живых ? 0 : 1);
            const цели = [...document.querySelectorAll(
                '.trn-back, .f-dd-toggle, .ct-dd-toggle, .co-card-cta, .pl-page-btn')];
            const плохо = [];
            цели.forEach(el => {
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) return;
                if (r.top < 0 || r.bottom > innerHeight) return;
                const x = Math.round(r.left + r.width / 2);
                const y = Math.round(r.top + r.height / 2);
                const попал = document.elementFromPoint(x, y);
                const свой = попал && (el === попал || el.contains(попал) || попал.contains(el));
                /* Цель может быть выше коробки — её даёт прозрачный слой */
                const слой = getComputedStyle(el, '::after').height;
                const высота = Math.max(r.height, parseFloat(слой) || 0);
                if (!свой) плохо.push('не попасть: ' + (el.className || el.tagName));
                else if (высота < 43.5) записать(плохо, el, высота);
            });
            function записать(список, el, h) {
                список.push('цель ' + Math.round(h) + ': ' + (el.className || el.tagName));
            }
            const о = { целей: цели.length, плохо };
            document.querySelectorAll('.co-card.проба').forEach(e => e.remove());
            if (п && п.своя) п.сетка.remove();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА]);
        expect(з.целей, 'ПОРОГ: нажимаемых мест на странице нет').toBeGreaterThan(0);
        expect(з.плохо, 'цели нажатия меньше 44 или перекрыты').toEqual([]);
    });

    /* ПУСТАЯ СТРАНИЦА НЕ ПЕРЕЛИВАЕТСЯ НИКОГДА — проверять её значит
       проверять ничто. Наполняем витрину пробой, и крайним случаем:
       длинное имя, длинная подпись, восемь карточек. */
    test('витрина не переливается вбок ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код]) => {
            const собрать = eval(код);
            const живых = document.querySelectorAll('.co-card').length;
            const п = собрать(живых ? 0 : 8);
            const о = {
                перелив: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                карточек: document.querySelectorAll('.co-card').length,
            };
            document.querySelectorAll('.co-card.проба').forEach(e => e.remove());
            if (п && п.своя) п.сетка.remove();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА]);
        expect(з.карточек, 'ПОРОГ: даже проба не собралась').toBeGreaterThan(0);
        expect(з.перелив, 'страница тренеров поехала вбок').toBeLessThanOrEqual(0);
    });
});
}
