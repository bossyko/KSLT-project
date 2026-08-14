/**
 * Вход перед прогоном.
 *
 * Кабинет и админка закрыты: без входа страница уводит на форму авторизации,
 * и проверки ищут разделы кабинета там, где их не может быть. Раньше эти
 * семьдесят четыре проверки просто падали.
 *
 * Здесь мы один раз входим за игрока и за администратора и складываем сессии
 * в файлы. Проверки поднимают готовую сессию через storageState — заполнять
 * форму входа в каждом тесте было бы и медленно, и хрупко.
 *
 * Аккаунты заводит tests/seed.js в тестовой базе.
 */

const fs = require('fs');
const path = require('path');
const db = require('./test-db');

const DIR = path.join(__dirname, '.auth');
const ORIGIN = 'http://localhost:8000';

/** Ключ, под которым supabase-js держит сессию в localStorage. */
const STORAGE_KEY = 'sb-' + db.url.replace(/^https:\/\//, '').split('.')[0] + '-auth-token';

const ACCOUNTS = [
    { file: 'player.json', email: 'player@test.kslt.kg', password: 'TestPlayer1!' },
    { file: 'admin.json',  email: 'admin@test.kslt.kg',  password: 'TestAdmin1!'  }
];

async function signIn(acc) {
    const res = await fetch(db.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'apikey': db.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password })
    });
    // 402 — не наша ошибка: Supabase ограничил проекты за превышение квоты
    // организации. Ограничение общее на все проекты, включая тестовый, и
    // снимается сменой платёжного периода или платным планом
    if (res.status === 402) {
        throw new Error(
            '\n\nSupabase ответил 402: проекты организации ограничены за превышение квоты.\n' +
            'Прогон невозможен, пока ограничение не снято — ни тестовая база, ни боевая\n' +
            'запросы не обслуживают. Смотри Dashboard → Organization → Usage.\n'
        );
    }

    const session = await res.json();
    if (!res.ok || !session.access_token) {
        throw new Error(
            '\n\nНе вышло войти под ' + acc.email + ': ' + JSON.stringify(session) + '\n\n' +
            'Аккаунты для проверок заводит tests/seed.js — запусти:\n\n' +
            '  node tests/seed.js\n'
        );
    }
    return session;
}

module.exports = async function globalSetup() {
    fs.mkdirSync(DIR, { recursive: true });

    for (const acc of ACCOUNTS) {
        const session = await signIn(acc);
        const state = {
            cookies: [],
            origins: [{
                origin: ORIGIN,
                localStorage: [{ name: STORAGE_KEY, value: JSON.stringify(session) }]
            }]
        };
        fs.writeFileSync(path.join(DIR, acc.file), JSON.stringify(state, null, 2));
    }
};

module.exports.playerState = path.join(DIR, 'player.json');
module.exports.adminState = path.join(DIR, 'admin.json');
