// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-BATTLE-APP: экран баттла в приложении — карта и отменённый баттл.
 *
 * ЧТО БЫЛО, ИЗМЕРЕНО ЧТЕНИЕМ.
 *   1. Отменённый баттл открывался КАК ЖИВОЙ — с кнопками голосования.
 *      Ни один список баттлов не фильтрует по статусу (приложение
 *      `screens/home.js:129` и `screens/battles.js:29`, сайт
 *      `js/battles-overview.js:253`), значит отменённый остаётся в
 *      ленте. Сайт показывает «Баттл отменён», приложение — нет. И
 *      сервер такой голос ПРИНИМАЛ: `cast_battle_vote` смотрит
 *      `battle_published`, `voting_closed` и время матча, а статус не
 *      смотрит вовсе.
 *   2. Карты не было, хотя данные были: `get_battle_public` отдаёт
 *      `court_google_maps` и `court_twogis`, а приложение не читало их
 *      ни разу.
 *
 * ПОЧЕМУ ЭТО ПРОВЕРЯЕТСЯ ПРОГОНОМ, А НЕ ТОЛЬКО СТОРОЖЕМ. Сторож читает
 * файлы: он видит, что ветка отмены стоит ДО отрисовки и что адрес
 * собирает дом. Он НЕ ВИДИТ, что вышло на экран: есть ли кнопки
 * голосования, встал ли iframe, какой у него адрес.
 *
 * НИ БАЗУ, НИ СЕРВЕР ТЕСТ НЕ ЗОВЁТ И НИЧЕГО НЕ ПИШЕТ. `rpc` подменяется
 * на время и возвращается на место; баттлы выдуманные. Так проверяется
 * и то, что на отменённом баттле голосование НЕ ЗАПРАШИВАЕТСЯ вовсе —
 * это наблюдаемо только по отсутствию зова.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';
const ЯЗЫКИ = ['ru', 'en', 'kg'];

async function дождаться(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() =>
        window.KSLT_HOME && typeof window.KSLT_HOME.openBattleDetail === 'function' &&
        window.KSLT_I18N && window.KSLT_KARTA, null, { timeout: 20000 });
    return ошибки;
}

/**
 * Открыть выдуманный баттл и снять, что получилось.
 * `rpc` подменяется и возвращается на место в `finally`.
 */
function открыть(page, баттл, язык) {
    return page.evaluate(async ({ баттл, язык }) => {
        const было = window.supabaseClient.rpc;
        const зовы = [];
        window.supabaseClient.rpc = function (имя, доводы) {
            зовы.push(имя);
            if (имя === 'get_battle_public') return Promise.resolve({ data: баттл });
            if (имя === 'get_battle_votes') return Promise.resolve({ data: [] });
            return Promise.resolve({ data: null });
        };
        /* ЯЗЫК СТАВИТСЯ `setLang`, А НЕ `set` (04.11).
           Здесь стояло `if (window.KSLT_I18N.set) ... .set(язык)`, а
           метода `set` у дома слов НЕТ вовсе — он зовётся `setLang`
           (`mobile/www/js/i18n.js:1060`). Условие было ложно всегда,
           язык не переключался, и три «языка» этого файла проверяли один
           и тот же: проверка «у отмены есть слово на этом языке» три
           раза смотрела на русское слово.
           ПРОБА, ЗАЩИЩЁННАЯ `if`, МОЛЧА ПРОПУСКАЕТ САМУ СЕБЯ — поэтому
           здесь не `if`, а отказ с именем. */
        if (typeof window.KSLT_I18N.setLang !== 'function') {
            throw new Error('у дома слов нет setLang — проба проверяла бы один язык трижды');
        }
        window.KSLT_I18N.setLang(язык);

        try {
            window.KSLT_HOME.openBattleDetail(баттл.id);
            await new Promise(r => setTimeout(r, 300));

            const окно = document.getElementById('battleOverlay');
            const тело = document.getElementById('battleDetail');
            const карта = тело.querySelector('.bd-map iframe');
            const ссылки = [...тело.querySelectorAll('.bd-map-link')]
                .map(a => ({ текст: a.textContent.trim(), адрес: a.getAttribute('href'),
                             новое: a.getAttribute('target') === '_blank' }));
            return {
                открыто: окно.classList.contains('open'),
                отмена: !!тело.querySelector('.bd-cancelled'),
                словоОтмены: (tекст => tекст)(
                    (тело.querySelector('.bd-cancelled h2') || {}).textContent || ''),
                кнопокГолоса: тело.querySelectorAll('#bdVoteBtn1, #bdVoteBtn2').length,
                сторон: тело.querySelectorAll('.bd-vs').length,
                блокКарты: !!тело.querySelector('.bd-map-box'),
                заголовокКарты: (тело.querySelector('.bd-map-box .bd-section-title') || {})
                    .textContent || '',
                ссылки: ссылки,
                картаАдрес: карта ? карта.getAttribute('src') : null,
                картаЛениво: карta_(карта),
                зовы: зовы
            };
            function карta_(к) { return к ? к.getAttribute('loading') : null; }
        } finally {
            window.supabaseClient.rpc = было;
            const окно = document.getElementById('battleOverlay');
            окно.classList.remove('open');
            document.getElementById('battleDetail').innerHTML = '';
        }
    }, { баттл, язык });
}

