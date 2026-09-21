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
        /* ЗАПИСЬ ПРОГОНА — ВСЕГДА, А НЕ ТОЛЬКО ПРИ ПОВТОРЕ.
           Было trace: 'on-first-retry' — след пишется лишь когда тест упал
           и Playwright запускает его заново. Зелёный прогон не оставлял
           следа вовсе, и в окне нечего было листать: Костя 20.09 видел
           белый about:blank вместо страницы и не мог пройтись по времени.
           Теперь след пишется на каждом прогоне. Цена — место на диске
           (несколько мегабайт на тест) и доля секунды на запись; всё это
           лежит в tests/reports/ и в репозиторий не идёт. */
        screenshot: 'on',
        trace: 'on',
        viewport: { width: 1280, height: 800 }
    },
    // Пять проектов: одна мышь и четыре пальца.
    //
    // hasTouch ставится НЕ для красоты. Правила вёрстки написаны через
    // (pointer: coarse) — то есть спрашивают про палец, а не про ширину.
    // Без hasTouch узкое окно срабатывало бы у них по запасному условию
    // ширины, и набор проверял бы следствие вместо причины.
    //
    // 844 и 1024 — телефон и планшет ГОРИЗОНТАЛЬНО. Обе шире 768 и обе
    // сенсорные. Полоса между 769 и 1279 не покрывалась ничем, и ровно
    // там 20-21.09 нашлись h270 и h274 — оба ручным замером на
    // устройствах, ни один из 23 зелёных запусков их не видел.
    projects: [
        {
            name: 'desktop',
            use: { viewport: { width: 1280, height: 800 } }
        },
        {
            name: 'tablet',
            use: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true }
        },
        {
            name: 'mobile',
            use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true }
        },
        {
            // iPhone 12 Pro боком
            name: 'phone-landscape',
            use: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }
        },
        {
            // iPad Mini боком
            name: 'tablet-landscape',
            use: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }
        }
    ],
    webServer: {
        command: 'python3 -m http.server 8000',
        port: 8000,
        reuseExistingServer: true,
        timeout: 10000
    }
});
