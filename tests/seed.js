/**
 * Данные для автотестов.
 *
 * Тестовая база поднимается пустой, а проверки кабинета и админки без входа
 * бесполезны: страница уводит на форму входа, и они ищут разделы кабинета там,
 * где их не может быть.
 *
 * Здесь заводится минимум, на котором проверки имеют смысл: два аккаунта —
 * обычный игрок и администратор, — их карточки игроков, категория, турнир и
 * действующее членство.
 *
 * Запускать:  node tests/seed.js
 *
 * Идёт по служебному ключу тестовой базы: обычным способом аккаунт не завести,
 * Supabase требует подтверждения почты. Ключ только от тестового проекта — в
 * нём нет ни живых людей, ни платежей.
 */

const db = require('./test-db');
const fs = require('fs');
const path = require('path');

function secret() {
    const file = path.join(__dirname, '..', '.env.test');
    if (fs.existsSync(file)) {
        const m = fs.readFileSync(file, 'utf8').match(/^\s*KSLT_TEST_DB_SECRET\s*=\s*(.+?)\s*$/m);
        if (m) return m[1];
    }
    return process.env.KSLT_TEST_DB_SECRET;
}

const KEY = secret();
if (!KEY) {
    console.error('\nНет служебного ключа тестовой базы.\n' +
        'Добавь в .env.test строку KSLT_TEST_DB_SECRET=sb_secret_...\n');
    process.exit(1);
}

const H = {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json'
};

/** Аккаунты, под которыми ходят проверки. */
const ACCOUNTS = [
    { email: 'player@test.kslt.kg', password: 'TestPlayer1!', name: 'Тестовый Игрок', role: 'user' },
    { email: 'admin@test.kslt.kg',  password: 'TestAdmin1!',  name: 'Тестовый Админ', role: 'admin' }
];

