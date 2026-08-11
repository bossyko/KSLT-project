// @ts-check
const { defineConfig } = require('@playwright/test');

// Тесты ходят в отдельную базу. Проверка стоит здесь, а не внутри тестов,
// чтобы прогон не начинался вовсе, если база не задана: молча уйти в боевую
// хуже, чем не запуститься.
require('./tests/test-db');

module.exports = defineConfig({
    testDir: './tests/e2e',
    // Вход за игрока и администратора: кабинет и админку иначе не проверить
    globalSetup: require.resolve('./tests/auth-setup'),
    timeout: 30000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    retries: 1,
    workers: 3,
    reporter: [
        ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
        ['json', { outputFile: 'tests/reports/results.json' }],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:8000',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 800 }
    },
    projects: [
        {
            name: 'desktop',
            use: { viewport: { width: 1280, height: 800 } }
        },
        {
            name: 'tablet',
            use: { viewport: { width: 768, height: 1024 } }
        },
        {
            name: 'mobile',
            use: { viewport: { width: 375, height: 812 } }
        }
    ],
    webServer: {
        command: 'python3 -m http.server 8000',
        port: 8000,
        reuseExistingServer: true,
        timeout: 10000
    }
});
