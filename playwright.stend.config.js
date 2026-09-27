// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * ПРОГОН ПО СТЕНДАМ — БЕЗ БАЗЫ ВОВСЕ.
 *
 * Общий конфиг перед стартом логинится в тестовую базу (`globalSetup`) и
 * без переменных окружения не запускается — это правильно для проверок
 * кабинета и админки, но стендам база не нужна: `supabaseClient` в них
 * подменён заглушкой, строки заготовлены, записи никуда не уходят.
 *
 * Поэтому здесь нет ни `globalSetup`, ни `tests/test-db`. Прогон работает,
 * когда Supabase в отказе, и — что важнее — НЕ ЕСТ КВОТУ. В `tests/test-db.js`
 * это записано прямым текстом: «прогон по боевой базе съедает месячную квоту
 * трафика — из-за этого организация уже уходила в льготный период».
 *
 *     npx playwright test --config=playwright.stend.config.js
 *
 * Пять видов: одна мышь и четыре пальца. Числа те же, что в общем конфиге,
 * чтобы находки одного прогона были сравнимы с находками другого.
 */
module.exports = defineConfig({
    testDir: './tests/e2e/design-system',
    testMatch: ['**/44-turniry.spec.js'],
    timeout: 30000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    retries: 1,
    workers: 3,
    reporter: [
        ['html', { outputFolder: 'tests/reports/html-stend', open: 'never' }],
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
