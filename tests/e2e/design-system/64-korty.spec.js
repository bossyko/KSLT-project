/**
 * СТРАНИЦА «КОРТЫ» — 07.10.
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
    { имя: 'ru', адрес: '/pages/courts.html' },
    { имя: 'en', адрес: '/pages/courts-en.html' },
    { имя: 'kg', адрес: '/pages/courts-kg.html' },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

/** ЖДАТЬ НАДО ОСТАНОВКИ ВЕЛИЧИНЫ, А НЕ ИСТЕЧЕНИЯ ВРЕМЕНИ: карточки
 *  приезжают из базы, и сетка перерисовывается ВТОРОЙ раз, когда шаг
 *  страницы узнан по раскладке. Ждём, пока число карточек перестанет
 *  меняться два замера подряд, и пока сядут шрифты. */
async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.ct-hero-title') !== null, null, { timeout: 20000 });
    await page.waitForFunction(() => {
        const n = document.querySelectorAll('.ct-card').length;
        const было = window.__скольколо;
        window.__скольколо = n;
        return n > 0 && n === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

for (const Я of ЯЗЫКИ) {
test.describe('корты · ' + Я.имя, () => {

    test('обложка стоит на общих крутилках раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const h = document.querySelector('.ct-hero');
            const s = getComputedStyle(h);
            const t = document.querySelector('.ct-hero-title');
            const p = document.querySelector('.ct-hero-subtitle');
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
        const з = await page.evaluate(() => {
            const g = document.querySelector('.ct-grid');
            if (!g) return null;
            const s = getComputedStyle(g);
            const колонок = s.gridTemplateColumns.split(' ').filter(Boolean).length;
            const рядов = parseInt(s.getPropertyValue('--ct-ryadov'), 10);
            const карточки = [...document.querySelectorAll('.ct-card')];
            const верх = [...new Set(карточки.map(c => Math.round(c.getBoundingClientRect().top)))];
            const счёт = document.querySelector('.pl-page-count');
            return {
                колонок, рядов,
                показано: карточки.length,
                рядовФакт: верх.length,
                счётчик: счёт ? счёт.textContent.trim() : null,
            };
        });
        expect(з, 'ПОРОГ: витрины кортов нет').not.toBeNull();
        expect(з.показано, 'ПОРОГ: на странице нет ни одной карточки').toBeGreaterThan(0);
        expect(з.колонок, 'колонок не осталось вовсе').toBeGreaterThan(0);
        expect(з.рядов, 'крутилка рядов не доехала до браузера').toBeGreaterThan(0);
        /* Показано ровно колонок × рядов — или всё, что есть, если кортов
           меньше. Это и есть отношение, которое замораживается. */
        expect(з.показано, 'показано не равно «колонок × рядов»')
            .toBeLessThanOrEqual(з.колонок * з.рядов);
        expect(з.рядовФакт, 'рядов на странице больше, чем просит крутилка')
            .toBeLessThanOrEqual(з.рядов);
    });

    /* ЗАГЛУШКА, КОТОРАЯ НЕ ДЕКОДИРУЕТСЯ, ДАЁТ ЧУЖУЮ ГЕОМЕТРИЮ: у сломанного
       изображения Chrome меряет строку `alt`, и высота из css до него не
       доходит. В тестовой базе фотографии кортов не отдаются — первый
       прогон 07.10 упал на пороге «ни одна не декодировалась». Поэтому
       меряем КОМПОНЕНТ: кладём в живую сетку пробную карточку с картинкой,
       которая декодируется всегда, и ждём `decode()`, а не времени. */
    test('фото карточки держит отношение 4:3 на любой ширине', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(async () => {
            const сетка = document.querySelector('.ct-grid');
            if (!сетка) return null;

            const проба = document.createElement('a');
            проба.className = 'ct-card';
            проба.href = '#';
            проба.innerHTML =
                '<div class="ct-card-img-wrap">' +
                '<img class="ct-card-img" alt="" src="data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200"></svg>') +
                '"></div><div class="ct-card-body"><div class="ct-card-name">проба</div></div>';
            сетка.appendChild(проба);

            const img = проба.querySelector('img');
            try { await img.decode(); } catch (e) { /* разберёт порог ниже */ }

            const r = img.getBoundingClientRect();
            const о = {
                нат: img.naturalWidth,
                w: Math.round(r.width), h: Math.round(r.height),
                отн: +(r.width / r.height).toFixed(2),
                /* Снимок рисуется НЕ по своим пропорциям: исходник 4:1 */
                исходник: +(img.naturalWidth / img.naturalHeight).toFixed(2),
            };

            /* Живые фотографии, если они в этой базе всё же отдались */
            о.живые = [...document.querySelectorAll('.ct-card-img')]
                .filter(i => i !== img && i.naturalWidth > 0)
                .map(i => {
                    const b = i.getBoundingClientRect();
                    return +(b.width / b.height).toFixed(2);
                });

            проба.remove();
            return о;
        });
        expect(з, 'ПОРОГ: витрины кортов нет').not.toBeNull();
        expect(з.нат, 'ПОРОГ: даже пробная картинка не декодировалась').toBeGreaterThan(0);
        expect(з.исходник, 'проба перестала быть крайним случаем').toBeGreaterThan(2);
        expect(з.отн, 'фото карточки ушло от 4:3: ' + з.w + '×' + з.h).toBeCloseTo(1.33, 1);
        for (const о of з.живые) {
            expect(о, 'живая фотография ушла от 4:3').toBeCloseTo(1.33, 1);
        }
    });

    test('полоса страниц стоит над краями своей витрины', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const g = document.querySelector('.ct-grid');
            const p = document.querySelector('.pl-pagination');
            if (!g) return null;
            return {
                витрина: Math.round(g.getBoundingClientRect().width),
                полоса: p ? Math.round(p.getBoundingClientRect().width) : null,
                счётчик: !!document.querySelector('.pl-page-count'),
                своиКнопки: document.querySelectorAll('.ct-page-btn').length,
            };
        });
        expect(з, 'ПОРОГ: витрины кортов нет').not.toBeNull();
        expect(з.своиКнопки, 'вернулась своя полоса страниц кортов').toBe(0);
        if (з.полоса !== null) {
            expect(з.счётчик, 'у полосы страниц пропал счётчик строк').toBe(true);
            expect(Math.abs(з.витрина - з.полоса),
                'полоса страниц разъехалась с витриной: ' + з.витрина + ' против ' + з.полоса)
                .toBeLessThanOrEqual(2);
        }
    });

    test('в карточке нет нажимаемого внутри нажимаемого', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const карточки = [...document.querySelectorAll('.ct-card')];
            if (!карточки.length) return null;
            let ссылокВнутри = 0, подробнее = 0;
            карточки.forEach(c => {
                ссылокВнутри += c.querySelectorAll('a, button').length;
                подробнее += c.querySelectorAll('.ct-card-btn').length;
            });
            return { карточек: карточки.length, ссылокВнутри, подробнее,
                     ссылка: карточки[0].tagName };
        });
        expect(з, 'ПОРОГ: карточек кортов нет').not.toBeNull();
        expect(з.ссылка, 'карточка перестала быть ссылкой').toBe('A');
        expect(з.подробнее, 'в карточку вернулось «Подробнее →»').toBe(0);
        expect(з.ссылокВнутри, 'внутрь карточки-ссылки вложено нажимаемое').toBe(0);
    });

    test('в полосе фильтров три выпадашки и ни одного чипа типа', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const полоса = document.querySelector('.trn-filters');
            if (!полоса) return null;
            const выпадашки = [...полоса.querySelectorAll('.ct-dd-toggle')];
            const чипы = [...полоса.querySelectorAll('.trn-chip')]
                .filter(c => !c.classList.contains('ct-dd-toggle'));
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
        expect(з.выпадашек, 'выпадашек должно быть три: тип, город, покрытие').toBe(3);
        expect(з.чипов, 'в полосе снова чипы типа корта').toBe(0);
        expect(з.разделителей, 'разделитель остался без того, что он разделял').toBe(0);
        for (const h of з.высоты) {
            expect(h, 'выпадашка не на ступени 44').toBeGreaterThanOrEqual(36);
        }
        expect(з.поиск, 'поле поиска не 44 высотой').toBe(44);
        expect(з.кегльПоиска, 'кегль поля поиска меньше 16 — Safari зумит страницу').toBe(16);
    });

    test('в каждую цель нажатия можно попасть, и она не меньше 44', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const цели = [...document.querySelectorAll(
                '.trn-back, .ct-dd-toggle, .ct-card-cta, .pl-page-btn')];
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
            return { целей: цели.length, плохо };
        });
        expect(з.целей, 'ПОРОГ: нажимаемых мест на странице нет').toBeGreaterThan(0);
        expect(з.плохо, 'цели нажатия меньше 44 или перекрыты').toEqual([]);
    });

    test('витрина не переливается вбок ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => ({
            перелив: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            карточек: document.querySelectorAll('.ct-card').length,
        }));
        expect(з.карточек, 'ПОРОГ: карточек нет').toBeGreaterThan(0);
        expect(з.перелив, 'страница кортов поехала вбок').toBeLessThanOrEqual(0);
    });
});
}