const ЖИВОЙ = {
    id: '00000000-0000-0000-0000-0000000000a1',
    status: 'accepted',
    voting_closed: false,
    battle_title: 'Проба карты',
    challenger_name: 'Игрок А', opponent_name: 'Игрок Б',
    challenger_player_id: 'p1', opponent_player_id: 'p2',
    proposed_date: '2026-12-01', proposed_time: '18:00',
    proposed_venue: 'Корты у Ала-Арчи',
    court_google_maps: 'https://www.google.com/maps/place/Ala+Archa+Courts/@42.8746,74.6122,17z',
    court_twogis: 'https://2gis.kg/bishkek/geo/70000001006186201/74.612200%2C42.874600'
};

const ОТМЕНЁННЫЙ = Object.assign({}, ЖИВОЙ, {
    id: '00000000-0000-0000-0000-0000000000a2',
    status: 'cancelled'
});

const БЕЗ_КОРТА = Object.assign({}, ЖИВОЙ, {
    id: '00000000-0000-0000-0000-0000000000a3',
    court_google_maps: null,
    court_twogis: null
});

test.describe('Экран баттла приложения — карта и отменённый баттл', () => {

    for (const язык of ЯЗЫКИ) {
        test('отменённый баттл не доходит до голосования · ' + язык,
            async ({ page }) => {
            const ошибки = await дождаться(page);
            const д = await открыть(page, ОТМЕНЁННЫЙ, язык);

            expect(д.открыто, 'накладка открывается — человек видит ответ').toBe(true);
            expect(д.отмена, 'показан экран отмены, а не живой баттл').toBe(true);
            expect(д.словоОтмены.length, 'и у него есть слово на этом языке')
                .toBeGreaterThan(3);
            expect(д.кнопокГолоса, 'КНОПОК ГОЛОСОВАНИЯ НЕТ — сервер такой голос принял бы')
                .toBe(0);
            expect(д.сторон, 'и самого баттла тоже нет: это отдельный экран').toBe(0);
            expect(д.блокКарты, 'карты у отменённого баттла нет').toBe(false);
            expect(д.зовы.filter(и => и === 'get_battle_my_vote').length,
                'и свой голос не запрашивается вовсе').toBe(0);
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    for (const язык of ЯЗЫКИ) {
        test('карта места: обе ссылки и встроенная карта · ' + язык,
            async ({ page }) => {
            const ошибки = await дождаться(page);
            const д = await открыть(page, ЖИВОЙ, язык);

            expect(д.отмена, 'живой баттл — не экран отмены').toBe(false);
            expect(д.блокКарты, 'блок карты есть').toBe(true);
            expect(д.заголовокКарты.length, 'у блока есть заголовок на этом языке')
                .toBeGreaterThan(2);

            expect(д.ссылки.length, 'две ссылки: Google и 2ГИС').toBe(2);
            expect(д.ссылки[0].адрес, 'ссылка Google ведёт туда, где её вписали')
                .toBe(ЖИВОЙ.court_google_maps);
            expect(д.ссылки[1].адрес, 'ссылка 2ГИС — тоже').toBe(ЖИВОЙ.court_twogis);
            expect(д.ссылки.every(с => с.новое),
                'обе открываются новым окном: уход из приложения — это потеря места')
                .toBe(true);

            /* КООРДИНАТЫ ВЗЯТЫ ИЗ `@` ССЫЛКИ ДОМОМ, а не собраны на месте. */
            expect(д.картаАдрес, 'встроенная карта стоит по координатам из ссылки')
                .toBe('https://maps.google.com/maps?q=42.8746,74.6122&output=embed');
            expect(д.картаЛениво, 'карта грузится лениво: она ниже первого экрана')
                .toBe('lazy');
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('без ссылок на корт блока карты нет вовсе', async ({ page }) => {
        const ошибки = await дождаться(page);
        const д = await открыть(page, БЕЗ_КОРТА, 'ru');
        expect(д.блокКарты, 'пустая рамка хуже отсутствия блока').toBe(false);
        expect(д.картаАдрес, 'и iframe не создаётся').toBe(null);
        expect(д.сторон, 'а сам баттл рисуется как обычно').toBe(1);
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    /**
     * ДОМ КАРТЫ — ТОТ ЖЕ, ЧТО У САЙТА, И ЗНАЕТ ЧЕТЫРЕ ВИДА ССЫЛОК.
     * Проверяется в приложении: именно здесь дома раньше не было вовсе,
     * и именно здесь копия разошлась бы первой.
     */
    test('дом карты разбирает все четыре вида ссылок и 2ГИС', async ({ page }) => {
        await дождаться(page);
        const д = await page.evaluate(() => {
            const K = window.KSLT_KARTA;
            return {
                встроенная: K.встроить('https://www.google.com/maps/embed?pb=1'),
                запрос: K.встроить('https://www.google.com/maps?q=Bishkek+Court'),
                координаты: K.встроить('https://www.google.com/maps/@42.8746,74.6122,17z'),
                место: K.встроить('https://www.google.com/maps/place/Ala+Archa+Courts/'),
                короткая: K.встроить('https://maps.app.goo.gl/abcdef'),
                короткаяСАдресом: K.встроить('https://maps.app.goo.gl/abcdef', 'Бишкек, Ала-Арча'),
                гис: K.встроить('https://2gis.kg/bishkek/geo/700/74.612200%2C42.874600/'),
                чужая: K.встроить('https://example.com/map'),
                пусто: K.встроить('')
            };
        });

        expect(д.встроенная, 'готовую встроенную ссылку дом отдаёт как есть')
            .toBe('https://www.google.com/maps/embed?pb=1');
        expect(д.запрос).toBe('https://maps.google.com/maps?q=Bishkek+Court&output=embed');
        expect(д.координаты).toBe('https://maps.google.com/maps?q=42.8746,74.6122&output=embed');
        expect(д.место, 'в имени места «+» становится пробелом')
            .toBe('https://maps.google.com/maps?q=Ala%20Archa%20Courts&output=embed');
        expect(д.короткая, 'в короткой ссылке координат нет — честный null, а не карта наугад')
            .toBe(null);
        expect(д.короткаяСАдресом, 'с адресом-запасом карта строится по адресу')
            .toBe('https://maps.google.com/maps?q=%D0%91%D0%B8%D1%88%D0%BA%D0%B5%D0%BA%2C%20%D0%90%D0%BB%D0%B0-%D0%90%D1%80%D1%87%D0%B0&output=embed');
        expect(д.гис, 'У 2ГИС долгота и широта В ОБРАТНОМ ПОРЯДКЕ — дом это знает')
            .toBe('https://maps.google.com/maps?q=42.874600,74.612200&output=embed');
        expect(д.чужая, 'чужой адрес — не карта').toBe(null);
        expect(д.пусто, 'пусто и без запаса — тоже null').toBe(null);
    });
});
