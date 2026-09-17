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
export default [
    {
        ignores: [
            'node_modules/**',
            'tests/reports/**',
            'mobile/android/**',
            'mobile/ios/**',
            'mobile/node_modules/**',
            '**/*.min.js',
            'js/vendor/**'
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

                // Свои глобалы: подключаются отдельными файлами в HTML
                supabaseClient: 'readonly', KSLT_PHONE: 'readonly',
                KSLT_SLOTS: 'readonly', newsArticleData: 'readonly',
                A: 'readonly', KSLT_GROUPS: 'readonly', KSLT_POINTS: 'readonly',
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
        // Наши инструменты: запускаются в Node
        files: ['tools/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                require: 'readonly', module: 'writable', exports: 'writable',
                process: 'readonly', console: 'readonly',
                __dirname: 'readonly', __filename: 'readonly',
                Buffer: 'readonly', fetch: 'readonly', window: 'writable',
                global: 'writable'
            }
        },
        rules: {
            'no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-unreachable': 'error'
        }
    }
];
