// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-VYZOV: вызов на баттл — один дом.
 *
 * ЭТО БЫЛА ПОЛОМКА, И ДОКАЗЫВАЕТ ЕЁ ОГРАНИЧЕНИЕ САМОЙ БАЗЫ:
 * `challenges_status_check` допускает `active`, `negotiating`,
 * `countered`, `accepted`, `declined`, `expired`, `completed`,
 * `cancelled` — **`pending` там нет**. Приложение писало в таблицу
 * НАПРЯМУЮ именно статусом `pending`: база отклоняла вставку, и человек
 * получал ошибку при каждом нажатии «Вызвать». И вставка шла мимо
 * восьми проверок серверной функции `create-challenge`.
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож читает файлы: он видит,
 * что прямой вставки больше нет и что живые статусы совпадают с
 * ограничением базы. Он НЕ ВИДИТ, что уходит в сеть и что дом отдаёт на
 * каждый код отказа. Это работа прогона.
 *
 * НИ БАЗУ, НИ ФУНКЦИЮ ТЕСТ НЕ ЗОВЁТ: `fetch` подменяется на время и
 * возвращается на место, клиент подставной. Так проверяется, что зов
 * идёт ОТ ИМЕНИ человека и с нужным телом — и что без сессии сервер не
 * зовут вовсе.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/player.html' },
    { язык: 'en', адрес: '/pages/player-en.html' },
    { язык: 'kg', адрес: '/pages/player-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождаться(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => window.KSLT_VYZOV && window.KSLT_VHOD &&
              typeof window.KSLT_VYZOV.создать === 'function',
        null, { timeout: 20000 });
    return ошибки;
}

function снять(page) {
    return page.evaluate(async () => {
        const V = window.KSLT_VYZOV;
        const былFetch = window.fetch;
        let поймано = [];
        const отвечать = (тело, ok, status) => {
            window.fetch = (u, o) => {
                поймано.push({ u: String(u), o });
                return Promise.resolve({
                    ok: ok !== false, status: status || 200,
                    text: () => Promise.resolve(тело)
                });
            };
        };
        const клиент = (токен) => ({
            auth: { getSession: () => Promise.resolve({ data: { session: токен ? { access_token: токен } : null } }) }
        });

        const былErr = console.error;
        console.error = () => {};
        const итог = {};
        try {
            итог.живые = V.ЖИВЫЕ.slice();

            поймано = []; отвечать('{"success":true,"challenge_id":"C1"}');
            итог.создан = await V.создать(клиент('TOK'), 'P2', '  привет  ');
            итог.зов = { u: поймано[0].u, токен: поймано[0].o.headers.Authorization,
                         тело: JSON.parse(поймано[0].o.body) };

            поймано = []; отвечать('{"success":true,"challenge_id":"C2"}');
            await V.создать(клиент('TOK'), 'P2', '   ');
            итог.безСообщения = JSON.parse(поймано[0].o.body);

            /* ВОСЕМЬ КОДОВ ОТКАЗА — каждый в свой ключ. */
            итог.отказы = {};
            const коды = ['not_logged_in', 'no_player', 'opponent_not_found', 'self_challenge',
                          'not_member', 'too_many_pending', 'already_pending', 'match_pending', 'чужое'];
            for (const к of коды) {
                отвечать('{"error":"' + к + '"}', false, 409);
                итог.отказы[к] = (await V.создать(клиент('TOK'), 'P2', ''))['ключ'];
            }

            поймано = [];
            итог.безСессии = { итог: await V.создать(клиент(null), 'P2', ''), зовов: поймано.length };

            /* «ВЫЗОВ УЖЕ ЕСТЬ» — в обе стороны, по статусам из базы. */
            const запросы = [];
            const баз = (строки) => ({
                from: () => ({ select: () => ({ or: (у) => { запросы.push(у); return { in: () => ({ limit: () => Promise.resolve({ data: строки }) }) }; } }) })
            });
            итог.висит = await V.занят(баз([{ status: 'active' }]), 'A', 'B');
            итог.принят = await V.занят(баз([{ status: 'accepted' }]), 'A', 'B');
            итог.пусто = await V.занят(баз([]), 'A', 'B');
            итог.себя = await V.занят(баз([{ status: 'active' }]), 'A', 'A');
            итог.обеСтороны = [
                (запросы[0] || '').indexOf('challenger_player_id.eq.A') !== -1,
                (запросы[0] || '').indexOf('challenger_player_id.eq.B') !== -1
            ];
        } finally {
            window.fetch = былFetch;
            console.error = былErr;
        }
        return итог;
    });
}

