import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Настройки линтера: ловим имена, которых нет в области видимости.
 *
 * `node --check` находит только сломанный синтаксис. Ошибку в имени — вроде
 * ссылки на переменную из соседней функции или куска, оставшегося от прежней
 * правки, — он пропускает, а в браузере это падает при первом клике. Дважды
 * за день так ломалась админка: заявки переставали открываться.
 *
 * Гоняется вместе с остальными правилами: node tools/check-rules.js
 */
/**
 * ДОМА ПРОДУКТА СЧИТАЮТСЯ ИЗ КОДА, А НЕ ДЕРЖАТСЯ РУКАМИ (кусок 197, 27.10).
 *
 * Список `KSLT_*` перечислялся здесь вручную и отставал: куски 191 и 192
 * завели `KSLT_VREMYA` и `KSLT_CHISLA`, а конфиг о них не узнал — линтер
 * дал ДВЕНАДЦАТЬ `no-undef` на правильном коде. Узналось это только
 * сегодня, потому что `check-rules.js` НЕ ВХОДИТ в `check-vse.js`, и его
 * падения никто не видел.
 *
 * СПИСОК, КОТОРЫЙ ДЕРЖИТСЯ РУКАМИ, ОТСТАЁТ. Теперь имена берутся оттуда,
 * где дома объявляются: `window.KSLT_ИМЯ =` в `js/`.
 */
/**
 * 27.10, КУСОК 206: СЧИТАЛОСЬ С ПОЛОВИНЫ ПРОДУКТА. Обход шёл только по
 * `js/`, а приложение живёт в `mobile/www/js/` — и `KSLT_NEWS_MEDIA`,
 * объявленный там, давал три `no-undef` на живом коде. Шум прятал две
 * НАСТОЯЩИЕ беды: `AUTH` в `mobile/www/js/screens/rating.js` (экран
 * рейтинга падал на первом зове и оставался пустым) и `renderProfile()`
 * в `profile.js` — имя, которого в файле нет вовсе.
 *
 * Собираются ДВА признака, оба из кода: дом `window.KSLT_ИМЯ =` и
 * глобальная функция `function имя(` БЕЗ ОТСТУПА — внутри IIFE все
 * объявления с отступом, так что без отступа остаются только настоящие
 * глобали (`initSupabase` из `mobile/www/js/supabase-config.js`).
 */
