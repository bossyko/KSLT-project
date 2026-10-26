// @ts-check
/* ОБВЯЗКА, А НЕ ГОЛЫЙ PLAYWRIGHT: `tests/fixtures.js` подставляет адрес
   ТЕСТОВОЙ базы в `window.KSLT_DB` до загрузки страницы. */
const { test, expect } = require('../../fixtures');

/**
 * ОДИН ДОГОВОР НА ИМЯ УЧАСТНИКА. Кусок 176, 26.10.
 *
 * ЧТО ЭТА ПРОБА ЛОВИТ, А ЗАМОРОЗКА НЕ МОЖЕТ. Правила читают файлы как
 * текст: они держат, что в поле имени нет разметки и что оформитель один.
 * Но ЧТО ИМЕННО УВИДИТ ЗРИТЕЛЬ — тег или имя — говорит только прогон.
 * Кусок 158 (25.10) экранировал имя на месте вставки, и три дня восемь
 * парных турниров показывали людям
 * `<span class="td-team-name">Эльдияр Боруев / Рустам Сулейманов</span>`
 * ТЕКСТОМ. Замер 26.10 на боевом `66f22aa4`: 14 клеток из 14.
 *
 * ПОЧЕМУ СТЕНД, А НЕ БОЕВАЯ СТРАНИЦА. Беду показывал только парный турнир
 * с ЛИГОВОЙ сеткой: в тестовой базе такого нет, а сеять его значит
 * трогать данные. `maket/proba-dogovor-imeni.html` зовёт НАСТОЯЩИЕ
 * функции продукта — `renderLeagueBracketPublic`, `renderMatch`,
 * `имяУчастникаТекстом`, `getPublicTeamName` — с крайними значениями:
 * имя с амперсандом, с апострофом, с кавычкой, с тегом внутри, пара с
 * внешним напарником, пустой слот с меткой и пустой слот без метки.
 *
 * ТРИ ЯЗЫКА проверяются на БОЕВЫХ страницах тестовой базы: имя участника
 * приходит из базы и от языка не зависит, а вот подключение файла и
 * сборка клетки — зависят от страницы, и страниц три.
 */

const СТЕНД = '/maket/proba-dogovor-imeni.html';
const СТРАНИЦЫ = {
    ru: '/pages/tournament.html',
    en: '/pages/tournament-en.html',
    kg: '/pages/tournament-kg.html'
};
const ПАРНЫЙ = 'test-doubles';
const СЛОТЫ = 'test-sloty';

async function стенд(page) {
    await page.goto(СТЕНД);
    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ. */
    await page.waitForSelector('body[data-проба-готова="1"]', { timeout: 20000 });
    await page.waitForSelector('#пары .td-player-name', { timeout: 20000 });
}

