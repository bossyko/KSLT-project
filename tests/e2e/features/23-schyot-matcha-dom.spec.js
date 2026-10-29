// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-SCHYOT-DOM: счёт матча — один дом на сайт и приложение (кусок A3.7г).
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Заморозка читает файл как текст:
 * она видит, что в коде написано `KSLT_SCHYOT_MATCHA.сетов`, и не видит,
 * доехал ли дом до страницы, объявился ли он к моменту нажатия и что
 * отдаёт на самом деле. Это работа прогона.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ — И НЕ МОЖЕТ. Дому подсовывается ПОДСТАВНОЙ клиент:
 * его `rpc` ничего никуда не отправляет, а только запоминает, чем его
 * позвали. Так проверяется главное обещание дома: при равных геймах в
 * сете он НЕ ЗОВЁТ базу вовсе — ноль зовов, а не «зов и отказ».
 *
 * ТРИ ЯЗЫКА. Страница турнира открывается на всех трёх, и на каждой
 * проверяется, что дом доехал. Словарь слов — чистая функция, поэтому его
 * полнота меряется по всем трём языкам сразу: у КАЖДОГО ключа, который
 * дом умеет отдать, должно быть непустое слово. Пустое слово здесь — это
 * ровно та беда, из-за которой кусок и делался: в приложении не было
 * ветки `tied_set`, и человек видел общее «не удалось сохранить счёт».
 *
 * ПЯТЬ ВИДОВ приходят из пяти проектов конфига, а не из сжатия окна.
 */

/* Ключи, которые дом умеет отдать. Список здесь нарочно свой: если дом
   завёл новый ключ и забыл слово, тест обязан упасть, а не согласиться. */
const КЛЮЧИ = ['errOwn', 'errFinal', 'errNotPlayer', 'errNoWinner', 'errBad', 'err'];

/* Турнира с таким номером нет — и это НАРОЧНО: страница доходит до
   устойчивого «Турнир не найден», а все файлы к этому моменту уже
   подключены. Так дом проверяется без зависимости от строки в базе
   (тот же приём, что в `56-stranica-turnira.spec.js`). */
const НЕТ_ТАКОГО = '00000000-0000-0000-0000-000000000000';

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/tournament.html?id=' + НЕТ_ТАКОГО },
    { язык: 'en', адрес: '/pages/tournament-en.html?id=' + НЕТ_ТАКОГО },
    { язык: 'kg', адрес: '/pages/tournament-kg.html?id=' + НЕТ_ТАКОГО }
];

/** Дождаться ПРИЗНАКА — объявленного дома, а не тишины сети. */
async function дождатьсяДома(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForFunction(
            () => window.KSLT_SCHYOT_MATCHA && window.KSLT_RULES && window.KSLT_RULES.buildScore,
            null, { timeout: 20000 });
    } catch (e) {
        throw new Error('дом счёта не объявился на ' + адрес +
            ' · ошибки страницы: ' + (ошибки.length ? ошибки.join(' | ') : 'нет'));
    }
    return ошибки;
}

/** Снять с ЖИВОГО дома всё, что проверяет этот файл. */
function снятьДом(page) {
    return page.evaluate(async () => {
        const SM = window.KSLT_SCHYOT_MATCHA;

        /* ПОДСТАВНОЙ КЛИЕНТ: ничего не пишет, только запоминает зовы. */
        const зовы = [];
        const клиент = { rpc: (имя, арг) => { зовы.push({ имя, арг }); return Promise.resolve({ data: { ok: true } }); } };

        const чисто = await SM.вписать(клиент, 'M-TEST', [['6', '3'], ['6', '4'], ['', '']], '2026-10-29');
        const зововПослеЧистого = зовы.length;
        const аргЧистого = зовы.length ? зовы[0].арг : null;

        зовы.length = 0;
        const равныйСет = await SM.вписать(клиент, 'M-TEST', [['6', '6'], ['', ''], ['', '']], null);
        const зововПослеРавного = зовы.length;

        зовы.length = 0;
        const да = await SM.ответить(клиент, 'M-TEST', true);
        const зовДа = зовы.length ? зовы[0].имя : null;
        зовы.length = 0;
        const нет = await SM.ответить(клиент, 'M-TEST', false);
        const зовНет = зовы.length ? зовы[0].имя : null;

        return {
            действия: ['сетов', 'собрать', 'ключОшибки', 'вписать', 'ответить']
                .filter(и => typeof SM[и] === 'function'),
            сетовКороткий: SM.сетов({ set_format: 'short' }),
            сетовОбычный: SM.сетов({ set_format: 'full' }),
            сетовБезТурнира: SM.сетов(null),
            ключи: {
                own_score: SM.ключОшибки('own_score'),
                already_final: SM.ключОшибки('already_final'),
                not_a_player: SM.ключОшибки('not_a_player'),
                no_winner: SM.ключОшибки('no_winner'),
                tied_set: SM.ключОшибки('tied_set'),
                bad_score: SM.ключОшибки('bad_score'),
                empty_score: SM.ключОшибки('empty_score'),
                чужое: SM.ключОшибки('ну-ка-что-это')
            },
            чисто, зововПослеЧистого, аргЧистого,
            равныйСет, зововПослеРавного,
            да, зовДа, нет, зовНет
        };
    });
}

