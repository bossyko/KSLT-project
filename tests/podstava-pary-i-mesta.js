/**
 * ПОДСТАВНЫЕ ДАННЫЕ ПАРНОГО ТУРНИРА С ДВУМЯ ЛИГАМИ (08.11).
 *
 * ЗАЧЕМ ОТДЕЛЬНАЯ ПОДСТАВА. Первая редакция пробы ходила на БОЕВОЙ турнир
 * `6c6a7913` и падала целиком — 51 проверка из 55. След показал «Турнир не
 * найден»: прогон идёт против ТЕСТОВОЙ базы (`tests/fixtures.js`
 * подставляет её адрес перед каждой страницей), а боевого турнира там нет
 * и быть не должно.
 * ПРОБА ВИДИТ ТОЛЬКО ТО, ЧТО ЕСТЬ В ДАННЫХ — и данные ей надо дать, а не
 * надеяться, что они где-то лежат.
 *
 * Приём взят у `tests/podstava-setki.js` знак в знак: перехват на уровне
 * СЕТИ (`page.route`), ответы строками REST. Рисует при этом НАСТОЯЩИЙ код
 * продукта — `js/tournament-detail.js`, а не копия.
 *
 * РАСКЛАД КРАЙНИЙ, А НЕ УДОБНЫЙ:
 *   · турнир ПАРНЫЙ (`format: 'doubles'`) и НЕРЕЙТИНГОВЫЙ (`friendly`) —
 *     ровно тот случай, где раздел мест сносился вместе с вкладкой;
 *   · лиг ДВЕ, у каждой свой финал и свой победитель — пьедесталов два;
 *   · у высшей лиги матч за третье место сыгран, у утешительной ОТМЕНЁН —
 *     бронза есть не везде, и это разные ветки кода;
 *   · фамилии длинные НАРОЧНО: имя пары рвётся первым, и ровно на нём
 *     беда и жила — на десктопе второе имя обрезалось целиком.
 *
 * `tournament_results` отдаём ПУСТЫМ: очки за парные не начисляются, и
 * таблица в разделе мест появиться не должна. Если дверь в
 * `показатьРаскладкуОчков` снимут, проба это увидит.
 */

const ТУРНИР = 'proba-pary-mesta';

/* Капитаны и напарники: восемь пар. Имена длинные — перенос ломается
   первым на узких видах, и проверять надо на них. */
const ПАРЫ = [
    ['pm-1', 'Абдырахманова Эракыым', 'pm-1p', 'Кошойбекова Гульмира'],
    ['pm-2', 'Сейдиматов Искендер',   'pm-2p', 'Турдубекова Мээрим'],
    ['pm-3', 'Мураталиев Ильдияр',    'pm-3p', 'Джумабаева Анастасия'],
    ['pm-4', 'Байгубатова Зарима',    'pm-4p', 'Орозбаева Валерия'],
    ['pm-5', 'Кыдралиев Жанат',       'pm-5p', 'Тайгурова Калича'],
    ['pm-6', 'Бейшеналиев Салман',    'pm-6p', 'Муралиева Зухра'],
    ['pm-7', 'Табалдиев Раимбек',     'pm-7p', 'Казыбаева Айнель'],
    ['pm-8', 'Фасахутдинова Алина',   'pm-8p', 'Момунова Нуриза']
];

function человек(id, имя, i) {
    return {
        id: id, name: имя, name_en: имя, name_kg: имя,
        photo: null, country: '🇰🇬', category_id: 'friendly',
        points: 0, wins: 0, losses: 0, rank_change: 0,
        form: [], gender: 'women', ntrp_singles: null, ntrp_doubles: 3,
        is_guest: false, is_member: true, has_account: false
    };
}

function игроки() {
    const из = [];
    ПАРЫ.forEach(function (п, i) {
        из.push(человек(п[0], п[1], i));
        из.push(человек(п[2], п[3], i));
    });
    return из;
}

/* ЗАЯВКА — ЭТО ПАРА. Имя участника собирается из капитана и `partner_id`:
   так устроен дом `имяУчастникаТекстом`, и подстава обязана давать данные
   в том же виде, иначе проба проверяла бы не продукт, а себя. */
function заявки() {
    return ПАРЫ.map(function (п, i) {
        return {
            id: 'regpm-' + i, tournament_id: ТУРНИР, player_id: п[0],
            status: 'draw', seed_number: i < 4 ? i + 1 : null,
            draw_position: i + 1, group_number: (i % 2) + 1,
            registered_at: '2026-11-07T07:0' + i + ':00+00:00',
            seat_pool: 'online', is_external: false, external_name: null,
            partner_id: п[2], partner_external_name: null, review_reasons: []
        };
    });
}

function турнир() {
    return [{
        id: ТУРНИР,
        name: 'Проба: парный с двумя лигами',
        name_en: 'Proba: doubles two leagues',
        name_kg: 'Проба: жуптук эки лига',
        description: '', description_en: '', description_kg: '',
        date_start: '2026-11-07', date_end: '2026-11-07',
        start_time: '09:00',
        registration_start: '2026-11-01', registration_end: '2026-11-06',
        status: 'completed',
        bracket_type: 'group_league',
        group_count: 2,
        format: 'doubles',
        category_id: 'friendly',
        gender: 'women',
        max_participants: 8,
        entry_fee: 0,
        court_id: null,
        poster: null,
        draw_seed: 1,
        is_published: true
    }];
}

