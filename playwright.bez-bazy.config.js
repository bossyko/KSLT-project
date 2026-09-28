// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * ПРОГОН БЕЗ БАЗЫ — всё, что можно проверить, пока Supabase в отказе.
 *
 * Общий конфиг (`playwright.config.js`) перед стартом входит в тестовую базу
 * за игрока и за администратора (`globalSetup: tests/auth-setup`). Пока
 * организация ограничена по трафику, Supabase отвечает 402, вход падает — и
 * НЕ ЗАПУСКАЕТСЯ НИ ОДИН тест, даже те сорок с лишним, которым база не нужна
 * вовсе. Именно это Костя видел в окне: один красный `auth-setup.js` и пустое
 * дерево.
 *
 * Здесь нет ни `globalSetup`, ни `require('./tests/test-db')`. Проверки
 * вёрстки от этого не теряют ничего: почти все они сами глушат ошибки
 * supabase (`!e.includes('supabase')`) и смотрят на разметку, а не на данные.
 *
 * Вдобавок прогон НЕ ЕСТ КВОТУ. В `tests/test-db.js` записано прямым текстом:
 * «прогон по боевой базе съедает месячную квоту трафика — из-за этого
 * организация уже уходила в льготный период».
 *
 *     npx playwright test --config=playwright.bez-bazy.config.js
 *     npx playwright test --config=playwright.bez-bazy.config.js --ui
 *
 * Второе — то, что открывает значок «КСЛТ Тесты» на рабочем столе.
 *
 * Пять видов: одна мышь и четыре пальца. Числа те же, что в общем конфиге,
 * чтобы находки одного прогона были сравнимы с находками другого.
 */
module.exports = defineConfig({
    testDir: './tests/e2e',

    /* ЧЕТЫРЕ ФАЙЛА СЮДА НЕ ВХОДЯТ, И У КАЖДОГО СВОЯ ПРИЧИНА.
       Это не «отключённые» тесты: они гоняются общим конфигом, когда база
       откроется. Здесь они исключены поимённо, чтобы исключение было видно,
       а не растворилось в фильтре.

       11-dashboard-page  — кабинет закрыт входом: test.use storageState
       12-admin-page      — админка закрыта входом: то же
       20-header-offsets  — снимки отступов на ЗАКРЫТЫХ страницах, тот же вход
       42-live-stranica   — открывает боевую страницу матча с настоящим id и
                            ждёт данные из базы; подменить их заглушкой
                            значило бы проверять выдумку вместо правды

       Сессии в tests/.auth/ от старого прогона лежат, но им 25.09: подняться
       с просроченной сессией — это проверить страницу входа, а не кабинет. */
    testIgnore: [
        '**/11-dashboard-page.spec.js',
        '**/12-admin-page.spec.js',
        '**/20-header-offsets.spec.js',
        '**/42-live-stranica.spec.js'
    ],

    timeout: 30000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    retries: 1,
    workers: 3,
    reporter: [
        ['html', { outputFolder: 'tests/reports/html-bez-bazy', open: 'never' }],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:8000',
        headless: true,
        screenshot: 'on',
        trace: 'on',
        viewport: { width: 1280, height: 800 }
    },
    projects: [
        { name: 'desktop',
          use: { viewport: { width: 1280, height: 800 } } },
        { name: 'tablet',
          use: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
        { name: 'mobile',
          use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
        { name: 'phone-landscape',
          use: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } },
        { name: 'tablet-landscape',
          use: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true } }
    ],
    webServer: {
        command: 'python3 -m http.server 8000',
        port: 8000,
        reuseExistingServer: true,
        timeout: 10000
    }
});
