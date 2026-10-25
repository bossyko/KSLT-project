// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ОТСЧЁТ ДО НАЧАЛА — ОДНО ТЕЛО И ОДИН ТИКЕР. Кусок 163, 25.10.
 *
 * ЧТО БЫЛО. Разметку отсчёта собирали ЧЕТЫРЕ тела в четырёх файлах
 * (`tournament-blocks.js`, `tournaments-overview.js`, `battles-overview.js`,
 * `tournament-card.js`), и каждое держало свой `setInterval` по секунде —
 * четыре копии одного понятия и работа вчетверо. Отличались они тремя
 * вещами: имена классов (`to-cd-*` / `bo-cd-*` / `tc-cd-*`), поведение по
 * истечении (у турниров узел становится «идёт сейчас», у баттлов и карточки
 * снимается) и у карточки — свои пять слов. Все три различия ушли ДОВОДОМ и
 * таблицей семей, css не правился ни строкой.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы: он видит
 * одно тело, одну таблицу и один тикер. Он НЕ МОЖЕТ сказать, что на живом
 * экране узел семьи `bo` получил именно свои классы, что ОДИН тикер
 * обслуживает узлы РАЗНЫХ семей за один проход и что по истечении каждая
 * семья повела себя по-своему. Это и мерится здесь — на настоящем тике, а не
 * на чтении.
 *
 * ЧЕГО ЭТА ПРОБА НЕ ДОСТАЁТ, И ЭТО НАЗВАНО ПРЯМО. Строку обзорной страницы и
 * карточку турнира собирают МЕСТНЫЕ функции своих файлов, наружу они ничего
 * не отдают; данные турнира приходят из базы. Поэтому проба зовёт ДОМ —
 * `KSLT_TFEATURED.отсчёт` и `KSLT_TFEATURED.тик` — то, что можно позвать
 * снаружи (правило доски 159), а связку «дом → строка» держит сторож.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155: их даёт `playwright.config.js`
 * проектами, пять видов на три языка.
 */

const ЯЗЫКИ = [
    { имя: 'ru', турниры: '/pages/tournaments.html', приставка: 'Старт через', идёт: 'ИДЁТ СЕЙЧАС' },
    { имя: 'en', турниры: '/pages/tournaments-en.html', приставка: 'Starts in', идёт: 'IN PROGRESS' },
    { имя: 'kg', турниры: '/pages/tournaments-kg.html', приставка: 'Башталууга', идёт: 'АЗЫР ЖҮРҮҮДӨ' }
];

/* СЕМЬИ И ИХ ИМЕНА КЛАССОВ — ТА ЖЕ ТАБЛИЦА, ЧТО В ДОМЕ, НО НАБРАННАЯ ЗДЕСЬ
   ЗАНОВО. Проба не читает таблицу продукта: иначе она согласится с любой её
   правкой и перестанет быть проверкой. */
const СЕМЬИ = [
    { имя: 'to', корень: 'to-cd', подпись: 'to-cd-label', единица: 'to-cd-unit',
      живой: 'to-cd-live', точка: 'to-cd-dot', поИстечении: 'живой' },
    { имя: 'bo', корень: 'bo-cd', подпись: 'bo-cd-label', единица: 'bo-cd-unit',
      живой: 'bo-cd-live', точка: 'bo-cd-dot', поИстечении: 'снять' },
    { имя: 'tc', корень: 'tc-countdown', подпись: 'tc-cd-label', единица: 'tc-cd-unit',
      живой: 'tc-cd-live', точка: 'tc-cd-dot', поИстечении: 'снять' }
];

async function открыть(page, адрес) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    await page.waitForFunction(() => !!window.KSLT_TFEATURED && !!window.KSLT_TFEATURED.отсчёт, null, { timeout: 20000 });
    return беды;
}

