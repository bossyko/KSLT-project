/**
 * БЛОК «СТАНЬТЕ СПОНСОРОМ КСЛТ» `.sp-offer` НА ГЛАВНОЙ — доска 437:9,
 * решения Кости 24.09.
 *
 * Что проверяется и почему именно так:
 *
 *  · ЧИСЛО ТИШЕ ЗАГОЛОВКА. До 24.09 на всех пяти видах число было крупнее
 *    заголовка блока и РАВНО заголовку раздела: первым в блоке про
 *    спонсорство читалась цифра 350. Тест меряет ОТНОШЕНИЕ, а не кегли.
 *  · ВСТУПЛЕНИЕ НЕ МЕЛЬЧЕ СПИСКА. На 768 и 390 оно стояло в 12 при списке
 *    в 14 — первая фраза блока была самым мелким текстом в нём.
 *  · ОДИН ЛЕВЫЙ КРАЙ. Коробка стояла в 1100 при контейнере 1400, и её
 *    содержимое начиналось на 125 пикселе против 28 у соседей.
 *  · КНОПКА 44 И КОЛЬЦО. Было 40 на узких видах и ни одного :focus-visible.
 *    Кольцо проверяется НАСТОЯЩИМ нажатием Tab, а не чтением css.
 *  · СТРОКА НЕ КОРОЧЕ РАЗУМНОГО. Список на 390 стоял в две колонки по 156:
 *    19 знаков в строке, три строки на пункт.
 *  · ТРИ ЯЗЫКА. Блока не было ни на английской главной, ни на кыргызской.
 *  · ЧИСЛО ИЗ БАЗЫ. «120+ рейтинговых» заменено живым счётом завершённых.
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
    await page.waitForSelector('.sp-offer .sp-nums', { timeout: 15000 });
    await page.evaluate(() => {
        const с = document.querySelector('.sp-offer-wrap');
        if (с) с.scrollIntoView({ block: 'start' });
    });
    /* Третье число приходит из базы. Ждём признак — что прочерк сменился
       цифрой, — а не таймер. Если база молчит, тест про число это скажет. */
    await page.waitForFunction(() => {
        const э = document.querySelector('[data-stat="statTournaments"]');
        return э && /\d/.test(э.textContent);
    }, null, { timeout: 8000 }).catch(() => {});
}