test.describe('Счёт матча — один дом', () => {

    for (const с of СТРАНИЦЫ) {
        test('дом доехал до страницы турнира · ' + с.язык, async ({ page }) => {
            const ошибки = await дождатьсяДома(page, с.адрес);
            const д = await снятьДом(page);

            expect(д.действия, 'все пять действий дома на месте').toEqual(
                ['сетов', 'собрать', 'ключОшибки', 'вписать', 'ответить']);

            expect(д.сетовКороткий, 'короткий формат — два сета').toBe(2);
            expect(д.сетовОбычный, 'обычный формат — три сета').toBe(3);
            expect(д.сетовБезТурнира, 'без турнира — три сета').toBe(3);

            expect(д.ключи.own_score).toBe('errOwn');
            expect(д.ключи.already_final).toBe('errFinal');
            expect(д.ключи.not_a_player).toBe('errNotPlayer');
            expect(д.ключи.no_winner).toBe('errNoWinner');
            /* ТА САМАЯ ВЕТКА: три кода базы про негодный счёт — один ключ,
               и он один на сайт и приложение. */
            expect(д.ключи.tied_set).toBe('errBad');
            expect(д.ключи.bad_score).toBe('errBad');
            expect(д.ключи.empty_score).toBe('errBad');
            expect(д.ключи.чужое, 'незнакомый код — общее слово').toBe('err');

            expect(д.чисто, 'годный счёт уходит').toEqual({ 'ок': true });
            expect(д.зововПослеЧистого, 'годный счёт — один зов базы').toBe(1);
            expect(д.аргЧистого.p_score, 'счёт собрал дом правил').toBe('6/3 6/4');
            expect(д.аргЧистого.p_match_id).toBe('M-TEST');

            expect(д.равныйСет['ок'], 'равные геймы в сете не уходят').toBe(false);
            expect(д.равныйСет['ключ']).toBe('errBad');
            expect(д.зововПослеРавного, 'при равном сете базу НЕ ЗОВУТ вовсе').toBe(0);

            expect(д.зовДа, 'согласие — confirm').toBe('confirm_match_score');
            expect(д.зовНет, 'несогласие — dispute, а не отказ').toBe('dispute_match_score');

            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('у каждого ключа дома есть слово на всех трёх языках', async ({ page }) => {
        await дождатьсяДома(page, СТРАНИЦЫ[0].адрес);
        const слова = await page.evaluate((КЛЮЧИ) => {
            const T = window.KSLT_SCORE_TEXTS;
            if (!T) return { беда: 'словаря счёта нет на странице' };
            const из = {};
            for (const язык of ['ru', 'en', 'kg']) {
                const L = T.of(язык);
                из[язык] = КЛЮЧИ.filter(к => !L[к] || !String(L[к]).trim());
            }
            return из;
        }, КЛЮЧИ);

        expect(слова.беда, 'словарь счёта подключён').toBeUndefined();
        expect(слова.ru, 'русский: пустых слов нет').toEqual([]);
        expect(слова.en, 'английский: пустых слов нет').toEqual([]);
        expect(слова.kg, 'кыргызский: пустых слов нет').toEqual([]);
    });

    test('дом доехал до приложения, и полоску сообщения рисует одно место', async ({ page }) => {
        const ошибки = await дождатьсяДома(page, '/mobile/www/index.html');
        const д = await снятьДом(page);

        expect(д.действия).toEqual(['сетов', 'собрать', 'ключОшибки', 'вписать', 'ответить']);
        expect(д.ключи.tied_set, 'в приложении ветка равных геймов тоже есть').toBe('errBad');
        expect(д.зововПослеРавного, 'при равном сете базу НЕ ЗОВУТ вовсе').toBe(0);
        expect(д.зовНет).toBe('dispute_match_score');

        /* ОДНО УВЕДОМЛЕНИЕ НА ПРОДУКТ: вторая полоска окна счёта снята, и
           её правила в css больше нет. */
        const полоска = await page.evaluate(() => {
            let msa = 0, общая = 0;
            for (const л of Array.from(document.styleSheets)) {
                let правила = [];
                try { правила = Array.from(л.cssRules || []); } catch (e) { continue; }
                for (const п of правила) {
                    const с = п.selectorText || '';
                    if (/\.msa-toast\b/.test(с)) msa++;
                    if (/^\.toast\b/.test(с)) общая++;
                }
            }
            return { msa, общая, естьToast: !!(window.KSLT_APP && typeof window.KSLT_APP.toast === 'function') };
        });
        expect(полоска.msa, 'правила `.msa-toast` в css больше нет').toBe(0);
        expect(полоска.общая, 'общая полоска `.toast` на месте').toBeGreaterThan(0);
        expect(полоска.естьToast, 'её рисует `APP.toast`').toBe(true);

        expect(ошибки, 'страница без ошибок').toEqual([]);
    });
});