for (const я of ЯЗЫКИ) {

    test(`A · три семьи — свои классы, единицы одним узлом · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=163a');

        const итог = await page.evaluate(семьи => {
            /* ЦЕЛЬ В ДВУХ ЧАСАХ: дальше 48 часов отсчёт не рисуется вовсе,
               и это НЕ беда, а правило продукта. Дата берётся от часов
               браузера, а не вписана числом. */
            const цель = new Date(Date.now() + 2 * 3600 * 1000);
            const дата = цель.getFullYear() + '-' + String(цель.getMonth() + 1).padStart(2, '0') +
                '-' + String(цель.getDate()).padStart(2, '0');
            const время = String(цель.getHours()).padStart(2, '0') + ':' + String(цель.getMinutes()).padStart(2, '0');
            const песок = document.createElement('div');
            document.body.appendChild(песок);
            const о = {};
            for (const с of семьи) {
                песок.innerHTML = window.KSLT_TFEATURED.отсчёт(дата, время, null, { семья: с.имя });
                const у = песок.firstElementChild;
                о[с.имя] = {
                    есть: !!у,
                    классы: у ? у.className : null,
                    семьяВРазметке: у ? (у.dataset.cdSemya || null) : null,
                    датаВРазметке: у ? (у.dataset.cdDate || null) : null,
                    подписей: у ? у.querySelectorAll('.' + с.подпись).length : null,
                    единиц: у ? у.querySelectorAll('.' + с.единица).length : null,
                    жирных: у ? у.querySelectorAll('b').length : null,
                    чужих: у ? у.querySelectorAll('[class]:not(.' + с.подпись + '):not(.' + с.единица + ')').length : null,
                    приставка: у ? (у.querySelector('.' + с.подпись) || {}).textContent : null
                };
            }
            песок.remove();
            return о;
        }, СЕМЬИ);

        expect(беды, 'страница без ошибок').toEqual([]);
        for (const с of СЕМЬИ) {
            const о = итог[с.имя];
            expect(о.есть, `семья ${с.имя}: узел собрался`).toBe(true);
            expect(о.классы, `семья ${с.имя}: корень свой`).toBe(с.корень);
            expect(о.семьяВРазметке, `семья ${с.имя}: имя семьи В РАЗМЕТКЕ`).toBe(с.имя);
            expect(о.датаВРазметке, `семья ${с.имя}: дата в разметке есть`).toBeTruthy();
            expect(о.подписей, `семья ${с.имя}: подпись одна`).toBe(1);
            /* ДВА ЧАСА — ЭТО ЧАСЫ, МИНУТЫ, СЕКУНДЫ, А СУТОК НЕТ: три
               единицы, и число посчитано из цели, а не задумано. */
            expect(о.единиц, `семья ${с.имя}: единиц три, и все одним узлом`).toBe(3);
            expect(о.жирных, `семья ${с.имя}: единицы не на <b>`).toBe(0);
            expect(о.чужих, `семья ${с.имя}: чужих классов внутри нет`).toBe(0);
            expect(о.приставка, `семья ${с.имя}: приставка одна на язык`).toBe(я.приставка);
        }
    });

    test(`B · один тикер, у каждой семьи своё поведение по истечении · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турниры + '?proba=163b');

        const итог = await page.evaluate(семьи => {
            /* ПРОШЛОЕ НА ПЯТЬ МИНУТ: по истечении семья `to` становится
               живой, `bo` и `tc` снимаются. Узлы кладём РЯДОМ, одним
               песком — проверяется именно то, что ОДИН проход тикера
               разводит их по своим поведениям. */
            const цель = new Date(Date.now() - 5 * 60 * 1000);
            const дата = цель.getFullYear() + '-' + String(цель.getMonth() + 1).padStart(2, '0') +
                '-' + String(цель.getDate()).padStart(2, '0');
            const время = String(цель.getHours()).padStart(2, '0') + ':' + String(цель.getMinutes()).padStart(2, '0');
            const песок = document.createElement('div');
            песок.id = 'proba163';
            document.body.appendChild(песок);
            песок.innerHTML = семьи.map(с =>
                '<span class="' + с.корень + '" data-cd-date="' + дата + '" data-cd-time="' + время +
                '" data-cd-semya="' + с.имя + '" data-proba="' + с.имя + '">x</span>').join('');
            const было = песок.children.length;
            window.KSLT_TFEATURED.тик();
            const о = { было: было, осталось: песок.children.length, по: {} };
            for (const с of семьи) {
                const у = песок.querySelector('[data-proba="' + с.имя + '"]');
                о.по[с.имя] = у ? { классы: у.className, текст: у.textContent, точек: у.querySelectorAll('.' + с.точка).length } : null;
            }
            песок.remove();
            return о;
        }, СЕМЬИ);

        expect(беды, 'страница без ошибок').toEqual([]);
        expect(итог.было, 'в песке лежали все три семьи').toBe(3);
        expect(итог.осталось, 'после одного тика осталась одна — турнирная').toBe(1);

        const to = итог.по.to;
        expect(to, 'семья to: узел на месте').not.toBeNull();
        expect(to.классы, 'семья to: стала живой').toBe('to-cd to-cd-live');
        expect(to.точек, 'семья to: кружок один').toBe(1);
        expect(to.текст, 'семья to: слова «идёт сейчас» из одного словаря').toContain(я.идёт);

        expect(итог.по.bo, 'семья bo: узел снят').toBeNull();
        expect(итог.по.tc, 'семья tc: узел снят').toBeNull();
    });
}
