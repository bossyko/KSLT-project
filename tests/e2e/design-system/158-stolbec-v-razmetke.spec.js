// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * СТОЛБЕЦ, КОТОРЫЙ ПИШЕТ ЧЕЛОВЕК, НЕ УХОДИТ В РАЗМЕТКУ. Кусок 158, 25.10.
 *
 * ЧТО БЫЛО. Запись 157 говорила о 248 зовах функций, отдающих разметку.
 * Замер нашёл, что слепых видов ТРИ, а не один: функции, ОТДАЮЩИЕ разметку
 * (220), функции, КОПЯЩИЕ её через `+=` (348), и `innerHTML = h`, где `h` —
 * переменная. Признак 157, приложенный ко ВСЕМ склейкам, дал 142 места.
 *
 * ПРИЗНАК БОЛЬШЕ НЕ ГАДАЕТ ПО ИМЕНИ ПОЛЯ. Он читает схему базы: столбец
 * пишет человек, если он текстовый, без CHECK со списком значений и не
 * идентификатор. Старый список слов не знал `author`, и `block.author`
 * уходил в разметку мимо всех приборов.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и видит,
 * что зов экранирования стоит. Он НЕ МОЖЕТ сказать, что на живом экране
 *   - тег из названия не родился, а прочитался буквами;
 *   - кавычка в адресе афиши не закрыла атрибут `style`;
 *   - подпись для диктора не разъехалась на два атрибута;
 *   - амперсанд не удвоился в `&amp;`.
 * Два места кусок нашёл ЧТЕНИЕМ, а не прибором: запасной ход дома страны
 * (`country-utils.js` отдаёт поле как есть, когда код не узнан) и адрес
 * афиши в `style="…url(…)"` — его положили в переменную, а переменные
 * признаку невидимы.
 *
 * ДАННЫЕ ПОДДЕЛЫВАЮТСЯ, А НЕ КОД: разметка собирается путём продукта —
 * `KSLT_TBLOCK.compact`, `KSLT_LICO.кружок`, `KSLT_LICO.лицо`,
 * `KSLT_SLOY.слой`, `KSLT_CU.renderCountry` — с крайними значениями.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155: проба, задающая вид сама,
 * отменяет вид проекта вместе с `hasTouch` и `isMobile`.
 */

/* СТРАНИЦА ВЫБРАНА ПО ТОМУ, ЧТО НА НЕЙ ЗАГРУЖЕНО, А НЕ ПО НАЗВАНИЮ.
   Проверено чтением тегов: `tournament-blocks.js` стоит только на
   «Турнирах», а `kslt-lico.js` там НЕ стоит — он на главной. Проба,
   открывшая не ту страницу, молча мерила бы пустоту. */
const ЯЗЫКИ = [
    { имя: 'ru', турниры: '/pages/tournaments.html', главная: '/index.html' },
    { имя: 'en', турниры: '/pages/tournaments-en.html', главная: '/index-en.html' },
    { имя: 'kg', турниры: '/pages/tournaments-kg.html', главная: '/index-kg.html' }
];

/* КРАЙНИЕ ЗНАЧЕНИЯ, А НЕ УДОБНЫЕ. В каждом: кавычка-ёлочка, двойная
   кавычка, амперсанд, тег с текстом и тег-одиночка с атрибутом. В адресе
   афиши — ещё и `)`, который закрывает `url(`. Обработчика нет намеренно:
   цену называют, а не эксплуатируют. */
const КРАЙНЕЕ_ИМЯ = 'Кубок «Ала-Тоо» & Co. <b>весна</b> "2026"';
const КРАЙНЕЕ_МЕСТО = 'Корт <i>№1</i> & парк, "центр"';
const КРАЙНИЙ_АДРЕС = 'img/a.jpg)" onload="1" x="';
const КРАЙНЯЯ_СТРАНА = 'KG" onmouseover="1';

/** ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: каждая проверка называет дома, которые
 *  ей нужны, и ждёт именно их. */
async function открыть(page, адрес, дома) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    await page.waitForFunction(
        имена => имена.every(и => !!window[и]),
        дома, { timeout: 20000 });
    return беды;
}