function проверить(д) {
    // ТА САМАЯ БЕДА: статуса `pending` в живых нет
    expect(д.живые, 'живые статусы — ровно те, что есть в ограничении базы')
        .toEqual(['active', 'accepted']);
    expect(д.живые, 'статуса `pending` в базе нет вовсе').not.toContain('pending');

    expect(д.создан).toEqual({ 'ок': true, 'вызов': 'C1' });
    expect(д.зов.u, 'зовётся серверная функция, а не таблица')
        .toContain('/functions/v1/create-challenge');
    expect(д.зов.токен, 'зов идёт ОТ ИМЕНИ человека').toBe('Bearer TOK');
    expect(д.зов.тело).toEqual({ opponent_player_id: 'P2', message: 'привет' });
    expect(д.безСообщения, 'пустое сообщение в тело не кладётся')
        .toEqual({ opponent_player_id: 'P2' });

    expect(д.отказы, 'каждый код отказа — своя причина, а не общее «ошибка»').toEqual({
        not_logged_in: 'chalLogin',
        no_player: 'chalNoPlayer',
        opponent_not_found: 'chalNoPlayer',
        self_challenge: 'chalSelf',
        not_member: 'chalNotMember',
        too_many_pending: 'chalLimit',
        already_pending: 'chalExists',
        match_pending: 'chalMatchSet',
        'чужое': 'chalError'
    });

    expect(д.безСессии.итог['ключ']).toBe('chalLogin');
    expect(д.безСессии.зовов, 'без сессии сервер не зовут вовсе').toBe(0);

    expect(д.висит).toEqual({ 'есть': true, 'вид': 'ждёт' });
    expect(д.принят).toEqual({ 'есть': true, 'вид': 'матч' });
    expect(д.пусто).toEqual({ 'есть': false, 'вид': '' });
    expect(д.себя, 'сам себя не проверяем').toEqual({ 'есть': false, 'вид': '' });
    expect(д.обеСтороны, 'вызов ищется В ОБЕ СТОРОНЫ: приложение смотрело в одну')
        .toEqual([true, true]);
}

test.describe('Вызов на баттл — один дом', () => {

    for (const с of СТРАНИЦЫ) {
        test('страница игрока · ' + с.язык, async ({ page }) => {
            const ошибки = await дождаться(page, с.адрес);
            проверить(await снять(page));
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('в приложении то же самое — и поломки больше нет', async ({ page }) => {
        const ошибки = await дождаться(page, ПРИЛОЖЕНИЕ);
        проверить(await снять(page));
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    test('в коде, который отдают страницы, нет прямой записи вызова', async ({ page }) => {
        await дождаться(page, ПРИЛОЖЕНИЕ);
        const найдено = await page.evaluate(async () => {
            const пути = ['js/screens/player-detail.js', 'js/kslt-vyzov.js'];
            const из = {};
            for (const п of пути) {
                const т = await (await fetch(п)).text();
                const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
                из[п] = {
                    pending: (безКом.match(/status:\s*'pending'/g) || []).length,
                    вставок: (безКом.match(/from\('challenges'\)\s*\.insert/g) || []).length
                };
            }
            return из;
        });
        for (const п of Object.keys(найдено)) {
            expect(найдено[п].pending, 'статус `pending` в ' + п).toBe(0);
            expect(найдено[п].вставок, 'прямая вставка вызова в ' + п).toBe(0);
        }
    });
});