const снимок = page => page.evaluate(() => {
    const сек = document.querySelector('.sp-offer-wrap');
    if (!сек) return null;
    const R = э => { const r = э.getBoundingClientRect();
        return { л: Math.round(r.left), п: Math.round(r.right), в: Math.round(r.top),
                 н: Math.round(r.bottom), ш: Math.round(r.width), вы: Math.round(r.height) }; };
    const кегль = э => э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;
    const вес = э => э ? Number(getComputedStyle(э).fontWeight) : null;

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

    const коробка = сек.querySelector('.sp-offer');
    const h2 = сек.querySelector('.sp-offer h2');
    const лид = сек.querySelector('.sp-offer-lead');
    const знач = [...сек.querySelectorAll('.sp-num-val')];
    const подп = [...сек.querySelectorAll('.sp-num-cap')];
    const пункты = [...сек.querySelectorAll('.sp-gives li')];
    const кнопка = сек.querySelector('.sp-cta-btn');

    /* Заголовок СОСЕДНЕГО раздела на той же странице: пара «этот заголовок и
       заголовок раздела» обязана звучать одинаково на каждом виде. */
    const сосед = [...document.querySelectorAll('.section-header h2')]
        .find(э => э.getClientRects().length) || document.querySelector('.section-header h2');

    const строкаЗнаков = э => {
        const s = getComputedStyle(э);
        const ш = э.getBoundingClientRect().width - parseFloat(s.paddingLeft || 0);
        return Math.round(ш / (parseFloat(s.fontSize) * 0.5));
    };
    const строк = э => Math.round(э.getBoundingClientRect().height / parseFloat(getComputedStyle(э).lineHeight));

    return {
        экран: { ш: window.innerWidth, вы: window.innerHeight },
        секция: R(сек), коробка: R(коробка),
        заголовок: { к: кегль(h2), в: вес(h2), тег: h2 ? h2.tagName.toLowerCase() : null },
        соседний: { к: кегль(сосед), в: вес(сосед) },
        лид: { к: кегль(лид), строк: лид ? строк(лид) : null },
        число: { к: кегль(знач[0]), в: вес(знач[0]), сколько: знач.length,
                 тексты: знач.map(э => э.textContent.trim()) },
        подпись: { к: кегль(подп[0]), сколько: подп.length, контраст: контраст(подп[0]) },
        пункт: { к: кегль(пункты[0]), сколько: пункты.length, контраст: контраст(пункты[0]),
                 знаков: строкаЗнаков(пункты[0]), строк: строк(пункты[0]) },
        кнопка: { ...R(кнопка), к: кегль(кнопка), адрес: кнопка.getAttribute('href'),
                  тег: кнопка.tagName.toLowerCase() },
        ссылок: сек.querySelectorAll('a').length,
        список: { ul: !!сек.querySelector('ul.sp-gives'), li: пункты.length },
        заголовки: [...сек.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(э => э.tagName.toLowerCase()),
        изБазы: (() => { const э = сек.querySelector('[data-stat="statTournaments"]');
            return э ? э.textContent.trim() : null; })(),
        вШапке: (() => { const э = document.getElementById('statTournaments');
            return э ? э.textContent.trim() : null; })(),
        эмодзи: /[\u{1F000}-\u{1FAFF}]/u.test(сек.textContent),
        горПрокрутка: document.documentElement.scrollWidth > window.innerWidth + 1
    };
});

СТРАНИЦЫ.forEach(({ имя, адрес }) => {
    test.describe('«Станьте спонсором» · ' + имя, () => {

        test('число строго тише заголовка, заголовок звучит как раздел', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с, 'блок .sp-offer на странице').not.toBeNull();
            expect(с.число.к, 'число ' + с.число.к + ' против заголовка ' + с.заголовок.к)
                .toBeLessThan(с.заголовок.к);
            expect(с.заголовок.к, 'заголовок блока ' + с.заголовок.к +
                ', заголовок раздела ' + с.соседний.к).toBe(с.соседний.к);
            expect(с.заголовок.в, 'вес блока ' + с.заголовок.в + ', вес раздела ' + с.соседний.в)
                .toBe(с.соседний.в);
        });

        test('вступление не мельче пунктов списка', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.лид.к, 'вступление ' + с.лид.к + ', пункт ' + с.пункт.к)
                .toBeGreaterThanOrEqual(с.пункт.к);
            expect(с.подпись.к, 'подпись ' + с.подпись.к + ' не крупнее пункта ' + с.пункт.к)
                .toBeLessThanOrEqual(с.пункт.к);
        });

        /* ЯКОРЬ ДЕРЖИТСЯ НА СВОЁМ — дважды переписано, и оба раза тестом.
           Первая попытка сравнивала коробку с первым .section-header на
           странице: первый лежит в #live, который до прихода данных скрыт, а
           скрытый элемент отдаёт нули. «коробка 17, соседи 0».
           Вторая требовала, чтобы ВСЕ видимые заголовки разделов стояли на
           одном краю. Это утверждение про чужие секции, и оно упало, потому
           что на 768 у страницы ДЕЙСТВИТЕЛЬНО два левых края: семь секций
           стоят на жёстких 26 (правило @media 768 «padding: 40px 26px»,
           число мимо шкалы), а #venues и этот блок — на системном --pad-x,
           16.89. Находка записана в трекер как долг страницы; чинить её
           внутри куска про спонсоров нельзя, она трогает семь секций.
           ДОПИСАНО ПОСЛЕ ПОЧИНКИ, по слову Кости: жёсткие 26 заменены на
           var(--pad-x), у страницы снова один край, и проверка соседей
           вернулась сторожем — она падает, если какая-то секция опять заведёт
           себе своё поле. Первым идёт утверждение про СВОЁ: у коробки нет
           своей ширины, её левый край и ширина ровно те, что даёт обёртка.
           Это и есть то, что чинилось: было max-width 1100 при 1400. */
        test('у коробки нет своей ширины — её задаёт обёртка', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            const д = await page.evaluate(() => {
                const о = document.querySelector('.sp-offer-wrap');
                const s = getComputedStyle(о);
                const r = о.getBoundingClientRect();
                const соседи = [...document.querySelectorAll('.section-header')]
                    .filter(э => э.getClientRects().length)
                    .map(э => Math.round(э.getBoundingClientRect().left));
                return { край: Math.round(r.left + parseFloat(s.paddingLeft)),
                         ширина: Math.round(r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)),
                         соседи: [...new Set(соседи)] };
            });
            expect(Math.abs(с.коробка.л - д.край),
                'коробка ' + с.коробка.л + ', поле обёртки ' + д.край).toBeLessThanOrEqual(1);
            expect(Math.abs(с.коробка.ш - д.ширина),
                'коробка ' + с.коробка.ш + ' шириной, обёртка даёт ' + д.ширина).toBeLessThanOrEqual(1);
            expect(д.соседи.length, 'у страницы один левый край, найдено: ' + д.соседи.join(', '))
                .toBe(1);
            expect(Math.abs(с.коробка.л - д.соседи[0]),
                'коробка ' + с.коробка.л + ', страница ' + д.соседи[0]).toBeLessThanOrEqual(1);
        });

        test('кнопка 44 и кольцо фокуса по настоящему Tab', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.кнопка.вы, 'высота кнопки ' + с.кнопка.вы).toBeGreaterThanOrEqual(44);
            expect(с.кнопка.тег, 'кнопка это ссылка').toBe('a');

            /* Ставим фокус на предыдущий по порядку элемент и идём Tab-ом:
               :focus-visible включается от клавиатуры, а не от .focus(). */
            await page.evaluate(() => {
                const a = document.querySelector('.sp-cta-btn');
                const все = [...document.querySelectorAll('a[href], button')];
                const i = все.indexOf(a);
                if (i > 0) все[i - 1].focus();
            });
            await page.keyboard.press('Tab');
            const кольцо = await page.evaluate(() => {
                const a = document.querySelector('.sp-cta-btn');
                if (document.activeElement !== a) return { фокус: false };
                const s = getComputedStyle(a);
                return { фокус: true, стиль: s.outlineStyle,
                         ширина: Math.round(parseFloat(s.outlineWidth)),
                         видимо: a.matches(':focus-visible') };
            });
            expect(кольцо.фокус, 'Tab довёл фокус до кнопки').toBe(true);
            expect(кольцо.видимо, 'кнопка получила :focus-visible').toBe(true);
            expect(кольцо.стиль, 'кольцо нарисовано').not.toBe('none');
            expect(кольцо.ширина, 'толщина кольца ' + кольцо.ширина).toBeGreaterThanOrEqual(3);
        });

        test('четыре числа, четыре обещания, один призыв', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.число.сколько, 'чисел четыре').toBe(4);
            expect(с.подпись.сколько, 'подписей четыре').toBe(4);
            expect(с.список.ul, 'обещания это ul').toBe(true);
            expect(с.список.li, 'обещаний четыре').toBe(4);
            expect(с.ссылок, 'ссылка в блоке одна').toBe(1);
            /* ДОЛГ, названный на доске 437:9 блок 7: страницы спонсоров нет
               ни на английском, ни на кыргызском, поэтому призыв на всех трёх
               языках пока ведёт на русскую. Перевод страницы — следующий кусок,
               и когда он придёт, здесь появится суффикс языка. */
            expect(с.кнопка.адрес, 'адрес призыва · ' + имя).toBe('pages/sponsors.html');
        });

        test('третье число приходит из базы и совпадает с шапкой', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.изБазы, 'число в блоке').toMatch(/^[\d\s ,.]+$/);
            expect(с.изБазы, 'блок и шапка считают одним счётчиком').toBe(с.вШапке);
            expect(с.число.тексты.join(' '), 'старого «120+» не осталось').not.toContain('120+');
        });

        test('уровень заголовка не пропущен, эмодзи нет', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.заголовки.join(' '), 'заголовки блока').toBe('h2');
            expect(с.эмодзи, 'эмодзи в блоке нет').toBe(false);
        });

        test('подпись и пункт проходят порог WCAG 4.5', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.подпись.контраст, 'контраст подписи под числом').toBeGreaterThanOrEqual(4.5);
            expect(с.пункт.контраст, 'контраст пункта списка').toBeGreaterThanOrEqual(4.5);
        });

        test('строка пункта не режется в столбик, прокрутки нет', async ({ page }) => {
            await дождаться(page, адрес);
            const с = await снимок(page);
            expect(с.пункт.знаков, 'знаков в строке пункта: ' + с.пункт.знаков)
                .toBeGreaterThanOrEqual(28);
            expect(с.пункт.строк, 'пункт ложится в ' + с.пункт.строк + ' строки')
                .toBeLessThanOrEqual(2);
            expect(с.горПрокрутка, 'горизонтальной прокрутки нет').toBe(false);
        });
    });
});