test.describe('Один договор на имя участника', () => {

    test('в клетке сетки стоит имя, а не разметка текстом', async ({ page }) => {
        await стенд(page);
        const тексты = await page.$$eval('.td-player-name', эл => эл.map(э => э.textContent.trim()));
        expect(тексты.length).toBeGreaterThanOrEqual(16);
        /* НИ ОДНОГО ТЕГА ТЕКСТОМ. Это и есть беда куска 158 в одну строку.
           Имя `<b>Хакер</b>` в данных есть намеренно — и оно обязано
           читаться целиком, со своими угловыми скобками, а не исчезать. */
        const сТегомОформления = тексты.filter(т => /<span|<\/span>|class="td-/.test(т));
        expect(сТегомОформления, 'разметка оформления показана текстом').toEqual([]);
        /* И НИ ОДНОГО ДВАЖДЫ ЭКРАНИРОВАННОГО ЗНАКА: `&amp;` вместо `&`
           значит, что имя прошло экранирование два раза. */
        const дважды = тексты.filter(т => /&(amp|lt|gt|quot|#39);/.test(т));
        expect(дважды, 'имя экранировано дважды').toEqual([]);
    });

    test('особые знаки имени доходят до зрителя как знаки', async ({ page }) => {
        await стенд(page);
        const тексты = await page.$$eval('#пары .td-player-name', эл => эл.map(э => э.textContent.trim()));
        expect(тексты).toContain('Ким & Ли / О\'Коннор');
        expect(тексты).toContain('<b>Хакер</b> / Гость & Co');
        /* ТЕГ В ИМЕНИ ИГРОКА — ЭТО ДАННЫЕ, И ОН ОБЯЗАН ОСТАТЬСЯ ТЕКСТОМ:
           если бы он стал настоящим тегом, страницей управляли бы данные
           из базы. Проверяется не текстом, а числом узлов внутри. */
        const жирных = await page.$$eval('#пары .td-player-name b', эл => эл.length);
        expect(жирных, 'тег из имени игрока ожил в разметке').toBe(0);
    });

    test('пара оформлена парой, одиночка — нет', async ({ page }) => {
        await стенд(page);
        /* Пять имён из шести в парной сетке — пары; шестое, «Он сказал
           "да"», заявлено БЕЗ напарника, и парой оформляться не должно. */
        expect(await page.$$eval('#пары .td-player-name .td-team-name', э => э.length)).toBe(5);
        expect(await page.$$eval('#одиночки .td-player-name .td-team-name', э => э.length)).toBe(0);
    });

    test('пустая клетка говорит, кого ждёт, а BYE остаётся BYE', async ({ page }) => {
        await стенд(page);
        const метки = await page.$$eval('#метки .td-player-name .td-slot-wait', эл => эл.map(э => э.textContent.trim()));
        expect(метки).toEqual(['A1', 'IG1', 'B1']);
        const все = await page.$$eval('#метки .td-player-name', эл => эл.map(э => э.textContent.trim()));
        expect(все[3], 'слот без метки — это BYE, ждать некого').toBe('BYE');
    });

    test('лестница текста клетки стоит на ступенях', async ({ page }) => {
        await стенд(page);
        const л = await page.evaluate(() => {
            const ст = с => { const э = document.querySelector(с); if (!э) return null;
                const s = getComputedStyle(э);
                return { кегль: parseFloat(s.fontSize), вес: s.fontWeight,
                         межстрочный: +(parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2) }; };
            return { имя: ст('#одиночки .td-player-name'), пара: ст('#пары .td-team-name'), метка: ст('#метки .td-slot-wait') };
        });
        const КЕГЛИ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
        const СТУПЕНИ = [1, 1.1, 1.3, 1.5, 1.65];
        Object.entries(л).forEach(([имя, з]) => {
            expect(з, имя + ' не нашлось').not.toBeNull();
            expect(КЕГЛИ, имя + ': кегль ' + з.кегль + ' мимо шкалы').toContain(з.кегль);
            expect(СТУПЕНИ, имя + ': межстрочный ' + з.межстрочный + ' мимо лестницы').toContain(з.межстрочный);
        });
        /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: имя пары на ступень
           крупнее одиночного на КАЖДОМ виде — пара это два человека, и
           читать её труднее. Замер 26.10: 14 против 12. */
        expect(л.пара.кегль, 'имя пары обязано быть крупнее одиночного').toBeGreaterThan(л.имя.кегль);
        /* Метка слота — не фамилия: она стоит на кегле имени, но весом
           отличается от обычного начертания (замер: 600). */
        expect(Number(л.метка.вес), 'метка слота потеряла вес').toBeGreaterThanOrEqual(600);
    });

    test('дом имени отдаёт текст, а оформленная отдача — разметку', async ({ page }) => {
        await стенд(page);
        const д = await page.evaluate(() => {
            const игроки = { 'к': { name: 'Ким & Ли' } };
            const заявки = { 'к': { partner_external_name: 'Гость & Co' } };
            return {
                текстом: имяУчастникаТекстом('к', заявки, игроки),
                оформленно: getPublicTeamName('к', заявки, игроки, false, false),
                одиночка: имяУчастникаТекстом('к', null, игроки),
                нетИгрока: имяУчастникаТекстом('нетТакого', null, игроки),
                пустойИд: имяУчастникаТекстом('', null, игроки)
            };
        });
        /* ДОМ ОТДАЁТ ДАННЫЕ: ни экранирования, ни разметки. */
        expect(д.текстом).toEqual({ текст: 'Ким & Ли / Гость & Co', пара: true });
        expect(д.одиночка).toEqual({ текст: 'Ким & Ли', пара: false });
        /* ОФОРМЛЕННАЯ ОТДАЧА — ровно то же, что было до куска 176: знак в
           знак, потому что её кладут в `innerHTML` четыре зовущих. */
        expect(д.оформленно).toBe('<span class="td-team-name">Ким &amp; Ли / Гость &amp; Co</span>');
        /* УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ: нет человека — `TBD`, нет и
           самого слота — `BYE`. Это решение Кости 02.10. */
        expect(д.нетИгрока.текст).toBe('TBD');
        expect(д.пустойИд.текст).toBe('BYE');
    });

    test('сетка не ходит в базу за именем', async ({ page }) => {
        const ошибки = [];
        page.on('pageerror', e => ошибки.push(String(e.message)));
        await стенд(page);
        /* Заглушка базы на стенде ПАДАЕТ на любом обращении. Пустой список
           ошибок значит, что сетка собрала имена из переданных данных. */
        expect(ошибки, 'сетка полезла в базу или упала').toEqual([]);
    });

    Object.entries(СТРАНИЦЫ).forEach(([язык, адрес]) => {
        test('боевая страница ' + язык + ': парная сетка без разметки текстом', async ({ page }) => {
            await page.goto(adres(адрес, ПАРНЫЙ));
            await page.waitForSelector('.td-player-name', { timeout: 20000 });
            const тексты = await page.$$eval('.td-player-name', эл => эл.map(э => э.textContent.trim()));
            expect(тексты.length).toBeGreaterThan(0);
            expect(тексты.filter(т => /<span|class="td-/.test(т)), 'разметка текстом на ' + язык).toEqual([]);
            expect(тексты.filter(т => /&(amp|lt|gt|quot|#39);/.test(т)), 'двойное экранирование на ' + язык).toEqual([]);
        });

        test('боевая страница ' + язык + ': метки слотов на месте', async ({ page }) => {
            await page.goto(adres(адрес, СЛОТЫ));
            await page.waitForSelector('.td-player-name', { timeout: 20000 });
            const метки = await page.$$eval('.td-slot-wait', эл => эл.map(э => э.textContent.trim()));
            expect(метки.length, 'метки слотов исчезли из клеток').toBeGreaterThan(0);
            expect(метки.filter(м => /</.test(м)), 'метка показана тегом').toEqual([]);
        });
    });
});

function adres(страница, турнир) {
    return страница + '?id=' + турнир + '&tab=bracket';
}