const домаПродукта = (() => {
    const имена = {};
    const обойти = дир => {
        for (const э of readdirSync(дир, { withFileTypes: true })) {
            const п = join(дир, э.name);
            if (э.isDirectory()) { обойти(п); continue; }
            if (!э.name.endsWith('.js')) continue;
            const т = readFileSync(п, 'utf8');
            /* ПРИЗНАК, ИЩУЩИЙ ОДНО НАПИСАНИЕ, ВИДИТ ЧАСТЬ (кусок A3.7г, 29.10).
               Признак брал только `window.KSLT_ИМЯ =`, а ДЕСЯТЬ домов
               объявляются через параметр обёртки — `global.KSLT_ИМЯ =`
               внутри `(function (global) {…})(window)`: `KSLT_PLITKI`,
               `KSLT_KATEGORII`, `KSLT_POZDRAVLENIE`, `KSLT_VOZVRAT`,
               `KSLT_GRAFIK_DANNYE`, `KSLT_SCHYOT_MATCHA`, `KSLT_OKNO`,
               `KSLT_SETKA`, `KSLT_GROUPS`, `KSLT_POINTS`. Линтер давал 22
               `no-undef` на правильном коде — и шум прятал настоящие беды,
               ровно как в куске 206. */
            for (const м of т.matchAll(/(?:window|global|globalThis|self)\.(KSLT_[A-Za-zА-Яа-яЁё_]+)\s*=/g)) имена[м[1]] = 'readonly';
            for (const м of т.matchAll(/^function\s+([A-Za-zА-Яа-яЁё_$][\w$А-Яа-яЁё]*)\s*\(/gm)) имена[м[1]] = 'readonly';
        }
    };
    обойти('js');
    обойти('mobile/www/js');
    return имена;
})();

export default [
    {
        ignores: [
            'node_modules/**',
            'tests/reports/**',
            'mobile/android/**',
            'mobile/ios/**',
            'mobile/node_modules/**',
            '**/*.min.js',
            'js/vendor/**',
            'mobile/www/js/vendor/**'
        ]
    },
    {
        // Код для браузера: сайт и мобильное приложение
        files: ['js/**/*.js', 'mobile/www/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                window: 'readonly', document: 'readonly', console: 'readonly',
                fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
                setInterval: 'readonly', clearInterval: 'readonly',
                localStorage: 'readonly', sessionStorage: 'readonly',
                navigator: 'readonly', location: 'readonly', history: 'readonly',
                alert: 'readonly', confirm: 'readonly', prompt: 'readonly',
                Blob: 'readonly', URL: 'readonly', URLSearchParams: 'readonly',
                FormData: 'readonly', FileReader: 'readonly', Image: 'readonly',
                requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
                CustomEvent: 'readonly', Event: 'readonly', MutationObserver: 'readonly',
                IntersectionObserver: 'readonly', ResizeObserver: 'readonly',
                getComputedStyle: 'readonly', matchMedia: 'readonly',
                crypto: 'readonly', btoa: 'readonly', atob: 'readonly',
                caches: 'readonly', self: 'readonly', module: 'writable',
                globalThis: 'readonly', AbortController: 'readonly',
                /* 27.10: `File` не был объявлен, и линтер давал три
                   `no-undef` на `instanceof File` — это браузерный API, а
                   не дом продукта. */
                File: 'readonly', FileReader: 'readonly', Blob: 'readonly',
                performance: 'readonly',
                /* 27.10, кусок 202: глобали из соседних файлов продукта —
                   `tournament-generator.js` и `data/players-data*.js`.
                   Зовущие сами проверяют `typeof X !== 'undefined'`, то
                   есть это не ошибки, а необъявленные линтеру имена. */
                KSLT_ROUNDS: 'readonly', ROUND_DEFS: 'readonly',
                playersData: 'readonly', tournamentsData: 'readonly',

                // ДОМА ПРОДУКТА — СЧИТАНЫ ИЗ КОДА (см. верх файла)
                ...домаПродукта,

                // Свои глобалы: подключаются отдельными файлами в HTML
                supabaseClient: 'readonly', KSLT_PHONE: 'readonly',
                KSLT_SLOTS: 'readonly', newsArticleData: 'readonly',
                A: 'readonly', KSLT_GROUPS: 'readonly', KSLT_POINTS: 'readonly',
                KSLT_SETKA: 'readonly',
                KSLT_RULES: 'readonly', KSLT_AUTH: 'readonly', KSLT_APP: 'readonly',
                KSLT_I18N: 'readonly', KSLT_PUSH: 'readonly',
                SEED_POSITIONS: 'readonly', I18N: 'readonly',
                SUPABASE_URL: 'readonly', SUPABASE_ANON_KEY: 'readonly',

                // Внешние библиотеки
                supabase: 'readonly', Chart: 'readonly', XLSX: 'readonly',
                Cropper: 'readonly', firebase: 'readonly', Capacitor: 'readonly',
                QRCode: 'readonly', turnstile: 'readonly', screen: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-unreachable': 'error'
        }
    },
    {
        /* Наши инструменты: запускаются в Node.

           27.10, КУСОК 206: здесь было 30 находок, и все до одной —
           слепота настроек, а не беда в коде. ДВЕ ПРИЧИНЫ:

           1. `sourceType: 'script'` вместо `commonjs`. Node оборачивает
              модуль в функцию, поэтому `return` на верхнем уровне законен
              и прувер версий им пользуется, — а линтер звал это
              синтаксической ошибкой и ВООБЩЕ НЕ ЧИТАЛ файл.
           2. Замерщики пишут код для браузера строкой внутри
              `page.evaluate(...)`. Линтер читает его как свой и требует
              `document`. Браузерные имена объявлены ниже. */
        files: ['tools/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                require: 'readonly', module: 'writable', exports: 'writable',
                process: 'readonly', console: 'readonly',
                __dirname: 'readonly', __filename: 'readonly',
                Buffer: 'readonly', fetch: 'readonly', window: 'writable',
                global: 'writable', structuredClone: 'readonly',
                setTimeout: 'readonly', clearTimeout: 'readonly', URL: 'readonly',
                // имена для кода, который уезжает в браузер строкой
                document: 'readonly', getComputedStyle: 'readonly',
                location: 'readonly', navigator: 'readonly',
                localStorage: 'readonly', matchMedia: 'readonly',
                // дома продукта: сторожа поднимают их в `global`
                ...домаПродукта,
                KSLT_RULES: 'readonly', SEED_POSITIONS: 'readonly',
                KSLT_SETKA: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-unreachable': 'error'
        }
    }
];
