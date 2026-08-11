/**
 * База для автотестов.
 *
 * Тестов тысяча шестьсот, каждый открывает страницы и тянет картинки. Прогон
 * по боевой базе оставляет в ней мусор и съедает месячную квоту трафика — из-за
 * этого организация уже уходила в льготный период.
 *
 * Адрес отдельного проекта задаётся переменными окружения, чтобы ключ не жил
 * в репозитории вместе с кодом:
 *
 *     KSLT_TEST_DB_URL=https://xxxxx.supabase.co
 *     KSLT_TEST_DB_KEY=sb_publishable_...
 *
 * Их удобно держать в .env.test — он не отслеживается git.
 *
 * Переменных нет — тесты не запускаются вовсе. Это намеренно: молча уйти в
 * боевую базу хуже, чем не запуститься.
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
    const file = path.join(__dirname, '..', '.env.test');
    if (!fs.existsSync(file)) return;
    fs.readFileSync(file, 'utf8').split('\n').forEach(function(line) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
}

loadEnvFile();

const url = process.env.KSLT_TEST_DB_URL;
const key = process.env.KSLT_TEST_DB_KEY;

if (!url || !key) {
    throw new Error(
        '\n\nНе задана база для тестов.\n\n' +
        'Тесты ходят в отдельный проект Supabase, а не в боевой: иначе они\n' +
        'оставляют в нём мусор и съедают месячную квоту трафика.\n\n' +
        'Создай файл .env.test рядом с playwright.config.js:\n\n' +
        '  KSLT_TEST_DB_URL=https://xxxxx.supabase.co\n' +
        '  KSLT_TEST_DB_KEY=sb_publishable_...\n\n' +
        'Адрес и ключ — в настройках тестового проекта Supabase, раздел API.\n'
    );
}

if (url.includes('qqkzszesviukopgjbead')) {
    throw new Error(
        '\n\nВ .env.test указана боевая база.\n\n' +
        'Тесты заведут в ней сотни записей и потратят квоту трафика.\n' +
        'Нужен адрес отдельного тестового проекта.\n'
    );
}

module.exports = { url, key };
