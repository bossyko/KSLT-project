// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ПОЛЕ, ПОЛОЖЕННОЕ В ПЕРЕМЕННУЮ, ТОЖЕ ЭКРАНИРУЕТСЯ. Кусок 159, 25.10.
 *
 * ЧТО БЫЛО. Признак куска 158 видел `t.image`, но не видел
 * `var постер = t.image`, и ровно так адрес афиши турнира попал в
 * `style="…url(…)"` мимо экранирования: `)` и кавычка закрывают и `url(`, и
 * сам атрибут. Кусок 159 научил признак разворачивать переменную до того,
 * что в неё положили, внутри одной функции — и он сразу назвал 84 новых
 * места, включая БЛИЗНЕЦА этой же беды в `tournaments-overview.js`.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и видит
 * зов экранирования. Он не может сказать, что на живом экране атрибут не
 * разъехался и обработчик не родился — ни в ветке живого турнира
 * (`--poster`), ни в ветке архивного (`background-image`). Обе ветки идут
 * ЧЕРЕЗ ОДНУ ПЕРЕМЕННУЮ, и проверяются обе.
 *
 * ЧЕГО ЭТА ПРОБА НЕ ДОСТАЁТ, И ЭТО НАЗВАНО ПРЯМО. Строку на обзорной
 * странице собирает МЕСТНАЯ функция `tournaments-overview.js`, наружу он не
 * отдаёт ничего; счёт в `scoreboard.js` и `live-match.js`, лицо тренера в
 * `services.js` — тоже местные. Позвать их путём продукта нельзя, и эти
 * правки держит сторож с прувером, а не проба.
 * ПРОБА ДЕРЖИТ ТОЛЬКО ТО, ЧТО МОЖНО ПОЗВАТЬ СНАРУЖИ.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155.
 */

const ЯЗЫКИ = [
    { имя: 'ru', турниры: '/pages/tournaments.html' },
    { имя: 'en', турниры: '/pages/tournaments-en.html' },
    { имя: 'kg', турниры: '/pages/tournaments-kg.html' }
];

/* КРАЙНИЙ АДРЕС: `)` закрывает `url(`, кавычка закрывает атрибут, дальше
   идёт имя обработчика. Обработчик намеренно безобидный: цену называют, а
   не эксплуатируют. */
const КРАЙНИЙ_АДРЕС = 'img/a.jpg)" onload="1" data-podlog="1';

async function открыть(page, адрес, дома) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    await page.waitForFunction(имена => имена.every(и => !!window[и]), дома, { timeout: 20000 });
    return беды;
}

async function собрать(page, турнир) {
    return page.evaluate(т => {
        const песок = document.createElement('div');
        document.body.appendChild(песок);
        песок.innerHTML = window.KSLT_TBLOCK.compact(т);
        const у = песок.querySelector('.to-compact');
        const итог = {
            есть: !!у,
            обработчиков: у ? у.getAttributeNames().filter(а => а.indexOf('on') === 0) : null,
            подложных: у ? у.getAttributeNames().filter(а => а.indexOf('data-podlog') === 0) : null,
            стиль: у ? (у.getAttribute('style') || '') : null,
            атрибуты: у ? у.getAttributeNames().slice().sort() : null
        };
        песок.remove();
        return итог;
    }, турнир);
}

for (const я of ЯЗЫКИ) {

    test(`A · афиша живого турнира через переменную: атрибут цел · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=159a', ['KSLT_TBLOCK', 'KSLT_экранировать']);
        /* `постер = t.imageFull || t.image` — значение приходит ПЕРЕМЕННОЙ,
           и это ровно тот путь, которого признак 158 не видел. */
        const о = await собрать(page, {
            id: 'proba', name: 'обычный', location: 'там', status: 'upcoming',
            statusText: 'скоро', href: '#', date: { day: '12', month: 'окт' },
            _rawStatus: 'upcoming', _gender: 'all', imageFull: КРАЙНИЙ_АДРЕС
        });

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(о.есть, 'строка собралась').toBe(true);
        expect(о.обработчиков, 'обработчиков не появилось').toEqual([]);
        expect(о.подложных, 'подложного атрибута не появилось').toEqual([]);
        /* СЛОВО В ЗНАЧЕНИИ — НЕ ОБРАБОТЧИК. Первый прогон падал здесь:
           проба требовала, чтобы в `style` не было строки `onload`, а она
           там и должна быть — ТЕКСТОМ внутри значения, целым адресом.
           Устройство разметки доказывают атрибуты, а не написание. */
        expect(о.стиль, 'адрес лежит в --poster').toContain('--poster');
        expect(о.стиль, 'адрес остался ОДНИМ значением, целиком').toContain(КРАЙНИЙ_АДРЕС);
        expect(о.атрибуты, 'атрибуты только свои').toEqual(['class', 'data-gender', 'data-status', 'style']);
    });

    test(`B · афиша архивного турнира: вторая ветка той же переменной · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=159b', ['KSLT_TBLOCK', 'KSLT_экранировать']);
        /* У архивного турнира та же переменная уходит в `background-image`,
           и ветка другая: ОДНА ПЕРЕМЕННАЯ — ДВЕ ВЕТКИ, МЕРИМ ОБЕ. */
        const о = await собрать(page, {
            id: 'proba', name: 'обычный', location: 'там', status: 'past',
            statusText: 'прошёл', href: '#', date: { day: '12', month: 'окт' },
            _rawStatus: 'past', _gender: 'all', image: КРАЙНИЙ_АДРЕС
        });

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(о.есть, 'строка собралась').toBe(true);
        expect(о.обработчиков, 'обработчиков не появилось').toEqual([]);
        expect(о.подложных, 'подложного атрибута не появилось').toEqual([]);
        expect(о.стиль, 'адрес лежит в background-image').toContain('background-image');
        expect(о.стиль, 'адрес остался ОДНИМ значением, целиком').toContain(КРАЙНИЙ_АДРЕС);
        expect(о.атрибуты, 'атрибуты только свои').toEqual(['class', 'data-gender', 'data-status', 'style']);
    });
}