async function call(method, url, body) {
    const res = await fetch(db.url + url, {
        method,
        headers: H,
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { ok: res.ok, status: res.status, data };
}

async function ensureUser(acc) {
    // Уже заведён — берём как есть, чтобы повторный запуск не ломался
    const list = await call('GET', '/auth/v1/admin/users?per_page=200');
    const found = (list.data && list.data.users || []).find(u => u.email === acc.email);
    if (found) return found.id;

    const res = await call('POST', '/auth/v1/admin/users', {
        email: acc.email,
        password: acc.password,
        email_confirm: true,      // без подтверждения войти нельзя
        user_metadata: { full_name: acc.name }
    });
    if (!res.ok) throw new Error('не завёлся ' + acc.email + ': ' + JSON.stringify(res.data));
    return res.data.id;
}

async function upsert(table, rows, onConflict) {
    const q = onConflict ? '?on_conflict=' + onConflict : '';
    const res = await fetch(db.url + '/rest/v1/' + table + q, {
        method: 'POST',
        headers: Object.assign({}, H, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(rows)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(table + ': ' + text);
    return text ? JSON.parse(text) : [];
}

(async function main() {
    console.log('База:', db.url, '\n');

    // --- Категория и уровень турнира -------------------------------------
    await upsert('categories', [
        { id: 'tour', name: 'Tour', name_en: 'Tour', sort_order: 3, color: '#CCFF00' }
    ], 'id');
    console.log('  категория Tour');

    // --- Аккаунты и карточки игроков -------------------------------------
    const ids = {};
    for (const acc of ACCOUNTS) {
        const id = await ensureUser(acc);
        ids[acc.role] = id;

        const playerId = acc.role === 'admin' ? 'test-admin' : 'test-player';
        await upsert('players', [{
            id: playerId,
            name: acc.name,
            category_id: 'tour',
            points: acc.role === 'admin' ? 120 : 60,
            gender: 'men'
        }], 'id');

        await upsert('profiles', [{
            id: id,
            full_name: acc.name,
            email: acc.email,
            role: acc.role,
            player_id: playerId,
            // Без пола админка не даёт сохранить карточку игрока
            gender: 'men'
        }], 'id');

        console.log('  аккаунт ' + acc.email + ' (' + acc.role + ') и карточка ' + playerId);
    }

    // --- Действующее членство обычному игроку ----------------------------
    // Без него он «зарегистрированный», а не «член клуба», и половина
    // страниц показывает ему заглушку вместо содержимого
    const today = new Date();
    const inYear = new Date(today.getTime() + 365 * 24 * 3600 * 1000);
    await upsert('memberships', [{
        profile_id: ids.user,
        status: 'active',
        starts_at: today.toISOString().slice(0, 10),
        expires_at: inYear.toISOString().slice(0, 10)
    }]);
    console.log('  членство до ' + inYear.toISOString().slice(0, 10));

    // --- Турнир ----------------------------------------------------------
    await upsert('tournaments', [{
        id: 'test-tournament',
        title: 'Тестовый турнир',
        category_id: 'tour',
        status: 'registration_open',
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        // Обязательные поля турнира
        max_participants: 16,
        gender: 'men'
    }], 'id');
    console.log('  турнир test-tournament');

    // --- Соперник, матчи и результат -------------------------------------
    // Без них раздел «Мои игры» пуст, и проверять в нём нечего
    await upsert('players', [{
        id: 'test-rival', name: 'Тестовый Соперник',
        category_id: 'tour', points: 40, gender: 'men'
    }], 'id');

    var played = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    await upsert('matches', [
        {
            id: '11111111-1111-4111-8111-111111111111',
            tournament_id: 'test-tournament',
            player1_id: 'test-player', player2_id: 'test-rival',
            score: '6/4 6/2', winner_id: 'test-player',
            round: 'SF', round_number: 2, match_order: 1,
            played_at: played, status: 'completed', match_type: 'tournament'
        },
        {
            id: '22222222-2222-4222-8222-222222222222',
            tournament_id: 'test-tournament',
            player1_id: 'test-rival', player2_id: 'test-player',
            score: '6/3 7/5', winner_id: 'test-rival',
            round: 'F', round_number: 3, match_order: 1,
            played_at: played, status: 'completed', match_type: 'tournament'
        }
    ], 'id');

    // Финал проигран: игрок — финалист, соперник — чемпион
    await upsert('tournament_results', [
        { tournament_id: 'test-tournament', player_id: 'test-player',
          round_reached: 'F', points_earned: 60, season: today.getFullYear() },
        { tournament_id: 'test-tournament', player_id: 'test-rival',
          round_reached: 'W', points_earned: 100, season: today.getFullYear() }
    ], 'tournament_id,player_id');
    console.log('  два матча и результат турнира');

    // --- Значки ----------------------------------------------------------
    await upsert('badge_definitions', [
        { id: 'first_match', name: 'Первый матч', name_en: 'First match', icon: '🎾',
          description: 'Сыграть первый матч', condition_type: 'matches_played',
          condition_value: 1, sort_order: 1 },
        { id: 'first_win', name: 'Первая победа', name_en: 'First win', icon: '🥇',
          description: 'Выиграть первый матч', condition_type: 'wins',
          condition_value: 1, sort_order: 2 },
        { id: 'matches_10', name: 'Десятка', name_en: 'Ten', icon: '🔟',
          description: 'Сыграть 10 матчей', condition_type: 'matches_played',
          condition_value: 10, sort_order: 4 },
        { id: 'finalist', name: 'Финалист', name_en: 'Finalist', icon: '🥈',
          description: 'Дойти до финала', condition_type: 'finalist',
          condition_value: 1, sort_order: 15 },
        { id: 'champion', name: 'Чемпион', name_en: 'Champion', icon: '🏆',
          description: 'Выиграть турнир', condition_type: 'champion',
          condition_value: 1, sort_order: 14 },
        { id: 'member', name: 'Член КСЛТ', name_en: 'KSLT member', icon: '💚',
          description: 'Действующее членство', condition_type: 'membership',
          condition_value: 0, sort_order: 22 }
    ], 'id');
    console.log('  определения значков');

    // --- Парный турнир ---------------------------------------------------
    // В матче помещаются только капитаны пар, напарник в нём не упомянут.
    // Тестовый игрок здесь именно напарник: без этого не проверить, что он
    // вообще видит свои парные игры
    await upsert('players', [
        { id: 'test-captain', name: 'Тестовый Капитан', category_id: 'tour', points: 30, gender: 'men' },
        { id: 'test-rival-2', name: 'Второй Соперник', category_id: 'tour', points: 20, gender: 'men' }
    ], 'id');

    await upsert('tournaments', [{
        id: 'test-doubles',
        title: 'Тестовый парный турнир',
        category_id: 'tour',
        status: 'completed',
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 8,
        gender: 'men',
        format: 'doubles',
        draw_size: 4
    }], 'id');

    await upsert('tournament_registrations', [
        { id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', tournament_id: 'test-doubles',
          player_id: 'test-captain', partner_id: 'test-player', status: 'approved' },
        { id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', tournament_id: 'test-doubles',
          player_id: 'test-rival', partner_id: 'test-rival-2', status: 'approved' }
    ], 'id');

    await upsert('matches', [{
        id: '33333333-3333-4333-8333-333333333333',
        tournament_id: 'test-doubles',
        player1_id: 'test-captain', player2_id: 'test-rival',
        score: '6/2 6/4', winner_id: 'test-captain',
        round: 'F', round_number: 2, match_order: 1,
        played_at: played, status: 'completed', match_type: 'tournament'
    }], 'id');
    console.log('  парный турнир: игрок заявлен напарником');

    // --- История рейтинга ------------------------------------------------
    // Очки в двух категориях и в разные дни: только на таких данных видно,
    // что ступенька на графике встаёт в день начисления, а не раньше
    await upsert('categories', [
        { id: 'masters', name: 'Masters', name_en: 'Masters', sort_order: 5, color: '#B57BFF' }
    ], 'id');

    function daysAgo(n) {
        return new Date(today.getTime() - n * 24 * 3600 * 1000).toISOString().slice(0, 10);
    }

    await upsert('rating_history', [
        { id: 'aa000001-0000-4000-8000-000000000001',
          player_id: 'test-player', category_id: 'tour', points_earned: 9,
          tournament_name: 'Тестовый турнир', recorded_at: daysAgo(120),
          is_doubles: false, ntrp_after: 3.2 },
        { id: 'aa000001-0000-4000-8000-000000000002',
          player_id: 'test-player', category_id: 'masters', points_earned: 60,
          tournament_name: 'Мастерс-этап', recorded_at: daysAgo(60),
          is_doubles: false, ntrp_after: null },
        { id: 'aa000001-0000-4000-8000-000000000003',
          player_id: 'test-player', category_id: 'tour', points_earned: 150,
          tournament_name: 'Большой этап', recorded_at: daysAgo(10),
          is_doubles: false, ntrp_after: null }
    ], 'id');

    await upsert('player_categories', [
        { player_id: 'test-player', category_id: 'tour', points: 159, wins: 1, losses: 1 },
        { player_id: 'test-player', category_id: 'masters', points: 60, wins: 0, losses: 0 }
    ], 'player_id,category_id');
    // Оценки NTRP: так их теперь пишет админка — без категории и без очков.
    // Раньше такая строка не доходила бы даже до графика NTRP
    await upsert('rating_history', [
        { id: 'aa000002-0000-4000-8000-000000000001',
          player_id: 'test-player', category_id: null, points_earned: 0,
          tournament_name: 'Оценка NTRP', recorded_at: daysAgo(80),
          is_doubles: false, ntrp_after: 3.5 },
        { id: 'aa000002-0000-4000-8000-000000000002',
          player_id: 'test-player', category_id: null, points_earned: 0,
          tournament_name: 'Оценка NTRP', recorded_at: daysAgo(40),
          is_doubles: false, ntrp_after: 3.7 },
        { id: 'aa000002-0000-4000-8000-000000000003',
          player_id: 'test-player', category_id: null, points_earned: 0,
          tournament_name: 'Оценка NTRP', recorded_at: daysAgo(5),
          is_doubles: false, ntrp_after: 4.0 }
    ], 'id');
    console.log('  история рейтинга в двух категориях и оценки NTRP');

    // --- МЕСТО В РЕЙТИНГЕ: равные очки и гость ---------------------------
    // Беда 02.10: место в заявках расходилось с местом в публичном рейтинге.
    // Две причины, и для каждой здесь свой человек.
    //
    // 1) ГОСТЬ. Публичная таблица гостей не показывает, а колонка «Место» в
    //    админке их считала — список выходил длиннее, и числа ехали. Гостю
    //    места нет вовсе.
    // 2) РАВНЫЕ. У троих совпали и очки, и NTRP. Третьего ключа сортировки
    //    не было, а `sort` в таком случае оставляет порядок ВХОДНОГО
    //    массива — а он разный у публичной страницы и у админки. Одно
    //    определение давало два числа.
    //
    // Имена подобраны так, чтобы алфавит id не совпадал с алфавитом имён:
    // иначе совпадение чисел ничего не докажет.
    /* ПОЛЯ — ТОЛЬКО ТЕ, ЧТО СЕВ УЖЕ КЛАДЁТ ДРУГИМ ИГРОКАМ. Прогон 02.10
       упал здесь: `players: {"code": ...}`, и до турнира дело не дошло.
       Тестовая база старше боевой, и лишнее поле валит всю вставку.
       `ntrp_singles` и `is_guest` добавляем ОТДЕЛЬНО и не падаем, если их
       нет: без ntrp равенство по очкам сохраняется (у всех выйдет 0), а
       про гостя скажем вслух — проверка о нём тогда не состоится. */
    await upsert('players', [
        { id: 'mr-alpha',   name: 'Яков Первый',    category_id: 'tour', points: 300, gender: 'men' },
        { id: 'mr-bravo',   name: 'Эдуард Равный',  category_id: 'tour', points: 225, gender: 'men' },
        { id: 'mr-charlie', name: 'Борис Равный',   category_id: 'tour', points: 225, gender: 'men' },
        { id: 'mr-delta',   name: 'Антон Равный',   category_id: 'tour', points: 225, gender: 'men' },
        { id: 'mr-echo',    name: 'Василий Пятый',  category_id: 'tour', points: 100, gender: 'men' },
        { id: 'mr-guest',   name: 'Гость Безочков', category_id: 'tour', points: 0,   gender: 'men' }
    ], 'id');

    /* ПОЛЕ ДОПИСЫВАЕТСЯ ПРАВКОЙ, А НЕ АПСЕРТОМ. Апсерт — это INSERT с
       `ON CONFLICT`, и у него есть INSERT-часть: в неё уходят только
       переданные колонки, а `name` в `players` обязательна. Такой запрос
       валится ДО конфликта — и валится молча для нас, потому что ошибку
       мы проглатывали в `catch` одной строкой «ВНИМАНИЕ». Прогон 02.10
       показал ровно это: в базе у `mr-guest` лежал `is_guest = false`,
       то есть значение по умолчанию, а не наше. PATCH трогает только то,
       что ему дали, и INSERT-части у него нет. */
    for (const поле of [
        { имя: 'ntrp_singles', ряд: ['mr-alpha','mr-bravo','mr-charlie','mr-delta','mr-echo','mr-guest'], знач: 3 },
        { имя: 'is_guest',     ряд: ['mr-guest'], знач: true }
    ]) {
        for (const id of поле.ряд) {
            const тело = {}; тело[поле.имя] = поле.знач;
            const р = await call('PATCH', '/rest/v1/players?id=eq.' + id, тело);
            if (!р.ok) {
                console.log('  ВНИМАНИЕ: ' + поле.имя + ' не легло у ' + id +
                    ' — ' + String(JSON.stringify(р.data)).slice(0, 160));
            }
        }
    }

    /* РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «ОК». Сев сказал
       «ок» по всем шести игрокам, а гость в базе гостем не стал — и узнали
       мы об этом только когда упал прогон. Теперь сев сам читает, что лёг,
       и называет расхождение вслух. */
    const свёл = await call('GET', '/rest/v1/players?id=in.(mr-alpha,mr-bravo,' +
        'mr-charlie,mr-delta,mr-echo,mr-guest)&select=id,name,points,ntrp_singles,is_guest');
    if (!свёл.ok) {
        console.log('  ВНИМАНИЕ: не смог перечитать игроков — ' +
            String(JSON.stringify(свёл.data)).slice(0, 160));
    } else {
        (свёл.data || []).forEach(function(и) {
            console.log('    ' + и.id + ': очки ' + и.points +
                ', ntrp ' + JSON.stringify(и.ntrp_singles) +
                ', гость ' + JSON.stringify(и.is_guest));
        });
        const г = (свёл.data || []).filter(function(и) { return и.id === 'mr-guest'; })[0];
        if (!г) {
            console.log('  ВНИМАНИЕ: mr-guest в базе не нашёлся вовсе');
        } else if (г.is_guest !== true) {
            console.log('  ВНИМАНИЕ: у mr-guest is_guest = ' + JSON.stringify(г.is_guest) +
                ', а не true. Проверка про гостя пройдёт вхолостую: это не гость.');
        }
    }

    await upsert('player_categories', [
        { player_id: 'mr-alpha',   category_id: 'tour', points: 300, wins: 0, losses: 0 },
        { player_id: 'mr-bravo',   category_id: 'tour', points: 225, wins: 0, losses: 0 },
        { player_id: 'mr-charlie', category_id: 'tour', points: 225, wins: 0, losses: 0 },
        { player_id: 'mr-delta',   category_id: 'tour', points: 225, wins: 0, losses: 0 },
        { player_id: 'mr-echo',    category_id: 'tour', points: 100, wins: 0, losses: 0 }
    ], 'player_id,category_id');

    /* ОТДЕЛЬНЫЙ ТУРНИР, А НЕ `test-tournament`. У того уже есть матчи, и
       админка честно говорит «Сетка сформирована — состав закрыт»: вкладка
       «Заявки» показывает не таблицу, а строку «Заявок пока нет». Прогон
       02.10 упал именно так — в следе это написано прямым текстом.
       Здесь турнир без единого матча: состав открыт, таблица на месте. */
    await upsert('tournaments', [{
        id: 'test-mesto',
        title: 'Тестовый турнир: место в рейтинге',
        category_id: 'tour',
        status: 'registration_open',
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 16,
        gender: 'men'
    }], 'id');

    // Заявки на одиночный турнир той же категории: именно здесь админка
    // показывает колонку «Место», и именно её сверяет проверка.
    await upsert('tournament_registrations', [
        { id: 'cc000001-0000-4000-8000-000000000001', tournament_id: 'test-mesto', player_id: 'mr-alpha',   status: 'approved' },
        { id: 'cc000001-0000-4000-8000-000000000002', tournament_id: 'test-mesto', player_id: 'mr-bravo',   status: 'approved' },
        { id: 'cc000001-0000-4000-8000-000000000003', tournament_id: 'test-mesto', player_id: 'mr-charlie', status: 'approved' },
        { id: 'cc000001-0000-4000-8000-000000000004', tournament_id: 'test-mesto', player_id: 'mr-delta',   status: 'approved' },
        { id: 'cc000001-0000-4000-8000-000000000005', tournament_id: 'test-mesto', player_id: 'mr-echo',    status: 'approved' },
        { id: 'cc000001-0000-4000-8000-000000000006', tournament_id: 'test-mesto', player_id: 'mr-guest',   status: 'approved' }
    ], 'id');
    console.log('  место в рейтинге: трое с равными очками и гость');

    /* --- Турнир с ГРУППАМИ и плей-офф: метка `A1`, `B1` -----------------
       Метку «кто из какой группы вышел» строит `KSLT_GROUPS.меткиИгроков`,
       и сравнить её НА ДВУХ ЭКРАНАХ может только прогон: заморозка читает
       файлы как текст и видит лишь то, что карта одна.
       Группы по трое, все матчи сыграны, порядок однозначен — ни одного
       жребия: иначе место зависело бы от случая и сверять было бы нечего.
       Финал НЕ сыгран: метка должна стоять у обоих, а не только у
       победителя. */
    await upsert('tournaments', [{
        id: 'test-metka',
        title: 'Тестовый турнир: метка группы',
        category_id: 'tour',
        status: 'ongoing',
        bracket_type: 'round_robin',
        group_count: 2,
        qualifiers_per_group: 1,
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 6,
        gender: 'men'
    }], 'id');

    await upsert('tournament_registrations', [
        { id: 'cc000002-0000-4000-8000-000000000001', tournament_id: 'test-metka', player_id: 'mr-alpha',   status: 'approved' },
        { id: 'cc000002-0000-4000-8000-000000000002', tournament_id: 'test-metka', player_id: 'mr-bravo',   status: 'approved' },
        { id: 'cc000002-0000-4000-8000-000000000003', tournament_id: 'test-metka', player_id: 'mr-charlie', status: 'approved' },
        { id: 'cc000002-0000-4000-8000-000000000004', tournament_id: 'test-metka', player_id: 'mr-delta',   status: 'approved' },
        { id: 'cc000002-0000-4000-8000-000000000005', tournament_id: 'test-metka', player_id: 'mr-echo',    status: 'approved' },
        { id: 'cc000002-0000-4000-8000-000000000006', tournament_id: 'test-metka', player_id: 'mr-guest',   status: 'approved' }
    ], 'id');

    // Группа A: alpha первый, bravo второй, charlie третий.
    // Группа B: delta первый, echo второй, guest третий.
    var мНомер = 0;
    function мИд() {
        мНомер += 1;
        return 'dd000001-0000-4000-8000-0000000000' + String(мНомер).padStart(2, '0');
    }
    /* ВСТАВКА МАССИВОМ ТРЕБУЕТ ОДИНАКОВОГО НАБОРА КЛЮЧЕЙ У ВСЕХ ОБЪЕКТОВ.
       PostgREST строит один INSERT на весь массив и отвечает `PGRST102
       All object keys must match`, если у одной строки ключей больше.
       Групповой матч несёт `group_number`, матч сетки — `round`: поэтому
       оба ключа есть у ОБОИХ, просто один из них пустой. */
    /* ВРЕМЯ ЗАПУСКА — ЧАСТЬ ДАННЫХ, А НЕ УКРАШЕНИЕ. Очередь запусков
       строится ТОЛЬКО из матчей с `scheduled_time` (`bracket.js:4829`):
       без него панель показывает пустое состояние, и печатать нечего.
       Прогон 02.10 упал на пороге «нет таблицы расписания» — правильное
       падение, беда была в севе. */
    var часПуска = 9;
    function грМатч(группа, круг, порядок, п1, п2, счёт, победитель, когда, состояние) {
        var пуск = new Date(today);
        пуск.setHours(часПуска, 0, 0, 0);
        часПуска += 1;
        return {
            id: мИд(), tournament_id: 'test-metka',
            player1_id: п1, player2_id: п2,
            score: счёт, winner_id: победитель,
            group_number: группа, round: круг,
            round_number: порядок, match_order: порядок,
            scheduled_time: пуск.toISOString(),
            // `court` в базе ЦЕЛОЕ: строка «Корт 2» падает на 22P02
            court: (порядок % 2) + 1,
            played_at: когда, status: состояние, match_type: 'tournament'
        };
    }
    await upsert('matches', [
        грМатч(1, null, 1, 'mr-alpha', 'mr-bravo',   '6/1 6/1', 'mr-alpha', played, 'completed'),
        грМатч(1, null, 2, 'mr-alpha', 'mr-charlie', '6/2 6/2', 'mr-alpha', played, 'completed'),
        грМатч(1, null, 3, 'mr-bravo', 'mr-charlie', '6/3 6/3', 'mr-bravo', played, 'completed'),
        грМатч(2, null, 1, 'mr-delta', 'mr-echo',    '6/1 6/1', 'mr-delta', played, 'completed'),
        грМатч(2, null, 2, 'mr-delta', 'mr-guest',   '6/2 6/2', 'mr-delta', played, 'completed'),
        грМатч(2, null, 3, 'mr-echo',  'mr-guest',   '6/3 6/3', 'mr-echo',  played, 'completed'),
        // Финал БЕЗ счёта: метка обязана стоять у обоих, а не только у
        // победителя. Ключи те же, что у групповых — иначе PGRST102
        грМатч(null, 'F', 1, 'mr-alpha', 'mr-delta', null, null, null, 'upcoming')
    ], 'id');

    /* РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ. Сев уже один раз сказал «ок»,
       а в базе лежало значение по умолчанию. Перечитываем и называем
       расхождение вслух. */
    var свёлМ = await call('GET', '/rest/v1/matches?tournament_id=eq.test-metka' +
        '&select=id,group_number,round,status');
    if (!свёлМ.ok) {
        console.log('  ВНИМАНИЕ: не смог перечитать матчи test-metka — ' +
            String(JSON.stringify(свёлМ.data)).slice(0, 160));
    } else {
        var вГруппах = (свёлМ.data || []).filter(function(м) { return м.group_number > 0; }).length;
        var вСетке = (свёлМ.data || []).filter(function(м) { return !м.group_number; }).length;
        console.log('    матчей в группах ' + вГруппах + ', в сетке ' + вСетке);
        if (вГруппах !== 6 || вСетке !== 1) {
            console.log('  ВНИМАНИЕ: ждали 6 групповых и 1 в сетке. Проверка метки ' +
                'пройдёт вхолостую: сверять будет нечего.');
        }
    }
    console.log('  метка группы: две группы по трое и финал без счёта');

    /* --- Сетка, где игроков ещё нет, а метки слотов уже есть -----------
       Пустая клетка обязана говорить, кого ждёт: `A1` — победитель группы
       A, `IG1` — победитель первого дополнительного матча. До 02.10 это
       читала только админка, а зритель видел подряд «TBD».
       Турнир отдельный: в `test-metka` финал уже с людьми, и пустых
       клеток с метками там нет — проверять было бы нечего. */
    await upsert('tournaments', [{
        id: 'test-sloty',
        title: 'Тестовый турнир: метки слотов',
        category_id: 'tour',
        status: 'ongoing',
        bracket_type: 'single_elimination',
        draw_size: 4,
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 4,
        gender: 'men'
    }], 'id');

    function слотМатч(порядок, м1, м2) {
        return {
            id: 'ee000001-0000-4000-8000-0000000000' + String(порядок).padStart(2, '0'),
            tournament_id: 'test-sloty',
            player1_id: null, player2_id: null,
            slot1_label: м1, slot2_label: м2,
            score: null, winner_id: null,
            group_number: null, round: null,
            round_number: 1, match_order: порядок,
            played_at: null, status: 'upcoming', match_type: 'tournament'
        };
    }
    try {
        // Вторая клетка — со СВОБОДНЫМ местом: метки нет, значит играть не с
        // кем, и клетка обязана сказать BYE, а не «ждём»
        await upsert('matches', [слотМатч(1, 'A1', 'IG1'), слотМатч(2, 'B1', null)], 'id');
        var свёлС = await call('GET', '/rest/v1/matches?tournament_id=eq.test-sloty' +
            '&select=match_order,slot1_label,slot2_label');
        if (!свёлС.ok) {
            console.log('  ВНИМАНИЕ: не смог перечитать матчи test-sloty');
        } else {
            var сМетками = (свёлС.data || []).filter(function(м) { return м.slot1_label; }).length;
            console.log('    клеток с меткой слота ' + сМетками + ' из ' + ((свёлС.data || []).length));
            if (сМетками !== 2) {
                console.log('  ВНИМАНИЕ: ждали 2 клетки с меткой. Проверка меток слотов ' +
                    'пройдёт вхолостую — сверять будет нечего.');
            }
        }
        console.log('  метки слотов: сетка на четверых, игроков ещё нет');

    /* --- Очередь замены: порядок ОБРАТЕН порядку подачи ----------------
       «ЛИСТ ОЖИДАНИЯ — РЕШЕНИЕ КЛУБА, А НЕ ПОРЯДОК ВРЕМЕНИ» (30.09): в
       боевом CHALLENGERS 10 строк ожидания из 11 поданы РАНЬШЕ последней
       строки сетки. Окно замены сортирует по `queue_at` (`bracket.js:1155`).

       ЧТОБЫ ПРОВЕРКА НЕ ПРОШЛА ВХОЛОСТУЮ, два порядка должны РАЗЛИЧАТЬСЯ:
       подали alpha → bravo → charlie, а в очередь поставили наоборот. Если
       код вернётся к `registered_at`, тест это увидит; при совпадающих
       порядках он не увидел бы ничего. */
    await upsert('tournaments', [{
        id: 'test-ochered',
        title: 'Тестовый турнир: очередь замены',
        category_id: 'tour',
        status: 'registration_open',
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 4,
        gender: 'men'
    }], 'id');

    function чч(часов) {
        var д = new Date(today);
        д.setHours(часов, 0, 0, 0);
        return д.toISOString();
    }

    var базоваяОчередь = [
        { id: 'ff000001-0000-4000-8000-000000000001', player_id: 'mr-echo',    status: 'approved', registered_at: чч(8) },
        { id: 'ff000001-0000-4000-8000-000000000002', player_id: 'mr-delta',   status: 'approved', registered_at: чч(8) },
        // Подали рано — в очередь поставили поздно, и наоборот
        { id: 'ff000001-0000-4000-8000-000000000003', player_id: 'mr-alpha',   status: 'waitlist', registered_at: чч(9) },
        { id: 'ff000001-0000-4000-8000-000000000004', player_id: 'mr-bravo',   status: 'waitlist', registered_at: чч(10) },
        { id: 'ff000001-0000-4000-8000-000000000005', player_id: 'mr-charlie', status: 'waitlist', registered_at: чч(11) }
    ].map(function(з) {
        return { id: з.id, tournament_id: 'test-ochered', player_id: з.player_id,
                 status: з.status, registered_at: з.registered_at };
    });
    await upsert('tournament_registrations', базоваяОчередь, 'id');

    /* ПОРЯДОК ОЧЕРЕДИ ЗАДАЁТСЯ `waitlisted_at`, А НЕ `queue_at`.
       Здесь стоял `queue_at`, и сев врал: колонка ГЕНЕРИРУЕМАЯ —
       `COALESCE(waitlisted_at, registered_at)`, так она и заведена
       (`sql/функции/ochered-vremya-postanovki.sql:62`). Записать её руками
       нельзя, правка уходила в отказ, а перечитка спрашивала «queue_at не
       пуст?» — он не пуст НИКОГДА, и проверка проходила вхолостую.
       Пишем то, что пишет сама админка при снятии с основы
       (`bracket.js:1078`), а порядок перечитываем сравнением с подачей. */
    var очередьВремена = [
        { id: 'ff000001-0000-4000-8000-000000000003', waitlisted_at: чч(17) },  // alpha — поставлен последним
        { id: 'ff000001-0000-4000-8000-000000000004', waitlisted_at: чч(16) },
        { id: 'ff000001-0000-4000-8000-000000000005', waitlisted_at: чч(15) }   // charlie — первым
    ];
    var очередьЛегла = true;
    for (var оч = 0; оч < очередьВремена.length; оч++) {
        var р = await call('PATCH', '/rest/v1/tournament_registrations?id=eq.' + очередьВремена[оч].id,
            { waitlisted_at: очередьВремена[оч].waitlisted_at });
        if (!р.ok) {
            очередьЛегла = false;
            console.log('  ВНИМАНИЕ: waitlisted_at не лёг — ' +
                String(JSON.stringify(р.data)).slice(0, 160));
            break;
        }
    }

    /* ПЕРЕЧИТКА ОБЯЗАНА УМЕТЬ УПАСТЬ. Спрашиваем не «есть ли queue_at»
       (он есть всегда), а РАЗОШЁЛСЯ ЛИ порядок очереди с порядком подачи:
       ровно это и различает проверка в прогоне. */
    var свёлО = await call('GET', '/rest/v1/tournament_registrations?tournament_id=eq.test-ochered' +
        '&status=eq.waitlist&select=id,registered_at,waitlisted_at,queue_at');
    if (!свёлО.ok) {
        console.log('  ВНИМАНИЕ: не смог перечитать очередь');
    } else {
        var ждут = свёлО.data || [];
        var поПодаче = ждут.slice().sort(function(a, b) {
            return String(a.registered_at).localeCompare(String(b.registered_at));
        }).map(function(з) { return з.id; }).join(',');
        var поОчереди = ждут.slice().sort(function(a, b) {
            return String(a.queue_at).localeCompare(String(b.queue_at));
        }).map(function(з) { return з.id; }).join(',');
        var своё = ждут.filter(function(з) { return !!з.waitlisted_at; }).length;
        console.log('    в очереди ' + ждут.length + ', со своим временем постановки ' + своё);
        if (ждут.length !== 3 || своё !== 3 || поПодаче === поОчереди) {
            console.log('  ВНИМАНИЕ: порядок очереди не разошёлся с порядком подачи. ' +
                'Проверка порядка пройдёт вхолостую — по подаче и по очереди выйдет одно и то же.');
        } else {
            console.log('    порядок очереди обратен подаче — проверка различит две сортировки');
        }
    }
    console.log('  очередь замены: трое ждут, порядок обратен подаче');
    } catch (e) {
        console.log('  ВНИМАНИЕ: test-sloty или test-ochered не завелись — ' + String(e.message).slice(0, 160));
    }

    /* --- Итоги турнира: таблица под пьедесталом --------------------------
       Решение Кости 01.10: «надо будет отобразить так, как надо, чтобы все
       видели». Под пьедесталом — все участники: место, игрок, этап, очки.

       ДВА ТУРНИРА, ПОТОМУ ЧТО МЕСТО СЧИТАЕТСЯ ПО-РАЗНОМУ.
       В олимпийке места 5-8 НЕ разыграны: четверо проигравших четвертьфинал
       между собой не играли, и каждому пишется полоса. В сетке «все места»
       (`fic`) разыграны ВСЕ: пятый сыграл матч за 5-6, и место у него
       точное, а этап назовёт этот матч, а не выдуманный полуфинал
       (решение Кости 02.10).

       Одним турниром это не проверить: одна и та же строка не может быть
       одновременно полосой и числом. */
    try {
    await upsert('tournaments', [
        {
            id: 'test-itogi',
            title: 'Тестовый турнир: итоги олимпийки',
            category_id: 'tour',
            status: 'completed',
            bracket_type: 'single_elimination',
            draw_size: 8,
            date_start: today.toISOString().slice(0, 10),
            date_end: today.toISOString().slice(0, 10),
            max_participants: 8,
            gender: 'men'
        },
        {
            id: 'test-itogi-fic',
            title: 'Тестовый турнир: итоги всех мест',
            category_id: 'tour',
            status: 'completed',
            bracket_type: 'fic',
            draw_size: 8,
            date_start: today.toISOString().slice(0, 10),
            date_end: today.toISOString().slice(0, 10),
            max_participants: 8,
            gender: 'men'
        }
    ], 'id');

    /* Ключи у всех матчей ОДИНАКОВЫЕ: PostgREST отказывает массиву, где
       объекты несут разные наборы полей (PGRST102). Попадались 02.10. */
    function итогМатч(ид, турнир, круг, порядок, п1, п2, победитель, имяКруга) {
        return {
            id: ид, tournament_id: турнир,
            player1_id: п1, player2_id: п2,
            score: '6/4 6/2', winner_id: победитель,
            group_number: null, round: имяКруга,
            round_number: круг, match_order: порядок,
            played_at: today.toISOString(), status: 'completed',
            match_type: 'tournament'
        };
    }

    var ИД = function (н) { return 'dd000001-0000-4000-8000-0000000000' + String(н).padStart(2, '0'); };

    await upsert('matches', [
        // Олимпийка: финал и матч за третье место — пьедестал из троих
        итогМатч(ИД(1), 'test-itogi', 3, 1, 'mr-alpha', 'mr-bravo', 'mr-alpha', 'F'),
        итогМатч(ИД(2), 'test-itogi', 3, 2, 'mr-charlie', 'mr-delta', 'mr-charlie', '3RD'),
        // Все места: последний круг разыгрывает 1-2, 3-4, 5-6 и 7-8
        итогМатч(ИД(3), 'test-itogi-fic', 3, 1, 'mr-alpha', 'mr-bravo', 'mr-alpha', 'F'),
        итогМатч(ИД(4), 'test-itogi-fic', 3, 2, 'mr-charlie', 'mr-delta', 'mr-charlie', '3RD'),
        итогМатч(ИД(5), 'test-itogi-fic', 3, 3, 'mr-echo', 'test-player', 'mr-echo', 'F5'),
        итогМатч(ИД(6), 'test-itogi-fic', 3, 4, 'test-rival', 'test-captain', 'test-rival', 'F7')
    ], 'id');

    /* Итоги пишет админка при завершении турнира; здесь кладём то же, что
       записала бы она. Очки — уровень «Вторая»: 360 · 215 · 150 · 130,
       остальным победы. */
    function итог(турнир, игрок, этап, очки) {
        return { tournament_id: турнир, player_id: игрок, round_reached: этап,
                 points_earned: очки, season: today.getFullYear(), category_id: 'tour' };
    }
    await call('DELETE', '/rest/v1/tournament_results?tournament_id=in.(test-itogi,test-itogi-fic)');
    var итоги = [
        итог('test-itogi', 'mr-alpha',     'W',   360),
        итог('test-itogi', 'mr-bravo',     'F',   215),
        итог('test-itogi', 'mr-charlie',   '3RD', 150),
        итог('test-itogi', 'mr-delta',     '4TH', 130),
        итог('test-itogi', 'mr-echo',      'QF',   75),
        итог('test-itogi', 'test-player',  'QF',   50),
        итог('test-itogi', 'test-rival',   'QF',   25),
        итог('test-itogi', 'test-captain', 'QF',   10),

        итог('test-itogi-fic', 'mr-alpha',     'W',   360),
        итог('test-itogi-fic', 'mr-bravo',     'F',   215),
        итог('test-itogi-fic', 'mr-charlie',   '3RD', 150),
        итог('test-itogi-fic', 'mr-delta',     '4TH', 130),
        итог('test-itogi-fic', 'mr-echo',      'SF',  111),
        итог('test-itogi-fic', 'test-player',  'SF',  111),
        итог('test-itogi-fic', 'test-rival',   'QF',   90),
        итог('test-itogi-fic', 'test-captain', 'QF',   90)
    ];
    var ответИтоги = await call('POST', '/rest/v1/tournament_results', итоги);
    if (!ответИтоги.ok) {
        console.log('  ВНИМАНИЕ: итоги не легли — ' +
            String(JSON.stringify(ответИтоги.data)).slice(0, 200));
    }

    /* ПЕРЕЧИТКА ОБЯЗАНА УМЕТЬ УПАСТЬ: спрашиваем не «есть ли строки», а
       ровно то, что различает проверка — восемь строк на каждый турнир и
       четверо на неразыгранной полосе у олимпийки. */
    var свёлИ = await call('GET', '/rest/v1/tournament_results?tournament_id=in.' +
        '(test-itogi,test-itogi-fic)&select=tournament_id,player_id,round_reached,points_earned');
    if (!свёлИ.ok) {
        console.log('  ВНИМАНИЕ: не смог перечитать итоги');
    } else {
        var все = свёлИ.data || [];
        var олимп = все.filter(function(р) { return р.tournament_id === 'test-itogi'; });
        var фик = все.filter(function(р) { return р.tournament_id === 'test-itogi-fic'; });
        var полоса = олимп.filter(function(р) { return р.round_reached === 'QF'; }).length;
        console.log('    итоги: олимпийка ' + олимп.length + ', все места ' + фик.length +
            ', на полосе 5-8 — ' + полоса);
        if (олимп.length !== 8 || фик.length !== 8 || полоса !== 4) {
            console.log('  ВНИМАНИЕ: итоги легли не полностью. Проверка таблицы итогов ' +
                'пройдёт вхолостую — сверять будет нечего.');
        }
    }
    console.log('  итоги турнира: олимпийка с полосой и сетка всех мест');
    } catch (e) {
        console.log('  ВНИМАНИЕ: итоги не завелись — ' + String(e.message).slice(0, 160));
    }

    /* --- Пол турнира: ОТКАЗ, а не пометка -------------------------------
       Решение Кости 30.09: в рейтинговом одиночном несовпадение пола —
       отказ 403, в парных и дружеских заявка идёт на рассмотрение. Признак
       рейтингового требует НЕПУСТОЙ `level_id`: пустой уровень выключает не
       только очки, но и отказ (`tournament-register/index.ts:337`).

       Чтобы проверка дошла до пола, заявка обязана пройти все воротца
       раньше: профиль с карточкой, не забанен, турнир открыт, заявки ещё
       нет, ЧЛЕНСТВО ДЕЙСТВУЕТ и взнос оплачен. Поэтому здесь заводится
       отдельная женская учётка со своим членством, а не правится мужская:
       её карточку читают другие проверки. */
    try {
    var женщина = { email: 'woman@test.kslt.kg', password: 'TestWoman1!',
                    name: 'Тестовая Игрокиня', role: 'user' };
    var женИд = await ensureUser(женщина);
    await upsert('players', [{
        id: 'test-woman', name: женщина.name, category_id: 'tour',
        points: 40, gender: 'women'
    }], 'id');
    await upsert('profiles', [{
        id: женИд, full_name: женщина.name, email: женщина.email,
        role: 'user', player_id: 'test-woman', gender: 'women'
    }], 'id');
    await upsert('memberships', [{
        profile_id: женИд, status: 'active',
        starts_at: today.toISOString().slice(0, 10),
        expires_at: inYear.toISOString().slice(0, 10)
    }]);

    /* ЧЛЕНСТВО БЕЗ ОПЛАТЫ ДО ПОЛА НЕ ДОПУСКАЕТ. После членства функция
       требует строку в `payments` со статусом `completed`
       (`tournament-register/index.ts:298`) — иначе `not_paid`, и проверка
       упёрлась бы в воротца раньше. Платёж кладём тем же набором полей,
       что пишет админка (`users.js:862`), и привязываем к НАЙДЕННОМУ
       членству, а не к выдуманному id. */
    var членства = await call('GET', '/rest/v1/memberships?profile_id=eq.' + женИд +
        '&status=eq.active&select=id&order=expires_at.desc&limit=1');
    var членствоИд = ((членства.data || [])[0] || {}).id || null;
    if (!членствоИд) {
        console.log('  ВНИМАНИЕ: членство женской учётки не нашлось — заявка упрётся в no_membership');
    } else {
        var естьПлатёж = await call('GET', '/rest/v1/payments?membership_id=eq.' + членствоИд +
            '&status=eq.completed&select=id&limit=1');
        if (!(естьПлатёж.data || []).length) {
            var платёж = await call('POST', '/rest/v1/payments', [{
                profile_id: женИд, membership_id: членствоИд,
                amount: 1000, currency: 'KGS', payment_method: 'cash',
                status: 'completed', note: 'сев тестовой базы', created_by: женИд
            }]);
            if (!платёж.ok) {
                console.log('  ВНИМАНИЕ: платёж не лёг — ' +
                    String(JSON.stringify(платёж.data)).slice(0, 200));
            }
        }
    }

    /* УРОВЕНЬ ЗАВОДИТСЯ, А НЕ УГАДЫВАЕТСЯ. `level_id` ссылается на
       `tournament_levels`, и его ключ — не слово «вторая», а то, что
       выдала база. Берём существующий, а нет — заводим и читаем id. */
    var уровеньИд = null;
    var естьУровни = await call('GET', '/rest/v1/tournament_levels?select=id,name,sort_order&order=sort_order');
    if (естьУровни.ok && (естьУровни.data || []).length) {
        уровеньИд = естьУровни.data[0].id;
    } else {
        var новыйУровень = await call('POST', '/rest/v1/tournament_levels',
            [{ name: 'Тестовый уровень', name_en: 'Test level', sort_order: 1 }]);
        if (!новыйУровень.ok) {
            console.log('  ВНИМАНИЕ: уровень турнира не завёлся — ' +
                String(JSON.stringify(новыйУровень.data)).slice(0, 160));
        }
        /* ОТВЕТ «ок» НЕ ЗНАЧИТ, ЧТО В БАЗЕ ЛЕЖИТ СТРОКА, а без `Prefer`
           вставка и вовсе ничего не возвращает: id берём чтением. */
        var послеВставки = await call('GET', '/rest/v1/tournament_levels?select=id&order=sort_order&limit=1');
        if (послеВставки.ok && (послеВставки.data || []).length) {
            уровеньИд = послеВставки.data[0].id;
        }
    }

    await upsert('tournaments', [{
        id: 'test-pol',
        title: 'Тестовый турнир: мужской рейтинговый',
        category_id: 'tour',
        status: 'registration_open',
        format: 'singles',
        level_id: уровеньИд,
        bracket_type: 'single_elimination',
        date_start: today.toISOString().slice(0, 10),
        date_end: today.toISOString().slice(0, 10),
        max_participants: 8,
        gender: 'men'
    }], 'id');

    /* ПРОГОН НЕ ДОЛЖЕН ЗАВИСЕТЬ ОТ ПРОШЛОГО ПРОГОНА. Заявка этой женщины
       появится в базе только если отказ сломается — но если он уже
       ломался, вторая проверка получила бы `already_registered` и прошла
       бы мимо беды. Чистим перед каждым севом. */
    await call('DELETE', '/rest/v1/tournament_registrations?tournament_id=eq.test-pol' +
        '&player_id=eq.test-woman');

    /* ПЕРЕЧИТКА ОБЯЗАНА УМЕТЬ УПАСТЬ: спрашиваем ровно то, без чего отказ
       не наступит — формат, непустой уровень, пол турнира и пол игрока. */
    var свёлП = await call('GET', '/rest/v1/tournaments?id=eq.test-pol' +
        '&select=format,level_id,gender,status');
    var свёлЖ = await call('GET', '/rest/v1/players?id=eq.test-woman&select=gender');
    var т = (свёлП.data || [])[0] || {};
    var ж = (свёлЖ.data || [])[0] || {};
    var свёлОпл = await call('GET', '/rest/v1/payments?membership_id=eq.' +
        (членствоИд || '00000000-0000-0000-0000-000000000000') +
        '&status=eq.completed&select=id');
    console.log('    пол турнира: членство ' + (членствоИд ? 'есть' : 'НЕТ') +
        ', оплат ' + ((свёлОпл.data || []).length));
    console.log('    пол турнира: формат ' + (т.format || '—') +
        ', уровень ' + (т.level_id ? 'есть' : 'ПУСТ') +
        ', турнир ' + (т.gender || '—') + ', игрок ' + (ж.gender || '—'));
    if (т.format !== 'singles' || !т.level_id || т.gender !== 'men' || ж.gender !== 'women') {
        console.log('  ВНИМАНИЕ: отказ по полу не наступит — проверка пройдёт вхолостую. ' +
            'Пустой уровень выключает признак рейтингового, и несовпадение пола ' +
            'станет пометкой, а не отказом.');
    }
    console.log('  пол турнира: женская учётка woman@test.kslt.kg и мужской рейтинговый');
    } catch (e) {
        console.log('  ВНИМАНИЕ: пол турнира не завёлся — ' + String(e.message).slice(0, 160));
    }

    console.log('\nГотово. Вход для проверок:');
    ACCOUNTS.forEach(a => console.log('  ' + a.email + '  ' + a.password));
    console.log('  woman@test.kslt.kg  TestWoman1!');
})().catch(e => {
    console.error('\nОшибка:', e.message);
    process.exit(1);
});
