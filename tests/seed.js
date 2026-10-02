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
    function грМатч(группа, круг, порядок, п1, п2, счёт, победитель, когда, состояние) {
        return {
            id: мИд(), tournament_id: 'test-metka',
            player1_id: п1, player2_id: п2,
            score: счёт, winner_id: победитель,
            group_number: группа, round: круг,
            round_number: порядок, match_order: порядок,
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
    } catch (e) {
        console.log('  ВНИМАНИЕ: test-sloty не завёлся — ' + String(e.message).slice(0, 160));
    }

    console.log('\nГотово. Вход для проверок:');
    ACCOUNTS.forEach(a => console.log('  ' + a.email + '  ' + a.password));
})().catch(e => {
    console.error('\nОшибка:', e.message);
    process.exit(1);
});
