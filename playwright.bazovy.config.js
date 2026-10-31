// @ts-check
/**
 * СВЕРКА С БАЗОВЫМ СРЕЗОМ: НЫНЕШНИЕ ПРОБЫ ПО СТАРОМУ ПРОДУКТУ.
 *
 * ЗАЧЕМ. 30.10 полный прогон дал 173 падения в 20 файлах. Вопрос, на
 * который без прибора отвечают догадкой: уронила их моя правка или они
 * были красными до неё? Два разобранных куска оказались гнилью пятинедельной
 * давности, один — моим. Угадывать остальные нельзя: СНАЧАЛА ПОМЕРИТЬ,
 * ПОТОМ НАЗЫВАТЬ ПРОБЛЕМОЙ.
 *
 * ЧТО ЭТОТ КОНФИГ ДЕЛАЕТ. Берёт ПРОБЫ ИЗ РАБОЧЕГО ДЕРЕВА и отдаёт
 * браузеру СТАРЫЙ продукт из папки `_bazovy` — отдельного срез-дерева
 * (`git worktree`). Разница между этим прогоном и обычным — ровно в
 * продукте, а не в пробах.
 *
 * ПОЧЕМУ ПОРТ 8000, А НЕ СВОЙ. `tests/auth-setup.js` кладёт сессию в
 * storageState с origin, ЗАШИТЫМ как `http://localhost:8000`. На другом
 * порте браузер не отдаст эту запись странице, кабинет и админка решат
 * «гость», и сверка измерила бы не продукт, а свой же порт.
 * (Это и находка: origin в `auth-setup` дублирует `baseURL` конфига —
 * одно понятие в двух местах, записано в трекер.)
 *
 * ПОЭТОМУ `reuseExistingServer: false`. Если на 8000 уже висит сервер
 * рабочего дерева, прогон обязан УПАСТЬ, а не тихо померить новый
 * продукт старыми глазами. Сначала освободить порт:
 *     lsof -ti:8000 | xargs kill -9
 *
 *   npx playwright test --config=playwright.bazovy.config.js <файлы…>
 */
const { defineConfig } = require('@playwright/test');

require('./tests/test-db');

module.exports = defineConfig({
    testDir: './tests/e2e',
    globalSetup: require.resolve('./tests/auth-setup'),
    timeout: 30000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    /* БЕЗ ПОВТОРОВ: сверке нужен честный первый ответ, а не «со второго
       раза прошло». Мерцающие на сверке видны как падения — и это верно:
       нам важно, падало ли ДО правки, а не насколько оно устойчиво. */
    retries: 0,
    workers: 3,
    reporter: [
        ['json', { outputFile: 'tests/reports/results-bazovy.json' }],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:8000',
        headless: true,
        /* След на сверке не нужен: мы читаем только «упало или нет», а
           записи на каждый тест стоят места и времени. */
        screenshot: 'off',
        trace: 'off',
        viewport: { width: 1280, height: 800 }
    },
    /* ПЯТЬ ВИДОВ, А НЕ ОДИН — ПОПРАВКА К СЕБЕ, И ЕЁ ПОКАЗАЛ ПЕРВЫЙ ЖЕ
       ПРОГОН СВЕРКИ. Я написал «хватает одного вида» и прогнал только
       desktop. Замер по следу: все 35 падений кабинета и 35 админки
       лежат на `mobile`, `phone-landscape` и `tablet-landscape`, а на
       desktop их НЕТ НИ ОДНОГО. То есть сверка одним видом про них не
       сказала ничего, и я чуть не записал их в «моё» по пустому месту.
       ПРИБОР, СМОТРЯЩИЙ ЧАСТЬ, НЕ МЕРИТ НИЧЕГО — четырнадцатый раз.
       Виды перечислены все; какой нужен, выбирает зовущий:
         --project=mobile --project=phone-landscape
       Без `--project` пойдут все пять, и это дороже впятеро. */
    projects: [
        { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
        { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
        { name: 'mobile', use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
        { name: 'phone-landscape', use: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } },
        { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true } }
    ],
    webServer: {
        command: 'python3 -m http.server 8000 --directory _bazovy',
        port: 8000,
        reuseExistingServer: false,
        timeout: 15000
    }
});
