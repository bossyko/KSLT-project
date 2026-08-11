/**
 * Общая обвязка для автотестов.
 *
 * Заменяет `require('@playwright/test')` в файлах проверок: делает то же
 * самое, но перед загрузкой каждой страницы подставляет адрес тестовой базы.
 *
 *     const { test, expect } = require('../fixtures');
 *
 * Сайт читает его из window.KSLT_DB (js/supabase-config.js). Без подстановки
 * страница ушла бы в боевую базу — тысяча шестьсот прогонов оставили бы там
 * мусор и потратили месячную квоту трафика.
 */

const base = require('@playwright/test');
const db = require('./test-db');

const test = base.test.extend({
    context: async ({ context }, use) => {
        await context.addInitScript(function(cfg) {
            window.KSLT_DB = cfg;
        }, { url: db.url, key: db.key });
        await use(context);
    }
});

module.exports = { test, expect: base.expect, db };