/** Собрать разметку путём продукта в отдельной песочнице на той же странице. */
async function вПесочнице(page, дело, доводы) {
    return page.evaluate(([дело_, доводы_]) => {
        const песок = document.createElement('div');
        песок.id = 'kslt-proba-158';
        document.body.appendChild(песок);
        // eslint-disable-next-line no-new-func
        const f = new Function('песок', 'д', дело_);
        const итог = f(песок, доводы_);
        песок.remove();
        return итог;
    }, [дело, доводы]);
}

for (const я of ЯЗЫКИ) {

    test(`A · строка турнира: тег не родился, амперсанд не удвоился · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=158a',
            ['KSLT_TBLOCK', 'KSLT_экранировать']);
        const о = await вПесочнице(page, `
            /* ПОДДЕЛЬНЫЕ ДАННЫЕ ПО МЕРКЕ ФУНКЦИИ, А НЕ ПО ПАМЯТИ: compact
               читает t.date.day и t.date.month, и без них падает на
               undefined. Поля перечислены чтением тела функции.
               ОБРАТНОЙ КАВЫЧКИ ЗДЕСЬ БЫТЬ НЕ МОЖЕТ: тело пробы — шаблонная
               строка, и кавычка в пояснении её закрывает. */
            песок.innerHTML = window.KSLT_TBLOCK.compact({
                id: 'proba', name: д.имя, location: д.место, status: 'upcoming',
                statusText: 'скоро', href: '#', date: { day: '12', month: 'окт' },
                _rawStatus: 'upcoming', _gender: 'all'
            });
            var h4 = песок.querySelector('h4');
            return {
                заголовок: h4 ? h4.textContent : null,
                теговВнутри: h4 ? h4.querySelectorAll('*').length : -1,
                картинок: песок.querySelectorAll('img').length,
                жирных: песок.querySelectorAll('b').length,
                курсивов: песок.querySelectorAll('i').length,
                весьТекст: песок.textContent
            };
        `, { имя: КРАЙНЕЕ_ИМЯ, место: КРАЙНЕЕ_МЕСТО });

        expect(беды, 'страница без ошибок').toEqual([]);
        /* ТЕГ НЕ РОДИЛСЯ */
        expect(о.теговВнутри, 'внутри заголовка нет узлов').toBe(0);
        expect(о.жирных, '<b> из названия не стал тегом').toBe(0);
        expect(о.курсивов, '<i> из места не стал тегом').toBe(0);
        expect(о.картинок, 'узел <img> не создался').toBe(0);
        /* ЧЕЛОВЕК ПРОЧТЁТ ТО, ЧТО НАПИСАЛИ — целиком, вместе со скобками */
        expect(о.заголовок, 'название читается буквами').toBe(КРАЙНЕЕ_ИМЯ);
        expect(о.весьТекст, 'место читается буквами').toContain(КРАЙНЕЕ_МЕСТО);
        /* АМПЕРСАНД НЕ УДВОИЛСЯ: дважды экранированный текст — тоже беда */
        expect(о.весьТекст, 'нет &amp;').not.toContain('&amp;');
    });

    test(`B · афиша в style: кавычка не закрыла атрибут · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=158b',
            ['KSLT_TBLOCK', 'KSLT_экранировать']);
        const о = await вПесочнице(page, `
            песок.innerHTML = window.KSLT_TBLOCK.compact({
                id: 'proba', name: 'обычный', location: 'там', status: 'upcoming',
                statusText: 'скоро', href: '#', date: { day: '12', month: 'окт' },
                _rawStatus: 'upcoming', _gender: 'all',
                image: д.адрес, imageFull: д.адрес
            });
            var у = песок.querySelector('.to-compact');
            return {
                есть: !!у,
                обработчиков: у ? ['onload', 'onerror', 'onmouseover'].filter(function (а) {
                    return у.hasAttribute(а);
                }) : null,
                лишних: у ? у.getAttributeNames().filter(function (а) {
                    return ['class', 'style', 'data-id', 'data-status', 'data-gender'].indexOf(а) === -1;
                }) : null
            };
        `, { адрес: КРАЙНИЙ_АДРЕС });

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(о.есть, 'строка собралась').toBe(true);
        /* КАВЫЧКА В АТРИБУТЕ ДАЁТ ОБРАБОТЧИК — этого и не должно быть */
        expect(о.обработчиков, 'обработчиков не появилось').toEqual([]);
        expect(о.лишних, 'лишних атрибутов не появилось').toEqual([]);
    });

    test(`C · лицо и кружок: подпись диктора не разъехалась · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.главная + '?proba=158c',
            ['KSLT_LICO', 'KSLT_SLOY', 'KSLT_экранировать']);
        const о = await вПесочнице(page, `
            песок.innerHTML =
                window.KSLT_LICO.лицо(д.адрес, д.имя, 'proba-foto') +
                window.KSLT_LICO.кружок(д.имя, 'proba-krug') +
                window.KSLT_SLOY.слой('proba-sloy', '#' + д.адрес, д.имя);
            var img = песок.querySelector('img');
            var a = песок.querySelector('a');
            var круг = песок.querySelector('.proba-krug');
            return {
                подпись: img ? img.getAttribute('alt') : null,
                классФото: img ? img.getAttribute('class') : null,
                обработчиковУФото: img ? img.getAttributeNames().filter(function (н) {
                    return н.indexOf('on') === 0; }) : null,
                подписьСлоя: a ? a.getAttribute('aria-label') : null,
                обработчиковУСлоя: a ? a.getAttributeNames().filter(function (н) {
                    return н.indexOf('on') === 0; }) : null,
                инициалы: круг ? круг.textContent : null,
                теговВКруге: круг ? круг.querySelectorAll('*').length : -1
            };
        `, { имя: КРАЙНЕЕ_ИМЯ, адрес: КРАЙНИЙ_АДРЕС });

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(о.подпись, 'подпись картинки — то же имя целиком').toBe(КРАЙНЕЕ_ИМЯ);
        expect(о.классФото, 'класс не подменился').toBe('proba-foto');
        expect(о.обработчиковУФото, 'у картинки нет обработчиков').toEqual([]);
        expect(о.подписьСлоя, 'подпись слоя — то же имя целиком').toBe(КРАЙНЕЕ_ИМЯ);
        expect(о.обработчиковУСлоя, 'у слоя нет обработчиков').toEqual([]);
        expect(о.теговВКруге, 'в кружке нет узлов').toBe(0);
    });

    test(`D · запасной ход дома страны отдаёт поле как есть · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.главная + '?proba=158d',
            ['KSLT_COUNTRY', 'KSLT_экранировать']);
        const о = await page.evaluate(([страна]) => {
            /* Дом страны отдаётся как `KSLT_COUNTRY` — имя прочитано
               в `js/country-utils.js`, а не угадано. */
            const CU = window.KSLT_COUNTRY;
            if (!CU || !CU.renderCountry) return { домаНет: true };
            const сырое = CU.renderCountry(CU.normalizeCountry(страна), 'ru', true);
            const песок = document.createElement('div');
            песок.innerHTML = '<span>' + window.KSLT_экранировать(сырое) + '</span>';
            const у = песок.firstChild;
            const итог = {
                домаНет: false,
                /* ДОМ ОТДАЁТ ЗНАЧЕНИЕ, А НЕ РАЗМЕТКУ: поле проходит насквозь,
                   когда код страны не узнан — это и есть запасной ход.
                   ПРОВЕРЯЕМ КАВЫЧКУ, А НЕ СЛОВО: `countryName` поднимает
                   регистр (`toUpperCase`), и `onmouseover` в выдаче
                   становится `ONMOUSEOVER`. Первый прогон это и поймал —
                   проба ждала догадку, а не замер. */
                насквозь: сырое.indexOf('"') !== -1,
                сырое: сырое,
                обработчиков: у.getAttributeNames().filter(н => н.indexOf('on') === 0),
                текст: у.textContent
            };
            песок.remove();
            return итог;
        }, [КРАЙНЯЯ_СТРАНА]);

        expect(беды, 'страница без ошибок').toEqual([]);
        if (о.домаНет) { test.skip(true, 'дом страны на этой странице не загружен'); return; }
        /* Запасной ход подтверждён: дом действительно отдаёт поле как есть */
        expect(о.насквозь, 'дом страны отдаёт поле насквозь — потому зовущий и экранирует').toBe(true);
        /* И после экранирования у зовущего тег не родился */
        expect(о.обработчиков, 'обработчиков не появилось').toEqual([]);
        expect(о.текст.toLowerCase(), 'поле читается буквами').toContain('onmouseover');
    });
}
