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
            gender: 'male'
        }], 'id');

        await upsert('profiles', [{
            id: id,
            full_name: acc.name,
            email: acc.email,
            role: acc.role,
            player_id: playerId
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

    console.log('\nГотово. Вход для проверок:');
    ACCOUNTS.forEach(a => console.log('  ' + a.email + '  ' + a.password));
})().catch(e => {
    console.error('\nОшибка:', e.message);
    process.exit(1);
});
