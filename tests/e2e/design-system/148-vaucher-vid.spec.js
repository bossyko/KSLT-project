/**
 * КУСОК 148 — ОКНО ВАУЧЕРА: ОДИН ВИД НА ПРОДУКТ.
 *
 * ЧТО БЫЛО. Вид окна ваучера, выбора услуги и истории был описан ТРИЖДЫ:
 * 42 правила с приставкой `co-` в `css/coaches.css`, 42 правила с
 * приставкой `ct-` в `css/courts.css` (замер: 40 из 42 знак в знак, два
 * расходились ТОЛЬКО именем анимации) и третий раз — инлайн-стилями в
 * кабинете. Анимация была написана четыре раза.
 *
 * ЧТО СТАЛО. Один файл `css/kslt-vaucher.css`, один набор имён в доме
 * `KSLT_VAUCHER_BLOK.КЛАССЫ` с приставкой `kslt-`, одна подложка на три
 * окна, одна анимация.
 *
 * ПОЧЕМУ ПРОБА НА СТЕНДЕ. Весь блок стоит за членством, а сотрудник клуба
 * с куска 142 не член — живым экраном его не достать ни мне, ни админу.
 * Стенд `maket/stend-vaucher-blok.html` гоняет НАСТОЯЩИЙ дом и настоящий
 * css с подставным клиентом базы. Это сказано вслух, а не выдано за
 * живой экран.
 *
 * ГЛАВНОЕ, ЧТО ЭТА ПРОБА ДЕРЖИТ, — ВЕРХ ОКНА. Замер 23.10 на телефоне в
 * горизонтали (844x390): окно ваучера высотой 586 при экране 390,
 * `align-items: center` ставил его верх на -98, подложка `fixed` с
 * `overflow: visible` не прокручивалась — КРЕСТИК И ЗАГОЛОВОК БЫЛИ ЗА
 * ЭКРАНОМ И НЕ ДОСТАВАЛИСЬ НИКАК. Беда приехала вместе с видом из обеих
 * прежних копий, то есть жила на всех четырёх страницах кортов и
 * тренеров. Починено `flex-start` + `overflow-y: auto` + `margin: auto`,
 * без новых чисел.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/stend-vaucher-blok.html';
const адрес = (сост, пр, яз) => СТЕНД + '?sost=' + сост + '&pr=' + пр + '&yaz=' + яз;

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_VAUCHER_BLOK && !!window.СТЕНД,
        null, { timeout: 15000 });
}

/* ПРОБА ЖДЁТ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: окно появляется по ответу
   подставного клиента, поэтому ждём само окно. */
async function открытьИзИстории(page) {
    await page.waitForSelector('.kslt-vh-qr-btn', { timeout: 15000 });
    await page.click('.kslt-vh-qr-btn');
    await page.waitForSelector('#ksltVoucherModal .kslt-voucher-qr', { timeout: 15000 });
    /* ЗАМЕР ВО ВРЕМЯ АНИМАЦИИ ВРЁТ: окно появляется с
       `translateY(20px) scale(0.95)` за 0.25s, а `getBoundingClientRect`
       отдаёт ПРЕОБРАЗОВАННУЮ коробку. Замер через 60 мс дал 388x568
       вместо 400x586 (400 x 0.95 = 380), и у кортов с тренерами числа
       разошлись на 1 px — не видом, а тем, кто успел дорисоваться.
       Ждём ПРИЗНАК: все анимации окна в состоянии `finished`. Под
       `prefers-reduced-motion` звёздочка в `tokens.css` доматывает их за
       0.01 мс, и признак срабатывает сразу. */
    await page.waitForFunction(() => {
        const окно = document.querySelector('#ksltVoucherModal .kslt-voucher-modal');
        if (!окно) return false;
        return окно.getAnimations().every(а => а.playState === 'finished');
    }, null, { timeout: 15000 });
}

