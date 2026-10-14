/**
 * ПОДСТАВНЫЕ ДАННЫЕ СЕТКИ — ПОРЯДОК БЛОКОВ НЕ ДОЛЖЕН ЗАВИСЕТЬ ОТ БАЗЫ.
 *
 * Правило куска: порядок блоков — функция СОСТОЯНИЯ. Значит проверять его
 * надо на ДВУХ состояниях одного турнира, а не на том, что случайно лежит
 * в базе прогона. Завершённой круговой там нет вовсе (запись трекера), и
 * проба молча пропускалась бы — то есть не доказывала бы ничего.
 *
 * Перехват идёт на уровне СЕТИ: `page.route` отвечает на запросы REST
 * своими строками. Рисует при этом НАСТОЯЩИЙ код продукта —
 * `js/tournament-detail.js`, не копия.
 *
 * Расклады КРАЙНИЕ, а не удобные:
 *   'идёт'   — групповой этап сыгран наполовину, плей-офф пуст целиком:
 *              половина клеток без счёта, в сетке одни метки «A1», «B2»;
 *   'закрыт' — группы сыграны ВСЕ, плей-офф идёт: полуфинал со счётом,
 *              финал пустой. Это боевое состояние 153bc688 на 14.10.
 *
 * Имена длинные нарочно: перенос ломается первым на узких видах.
 */

const ТУРНИР = 'proba-krugovaya';

const ИГРОКИ = [
    ['pr-1', 'Кошойбеков Улан'],       ['pr-2', 'Сейдиматов Искендер'],
    ['pr-3', 'Мураталиев Ильдияр'],    ['pr-4', 'Абдырахманова Эракыым'],
    ['pr-5', 'Джумабаев Нурсултан'],   ['pr-6', 'Турдубекова Мээрим'],
    ['pr-7', 'Мамбеталиев Тилек'],     ['pr-8', 'Осмонова Айдай']
];

function игроки() {
    return ИГРОКИ.map(function (p, i) {
        return {
            id: p[0], name: p[1], name_en: p[1], name_kg: p[1],
            photo: null, country: '🇰🇬', category_id: 'futures',
            points: 100 - i * 7, wins: 0, losses: 0, rank_change: 0,
            form: [], gender: 'men', ntrp_singles: 3, ntrp_doubles: null,
            is_guest: false, is_member: true, has_account: false
        };
    });
}

function заявки() {
    return ИГРОКИ.map(function (p, i) {
        return {
            id: 'reg-' + i, tournament_id: ТУРНИР, player_id: p[0],
            status: 'approved', seed_number: i < 2 ? i + 1 : null,
            draw_position: i + 1, group_number: (i % 2) + 1,
            registered_at: '2026-10-13T15:0' + i + ':00+00:00',
            seat_pool: 'online', is_external: false, external_name: null,
            partner_id: null, review_reasons: []
        };
    });
}

/* Групповой этап: два круга по четыре человека, шесть матчей в каждом. */
function матчиГрупп(всеСыграны) {
    var из = [], n = 0;
    [1, 2].forEach(function (гр) {
        var свои = ИГРОКИ.filter(function (_, i) { return (i % 2) + 1 === гр; });
        for (var a = 0; a < свои.length; a++) {
            for (var b = a + 1; b < свои.length; b++) {
                n++;
                var сыгран = всеСыграны || n % 2 === 1;
                из.push({
                    id: 'm-g-' + n, tournament_id: ТУРНИР, group_number: гр,
                    round: null, round_number: null, match_order: n,
                    player1_id: свои[a][0], player2_id: свои[b][0],
                    winner_id: сыгран ? свои[a][0] : null,
                    score: сыгран ? '6:3, 6:4' : null,
                    status: сыгран ? 'completed' : 'scheduled',
                    court: 'Корт ' + гр, scheduled_time: '10:00:00', scheduled_day: 1,
                    played_at: сыгран ? '2026-10-13T11:00:00+00:00' : null,
                    created_at: '2026-10-13T09:00:00+00:00',
                    seed1: null, seed2: null, match_type: 'group', notified_at: null
                });
            }
        }
    });
    return из;
}