function матч(о) {
    return {
        id: о.id, tournament_id: ТУРНИР,
        round: о.round, round_number: о.rn, match_order: о.order,
        player1_id: о.p1 || null, player2_id: о.p2 || null,
        reg1_id: null, reg2_id: null,
        score: о.score || null, winner_id: о.w || null,
        status: о.status || 'completed',
        played_at: '2026-11-07T10:00:00+00:00',
        group_number: о.группа || null,
        seed1: null, seed2: null,
        slot1_label: null, slot2_label: null,
        court: null, scheduled_time: null, scheduled_day: null,
        score_status: null, score_submitted_by: null,
        score_submitted_at: null, score_confirmed_at: null,
        match_type: null
    };
}

/* Две группы по четыре пары, все матчи сыграны: сетки лиг собраны. */
function матчиГрупп() {
    const из = [];
    let n = 0;
    [1, 2].forEach(function (гр) {
        const свои = ПАРЫ.filter(function (_, i) { return (i % 2) + 1 === гр; });
        for (let a = 0; a < свои.length; a++) {
            for (let b = a + 1; b < свои.length; b++) {
                n++;
                из.push(матч({
                    id: 'gpm-' + n, round: 'G' + гр, rn: 1, order: n,
                    p1: свои[a][0], p2: свои[b][0],
                    score: '6/' + (b + 1), w: свои[a][0], группа: гр
                }));
            }
        }
    });
    return из;
}

/* ВЫСШАЯ ЛИГА: полуфиналы, финал и матч за третье место — бронза ЕСТЬ.
   УТЕШИТЕЛЬНАЯ: тот же набор, но матч за третье ОТМЕНЁН — бронзы нет.
   Две разные ветки пьедестала проверяются одним раскладом. */
function матчиЛиг() {
    return [
        матч({ id: 'pl-sf1', round: 'PL-SF', rn: 1, order: 1, p1: 'pm-1', p2: 'pm-3', score: '6/4', w: 'pm-1' }),
        матч({ id: 'pl-sf2', round: 'PL-SF', rn: 1, order: 2, p1: 'pm-5', p2: 'pm-7', score: '6/3', w: 'pm-5' }),
        матч({ id: 'pl-f',   round: 'PL-F',  rn: 2, order: 1, p1: 'pm-1', p2: 'pm-5', score: '6/2', w: 'pm-1' }),
        матч({ id: 'pl-3rd', round: 'PL-3RD', rn: 2, order: 2, p1: 'pm-3', p2: 'pm-7', score: '6/1', w: 'pm-3' }),

        матч({ id: 'cl-sf1', round: 'CL-SF', rn: 1, order: 1, p1: 'pm-2', p2: 'pm-4', score: '6/5', w: 'pm-2' }),
        матч({ id: 'cl-sf2', round: 'CL-SF', rn: 1, order: 2, p1: 'pm-6', p2: 'pm-8', score: '6/0', w: 'pm-6' }),
        матч({ id: 'cl-f',   round: 'CL-F',  rn: 2, order: 1, p1: 'pm-2', p2: 'pm-6', score: '6/4', w: 'pm-2' }),
        матч({ id: 'cl-3rd', round: 'CL-3RD', rn: 2, order: 2, p1: 'pm-4', p2: 'pm-8', score: null, w: null, status: 'cancelled' })
    ];
}

async function подставить(page) {
    const ответ = {
        tournaments: турнир(),
        matches: матчиГрупп().concat(матчиЛиг()),
        tournament_registrations: заявки(),
        players: игроки(),
        players_public: игроки(),
        tournament_results: [],
        courts: [],
        profiles: []
    };

    await page.route('**/rest/v1/**', function (route) {
        const req = route.request();
        const путь = new URL(req.url()).pathname;
        const таблица = путь.split('/rest/v1/')[1].split('?')[0];
        const строки = Object.prototype.hasOwnProperty.call(ответ, таблица) ? ответ[таблица] : [];

        /* `.single()` ЖДЁТ ОБЪЕКТ, А НЕ МАССИВ — и ноль строк для него это
           406, как у настоящей базы. Приём и причина записаны в
           `tests/podstava-setki.js`: подстава, отвечавшая массивом на всё,
           однажды положила прогон целиком. */
        const accept = String(req.headers()['accept'] || '');
        const одна = accept.indexOf('vnd.pgrst.object') !== -1;

        if (одна) {
            if (!строки.length) {
                return route.fulfill({
                    status: 406,
                    contentType: 'application/json',
                    headers: { 'access-control-allow-origin': '*' },
                    body: JSON.stringify({ code: 'PGRST116', message: 'строк нет' })
                });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/vnd.pgrst.object+json',
                headers: { 'access-control-allow-origin': '*' },
                body: JSON.stringify(строки[0])
            });
        }

        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: JSON.stringify(строки)
        });
    });
}

module.exports = { подставить, ТУРНИР, ПАРЫ };