/* ЗАМЕР ОДНОЙ МЕРКОЙ ДЛЯ ВСЕХ ПРОВЕРОК: что меряем — то и утверждаем. */
const СНЯТЬ = `() => {
    const под = document.getElementById('ksltVoucherModal');
    const окно = под.querySelector('.kslt-voucher-modal');
    const cп = getComputedStyle(под), cо = getComputedStyle(окно);
    const r = окно.getBoundingClientRect();
    const крестик = document.getElementById('ksltVoucherClose').getBoundingClientRect();
    const снять = (кл) => { const э = под.querySelector(кл); if (!э) return null;
        const c = getComputedStyle(э);
        return { кегль: parseFloat(c.fontSize), вес: c.fontWeight, межстр: c.lineHeight }; };
    return {
        экран: { ш: window.innerWidth, в: window.innerHeight },
        подложка: { align: cп.alignItems, overflowY: cп.overflowY,
                    краска: cп.backgroundColor, размытие: cп.backdropFilter },
        вид: { ширина: Math.round(r.width), maxWidth: cо.maxWidth,
               радиус: cо.borderRadius, отступ: cо.padding,
               краска: cо.backgroundColor, анимация: cо.animationName },
        место: { высота: Math.round(r.height), верх: Math.round(r.top),
                 слева: Math.round(r.left), справа: Math.round(r.right) },
        анимацияДорисована: окно.getAnimations().every(а => а.playState === 'finished'),
        крестикВиден: крестик.top >= 0 && крестик.bottom <= window.innerHeight &&
                      крестик.left >= 0 && крестик.right <= window.innerWidth,
        лестница: { заголовок: снять('.kslt-voucher-title'),
                    процент: снять('.kslt-voucher-percent'),
                    строка: снять('.kslt-voucher-row'),
                    скачать: снять('.kslt-voucher-download') },
        строк: под.querySelectorAll('.kslt-voucher-row').length,
        нашихИнлайнов: [...под.querySelectorAll('[class^="kslt-"][style]')].length,
        староеИмя: /\\b(?:co|ct)-(?:voucher|picker|vh)-/.test(под.outerHTML)
    };
}`;

/* СТРОКА В evaluate — ВЫРАЖЕНИЕ, А НЕ ЗОВ. Первая запись пробы отдавала
   мерку строкой прямо в зов evaluate: выражение `() => {...}` отдаёт
   функцию, функция через границу страницы не переезжает, и проба
   получала `undefined` — упали все 35 прогонов на всех пяти видах.
   Исходник едет АРГУМЕНТОМ и разворачивается в странице — так же, как
   мерка в пробе 103. */
const замерить = (page) => page.evaluate(и => eval('(' + и + ')')(), СНЯТЬ);