/* Плей-офф: полуфиналы и финал. Пока группы идут — пуст целиком. */
function матчиПлейофф(группыЗакрыты) {
    return [
        { id: 'm-p-1', tournament_id: ТУРНИР, group_number: null, round: 'SF',
          round_number: 1, match_order: 1,
          player1_id: группыЗакрыты ? 'pr-1' : null,
          player2_id: группыЗакрыты ? 'pr-4' : null,
          winner_id: группыЗакрыты ? 'pr-1' : null,
          score: группыЗакрыты ? '7:5, 6:2' : null,
          status: группыЗакрыты ? 'completed' : 'scheduled', court: null, scheduled_time: null, scheduled_day: 2,
          played_at: null, created_at: '2026-10-13T09:00:00+00:00', seed1: null, seed2: null,
          match_type: 'playoff', notified_at: null },
        { id: 'm-p-2', tournament_id: ТУРНИР, group_number: null, round: 'SF',
          round_number: 1, match_order: 2,
          player1_id: группыЗакрыты ? 'pr-3' : null,
          player2_id: группыЗакрыты ? 'pr-6' : null,
          winner_id: null, score: null, status: 'scheduled', court: null, scheduled_time: null, scheduled_day: 2,
          played_at: null, created_at: '2026-10-13T09:00:00+00:00', seed1: null, seed2: null,
          match_type: 'playoff', notified_at: null },
        { id: 'm-p-3', tournament_id: ТУРНИР, group_number: null, round: 'F',
          round_number: 2, match_order: 1,
          player1_id: группыЗакрыты ? 'pr-1' : null, player2_id: null,
          winner_id: null, score: null, status: 'scheduled', court: null, scheduled_time: null, scheduled_day: 2,
          played_at: null, created_at: '2026-10-13T09:00:00+00:00', seed1: null, seed2: null,
          match_type: 'playoff', notified_at: null }
    ];
}

function турнир() {
    /* ПОЛЯ СНЯТЫ ЧТЕНИЕМ БОЕВОЙ СТРОКИ, А НЕ ВЫДУМАНЫ. Первая редакция
       подставы перечисляла поля по памяти: не было `format`, `location`,
       `image`, `start_time` — и обложка выводила «NaN undefined NaN».
       Подстава, не повторяющая форму ответа, врёт так же, как неверные
       данные. */
    return [{
        id: ТУРНИР,
        title: 'Проба: круговой турнир с плей-оффом',
        title_en: 'Probe: round robin with playoff',
        title_kg: 'Сыноо: тегерек турнир',
        description: 'Проба порядка блоков.',
        description_en: 'Probe of block order.',
        description_kg: 'Блокторлордун ирети.',
        date_start: '2026-10-13', date_end: '2026-10-14',
        start_time: '10:00:00',
        registration_start: '2026-10-01', registration_end: '2026-10-12',
        location: 'Теннисный центр', location_en: 'Tennis centre',
        location_kg: 'Теннис борбору',
        category_id: 'futures', status: 'registration_closed',
        max_participants: 8, prize_fund: null,
        image: null, image_full: null, image_crop: null,
        created_at: '2026-10-01T00:00:00+00:00', published_at: '2026-10-01T00:00:00+00:00',
        format: 'singles', level_id: null, draw_size: 4,
        bracket_type: 'round_robin', playoff_format: 'se',
        court_count: 2, match_duration: 90, buffer_minutes: 10,
        court_id: null, group_count: 2, qualifiers_per_group: 2,
        notified_at: null, view_count: 0, view_count_app: 0,
        reminded_3d_at: null, reminded_1d_at: null,
        ntrp_min: null, ntrp_max: null, ntrp_combined_max: null,
        gender: 'men', manual_group_places: null, reserved_spots: 0,
        ig_meta: null, set_format: null,
        fee_member: null, fee_guest: null,
        ready_notified_at: null, draw_seed: 1,
        schedule_notified_at: null, schedule_saved_at: null,
        director_name: null, referee_name: null
    }];
}

/**
 * Вешает перехват на страницу. `расклад` — 'идёт' или 'закрыт'.
 */
async function подставить(page, расклад) {
    const группыЗакрыты = расклад === 'закрыт';
    const матчи = матчиГрупп(группыЗакрыты).concat(матчиПлейофф(группыЗакрыты));
    const ответ = {
        tournaments: турнир(),
        matches: матчи,
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

        /* `.single()` И `.maybeSingle()` ЖДУТ ОБЪЕКТ, А НЕ МАССИВ.
           PostgREST различает их заголовком Accept: при
           `application/vnd.pgrst.object+json` он отдаёт ОДНУ строку, а не
           список. Подстава, отвечавшая массивом на всё, положила весь
           прогон: `tournaments ... .single()` (tournament-detail.js:1267)
           вернул массив, `tournament.title` стал undefined, и сетка не
           собралась вовсе — 75 падений по таймауту.
           ОДИН НА НОЛЬ СТРОК — ЭТО 406, а не пустой объект: так отвечает
           настоящая база, и страница на это рассчитывает. */
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

module.exports = { подставить, ТУРНИР, ИГРОКИ };