test.describe('окно ваучера: один вид на продукт', () => {

    /* ГЛАВНОЕ ПРАВИЛО. На коротком экране окно НЕ ОБРЕЗАЕТСЯ СВЕРХУ, и
       низ достаётся прокруткой подложки. Откат правки в css роняет
       именно это. */
    test('верх окна на экране, низ достаётся прокруткой', async ({ page }) => {
        await page.goto(адрес('istoriya', 'co', 'ru'));
        await дом(page);
        await открытьИзИстории(page);

        const м = await замерить(page);

        expect(м.анимацияДорисована, 'замер попал в середину анимации — числа соврут').toBe(true);
        expect(м.место.верх, 'верх окна ушёл за экран — крестик и заголовок не достать')
            .toBeGreaterThanOrEqual(0);
        expect(м.крестикВиден, 'крестик закрытия не на экране').toBe(true);
        expect(м.подложка.align, 'подложка центрует окно жёстко — на коротком экране верх срежется')
            .toBe('flex-start');
        expect(м.подложка.overflowY, 'подложка не прокручивается — высокое окно обрежется молча')
            .toBe('auto');

        /* ПРОКРУТКА ПРОВЕРЯЕТСЯ ПРОКРУТКОЙ, а не наличием свойства. */
        const низ = await page.evaluate(() => {
            const под = document.getElementById('ksltVoucherModal');
            const окно = под.querySelector('.kslt-voucher-modal');
            под.scrollTop = 99999;
            return { низ: Math.round(окно.getBoundingClientRect().bottom),
                     экран: window.innerHeight };
        });
        expect(низ.низ, 'низ окна не достаётся прокруткой подложки')
            .toBeLessThanOrEqual(низ.экран + 1);
    });

    test('окно влезает по ширине и не шире 400', async ({ page }) => {
        await page.goto(адрес('istoriya', 'co', 'ru'));
        await дом(page);
        await открытьИзИстории(page);

        const м = await замерить(page);

        expect(м.вид.maxWidth, 'потолок ширины окна уехал со ступени').toBe('400px');
        expect(м.вид.ширина, 'окно шире своего потолка').toBeLessThanOrEqual(400);
        expect(м.место.слева, 'окно уехало за левый край').toBeGreaterThanOrEqual(0);
        expect(м.место.справа, 'окно уехало за правый край')
            .toBeLessThanOrEqual(м.экран.ш);
    });

    /* ОДИН ВИД НА ПРОДУКТ — ПРОВЕРЯЕТСЯ СРАВНЕНИЕМ, А НЕ ЧТЕНИЕМ CSS.
       Тренеры и корты открывают одно и то же окно: пока вид приходит из
       одного файла, замеры ВИДА совпадают знак в знак. Вернись приставка
       — разойдутся.
       ВЫСОТА И КРАЯ В СРАВНЕНИЕ НЕ ВХОДЯТ: они зависят от СОДЕРЖИМОГО, а
       не от вида. Если в одном разделе название услуги длиннее на строку,
       высота разойдётся законно — сторожить по ней значит сторожить текст
       стенда, а не вид. */
    test('у тренеров и у кортов окно замеряется одинаково', async ({ page }) => {
        const снято = {};
        for (const пр of ['co', 'ct']) {
            await page.goto(адрес('istoriya', пр, 'ru'));
            await дом(page);
            await открытьИзИстории(page);
            снято[пр] = await замерить(page);
        }

        expect(снято.ct.вид, 'вид окна у кортов разошёлся с тренерами')
            .toEqual(снято.co.вид);
        expect(снято.ct.подложка, 'подложка у кортов разошлась с тренерами')
            .toEqual(снято.co.подложка);
        expect(снято.ct.лестница, 'лестница текста у кортов разошлась с тренерами')
            .toEqual(снято.co.лестница);
        expect(снято.co.вид.анимация, 'анимация окна не одна на продукт')
            .toBe('kslt-modal-slide-in');
    });

    /* ЛЕСТНИЦА ТЕКСТА — ЗАМЕРЕННАЯ, А НЕ ЗАДУМАННАЯ. Числа сняты 23.10 на
       пяти видах: они одни и те же на всех, меняется только отступ окна
       (32 выше 640, 24/20 ниже). Замороженными становятся отношения:
       заголовок строго крупнее строки, процент того же кегля что строка,
       но тяжелее. */
    test('лестница текста: кегли со ступеней, отношения на месте', async ({ page }) => {
        await page.goto(адрес('istoriya', 'co', 'ru'));
        await дом(page);
        await открытьИзИстории(page);

        const м = await замерить(page);
        const Л = м.лестница;
        const СТУПЕНИ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

        for (const уровень of ['заголовок', 'процент', 'строка', 'скачать']) {
            expect(Л[уровень], 'уровень лестницы не найден: ' + уровень).not.toBeNull();
            expect(СТУПЕНИ, уровень + ': кегль ' + Л[уровень].кегль + ' мимо шкалы')
                .toContain(Л[уровень].кегль);
        }

        expect(Л.заголовок.кегль, 'заголовок не крупнее строки деталей')
            .toBeGreaterThan(Л.строка.кегль);
        expect(Number(Л.заголовок.вес), 'заголовок не тяжелее строки')
            .toBeGreaterThan(Number(Л.строка.вес));
        expect(Л.процент.кегль, 'процент разошёлся со строкой по кеглю')
            .toBe(Л.строка.кегль);
        expect(Number(Л.процент.вес), 'процент не выделен весом')
            .toBeGreaterThan(Number(Л.строка.вес));
        expect(Number(Л.скачать.вес), 'кнопка не выделена весом')
            .toBeGreaterThan(Number(Л.строка.вес));
        expect(м.строк, 'в окне не четыре строки деталей').toBe(4);
    });

    /* ТРИ ЯЗЫКА. Вид один на все три: язык меняет текст, а не лестницу и
       не геометрию окна. */
    for (const яз of ['ru', 'en', 'kg']) {
        test('язык ' + яз + ': вид тот же, имена новые, инлайнов нет', async ({ page }) => {
            await page.goto(адрес('istoriya', 'co', яз));
            await дом(page);
            await открытьИзИстории(page);

            const м = await замерить(page);

            expect(м.место.верх, 'верх окна за экраном на языке ' + яз)
                .toBeGreaterThanOrEqual(0);
            expect(м.вид.maxWidth, 'потолок ширины разошёлся на языке ' + яз).toBe('400px');
            expect(м.лестница.заголовок.кегль, 'кегль заголовка зависит от языка').toBe(18);
            expect(м.лестница.строка.кегль, 'кегль строки зависит от языка').toBe(14);
            /* ИНЛАЙНОВ НЕТ У НАШИХ ЭЛЕМЕНТОВ. Два инлайна в окне есть
               всегда — их пишет библиотека QR своему `canvas` и `img`, и
               это не наш код: мерка отбирает только элементы с классами
               `kslt-`. */
            expect(м.нашихИнлайнов, 'вид вернулся в инлайн-стили').toBe(0);
            expect(м.староеИмя, 'в разметке окна всплыло имя с приставкой co-/ct-').toBe(false);
        });
    }
});
