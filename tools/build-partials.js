#!/usr/bin/env node
/**
 * Сборка общих кусков разметки
 * ============================
 *
 * Футер и шапка лежали скопированными в каждую из семидесяти с лишним
 * страниц. Любая правка — это семьдесят одинаковых правок, и достаточно
 * один раз пропустить файл, чтобы страницы разошлись. Так и вышло: на сайте
 * оказалось три разных футера, а ссылка Live с русской страницы вела на
 * английскую главную.
 *
 * Теперь оба куска живут в partials/<кусок>-<язык>.html, а этот скрипт
 * разносит их по страницам между маркерами. В репозиторий по-прежнему
 * коммитится готовый статический HTML — GitHub Pages ничего собирать не умеет.
 *
 * Как пользоваться:
 *     node tools/build-partials.js          — разнести
 *     node tools/build-partials.js --check  — только проверить, ничего не писать
 *
 * Проверка нужна для тестов: она отвечает ненулевым кодом, если хоть одна
 * страница разошлась с образцом. Забыл пересобрать — узнаешь сразу.
 *
 * Подстановки в образце:
 *     {{ROOT}}       — путь до корня сайта:  '' для index, '../' для pages/
 *     {{P}}          — путь до папки pages:  'pages/' для index, '' для pages/
 *     {{LANG_RU|KG|EN}} — эта же страница на другом языке
 *     {{ACTIVE:раздел}} — ' active' на страницах своего раздела, иначе пусто
 *     {{LIVE}}       — якорь #live на главной, ссылка на главную с остальных
 *     {{LIVE_ON}} / {{LIVE_CLASS}} — подсветка Live, только на главной
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

/** Два куска разметки. grab ловит исходный блок при первом проходе. */
const PARTS = [
    {
        key: 'footer', title: 'Футер',
        start: '<!-- FOOTER:START -->', end: '<!-- FOOTER:END -->',
        grab: /[ \t]*<footer[\s\S]*?<\/footer>\n?/,
    },
    {
        key: 'header', title: 'Шапка',
        start: '<!-- HEADER:START -->', end: '<!-- HEADER:END -->',
        grab: /[ \t]*<header[\s\S]*?<\/header>\n?/,
    },
    {
        key: 'csp', title: 'Политика безопасности',
        start: '<!-- CSP:START -->', end: '<!-- CSP:END -->',
        grab: /[ \t]*<meta http-equiv="Content-Security-Policy"[^>]*>\n?/,
        /* У восьми страниц политики нет вовсе — вставляем её после viewport,
           а не пропускаем файл. */
        after: /[ \t]*<meta name="viewport"[^>]*>\n?/,
    },
];

/* ══ ПОЛИТИКА БЕЗОПАСНОСТИ — ОДНО ОБЪЯВЛЕНИЕ НА 92 СТРАНИЦЫ ═════════════
 *
 * Померено 13.10: политика была написана руками в каждой странице, и это
 * дало ВОСЕМЬ разных вариантов плюс ВОСЕМЬ страниц без политики вовсе —
 * девять состояний одного понятия. Без политики стояли три страницы входа
 * и английская админка.
 *
 * Та же беда, что была с шапкой и подвалом: текст, скопированный в 92
 * файла, расходится сам. Лечится тем же — одним объявлением и машиной.
 *
 * БАЗА плюс НАДОБНОСТИ. Страница не пишет политику, а называет, что ей
 * нужно: карты, ролики, живой счёт, вход, таблицы. Чего не названо — того
 * в политике нет.
 */

const CSP_БАЗА = {
    'default-src': ["'self'"],
    'script-src':  ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com',
                    'https://unpkg.com', 'https://cdnjs.cloudflare.com',
                    'https://accounts.google.com'],
    'style-src':   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com',
                    'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
    'font-src':    ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
    'img-src':     ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://www.google-analytics.com',
                    'https://www.googletagmanager.com', 'https://*.supabase.co',
                    'https://accounts.google.com'],
    'media-src':   ["'self'"],
};

const CSP_НАДОБНОСТИ = {
    /* Карта заведения и корта — встроенный кадр Google. */
    карты:   { 'frame-src': ['https://maps.google.com', 'https://www.google.com'] },
    /* Ролики в новостях: список закрыт в js/kslt-video.js:29-47. */
    ролики:  { 'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com',
                             'https://player.vimeo.com', 'https://www.instagram.com'] },
    /* Трансляция матча — только YouTube. */
    ютуб:    { 'frame-src': ['https://www.youtube.com'] },
    /* Счёт идёт по вебсокету: realtime зовут только live-match.js и scoreboard.js. */
    живой:   { 'connect-src': ['wss://*.supabase.co'] },
    /* Вход: Turnstile грузит скрипт, кадр и ходит на свой хост. ИМЕННО
       ЭТОГО ХОСТА НЕ БЫЛО В ОБЩЕЙ ПОЛИТИКЕ — поэтому страницы входа и
       остались без неё вовсе, иначе вход бы сломался. */
    /* ПОПРАВКА К СЕБЕ, 13.10. Первым заходом я дописал сюда
       `frame-src accounts.google.com` — «Google открывает своё окно сам».
       Прочитал код: `client.auth.signInWithOAuth` (js/auth.js:1792) уводит
       на страницу Google ЦЕЛИКОМ, кадра нет. Вход через Telegram идёт своим
       потоком `functions/v1/telegram-auth` (js/auth.js:1964), виджета
       telegram.org на странице нет. Кадр на входе нужен ровно один —
       Turnstile. Лишнее разрешение снято. */
    вход:    { 'script-src':  ['https://challenges.cloudflare.com'],
               'frame-src':   ['https://challenges.cloudflare.com'],
               'connect-src': ['https://challenges.cloudflare.com'] },
    /* Админка: выгрузка в Excel и перевод пустых полей. */
    таблицы: { 'script-src':  ['https://cdn.sheetjs.com'],
               'img-src':     ['blob:'],
               'connect-src': ['https://api.mymemory.translated.net'] },
};

/**
 * Что нужно странице. Ключ — имя БЕЗ языкового хвоста; где язык важен,
 * стоит полное имя файла и оно сильнее.
 *
 * ПОПРАВКА К СЕБЕ, 13.10. Я дал `admin-en.html` всё, что нужно русской
 * админке: таблицы, переводчик, шесть источников кадров. Прочитал файл —
 * это 25 строк ПЕРЕНАПРАВЛЕНИЯ на русскую админку, и решение «админка
 * ведётся только на русском» написано прямо в нём. Скриптов там нет
 * вообще. Широкая политика на странице-заглушке — ослабление ни за чем,
 * ровно то, в чём я упрекал лендинги en и kg.
 */
const CSP_СТРАНИЦЫ = {
    'admin-en':    [],
    'live-match':  ['ютуб', 'живой', 'карты'],
    'scoreboard':  ['живой'],
    'news':        ['ролики'],
    'challenge':   ['карты'],
    'court':       ['карты'],
    'tournament':  ['карты'],
    'admin':       ['карты', 'ролики', 'таблицы'],
    'auth':        ['вход'],
};

function cspДляСтраницы(page) {
    const политика = {};
    for (const д of Object.keys(CSP_БАЗА)) политика[д] = CSP_БАЗА[д].slice();
    const надобности = CSP_СТРАНИЦЫ[page.base] || CSP_СТРАНИЦЫ[page.name] || [];
    for (const н of надобности) {
        const добавка = CSP_НАДОБНОСТИ[н];
        for (const д of Object.keys(добавка)) {
            if (!политика[д]) политика[д] = [];
            for (const и of добавка[д]) {
                if (политика[д].indexOf(и) === -1) политика[д].push(и);
            }
        }
    }
    const текст = Object.keys(политика)
        .map(д => д + ' ' + политика[д].join(' '))
        .join('; ') + ';';
    return '    <meta http-equiv="Content-Security-Policy" content="' + текст + '">\n';
}

/**
 * Какой пункт меню подсвечен на какой странице.
 * Имя страницы — без языкового хвоста. Чего нет в карте, то без подсветки:
 * вход, кабинет, админка, трансляция, скачивание, табло, судья.
 */
const SECTION = {
    'tournaments': 'tournaments',
    'tournaments-overview': 'tournaments',
    'tournament': 'tournaments',
    'battles-overview': 'tournaments',
    'challenge': 'tournaments',
    'players': 'rankings',
    'player': 'rankings',
    'services': 'services',
    'courts': 'services',
    'court': 'services',
    'coaches': 'services',
    'coach': 'services',
    'partners': 'services',
    'news': 'news',
    'info': 'info',
    'about': 'info',
    'faq': 'info',
    'rules': 'info',
    'pricing': 'info',
    'offer': 'info',
    'terms': 'info',
    'privacy-policy': 'info',
    'sponsors': 'info',
};

const SECTIONS = ['tournaments', 'rankings', 'services', 'news', 'info'];

/**
 * Пять страниц остаются со своей шапкой.
 * У админки нет киргизской версии — общая шапка увела бы с неё на пустую
 * ссылку. У админки и кабинета вместо «Войти» стоит «Выйти», и в мобильном
 * меню это единственная кнопка выхода на всём сайте — общая шапка её сотрёт.
 */
const NO_HEADER = new Set(['admin', 'admin-en', 'dashboard', 'dashboard-en', 'dashboard-kg']);

function langOf(base) {
    if (base.endsWith('-en')) return 'en';
    if (base.endsWith('-kg')) return 'kg';
    return 'ru';
}

const templates = {};
for (const part of PARTS) {
    /* У политики безопасности образец не лежит в файле: он СЧИТАЕТСЯ из
       базы и надобностей страницы. Языка у неё нет. */
    if (part.key === 'csp') continue;
    templates[part.key] = {};
    for (const lang of ['ru', 'en', 'kg']) {
        templates[part.key][lang] = fs.readFileSync(
            path.join(ROOT, 'partials', `${part.key}-${lang}.html`), 'utf8');
    }
}

/** Подставляет в образец всё, что зависит от конкретной страницы. */
function fill(tpl, page) {
    const root = page.inPages ? '../' : '';
    const name = page.name;          // имя без языкового хвоста: 'players', 'index'
    const live = page.name === 'index'
        ? '#live'
        : `${root}index${page.suffix}.html#live`;

    let out = tpl
        .replace(/\{\{ROOT\}\}/g, root)
        .replace(/\{\{P\}\}/g, page.inPages ? '' : 'pages/')
        .replace(/\{\{LANG_RU\}\}/g, `${name}.html`)
        .replace(/\{\{LANG_KG\}\}/g, `${name}-kg.html`)
        .replace(/\{\{LANG_EN\}\}/g, `${name}-en.html`)
        .replace(/\{\{LIVE\}\}/g, live)
        // Огонёк Live больше не проставляется при сборке: он горел на главной
        // всегда, даже когда никто не играл. Теперь его зажигает script.js,
        // спросив базу, — и делает это на всех страницах, а не только тут
        .replace(/\{\{LIVE_ON\}\}/g, '')
        .replace(/\{\{LIVE_CLASS\}\}/g, '');

    for (const s of SECTIONS) {
        out = out.replace(new RegExp(`\\{\\{ACTIVE:${s}\\}\\}`, 'g'),
            SECTION[name] === s ? ' active' : '');
    }
    return out;
}

const files = [
    ...fs.readdirSync(ROOT).filter(f => /^index.*\.html$/.test(f)).map(f => path.join(ROOT, f)),
    ...fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, 'pages', f)),
];

const changed = { footer: 0, header: 0, csp: 0 };
const skipped = { footer: 0, header: 0, csp: 0 };
const drift = [];

for (const file of files) {
    const base = path.basename(file, '.html');
    const lang = langOf(base);
    const page = {
        base,
        name: base.replace(/-(en|kg)$/, ''),
        suffix: lang === 'ru' ? '' : `-${lang}`,
        inPages: path.dirname(file).endsWith('pages'),
    };

    let html = fs.readFileSync(file, 'utf8');
    const original = html;

    for (const part of PARTS) {
        if (part.key === 'header' && NO_HEADER.has(base)) { skipped.header++; continue; }

        const образец = part.key === 'csp'
            ? cspДляСтраницы(page)
            : fill(templates[part.key][lang], page);
        const block = `${part.start}\n${образец}${part.end}`;
        let next;

        if (html.includes(part.start) && html.includes(part.end)) {
            // Маркеры уже стоят — меняем то, что между ними
            next = html.replace(new RegExp(part.start + '[\\s\\S]*?' + part.end), block);
        } else {
            // Первый проход: оборачиваем существующий кусок маркерами
            const m = html.match(part.grab);
            if (m) {
                next = html.replace(m[0], block + '\n');
            } else if (part.after) {
                /* Политики на странице не было вовсе — ставим её после
                   viewport, а не пропускаем файл молча. */
                const a = html.match(part.after);
                if (!a) { skipped[part.key]++; continue; }
                next = html.replace(a[0], a[0] + block + '\n');
            } else { skipped[part.key]++; continue; }
        }

        if (next !== html) { changed[part.key]++; html = next; }
    }

    if (html === original) continue;
    if (check) { drift.push(path.relative(ROOT, file)); continue; }
    fs.writeFileSync(file, html);
}

if (check) {
    if (drift.length) {
        console.error('Общие куски разошлись с образцом на страницах:');
        drift.forEach(f => console.error('  ' + f));
        console.error('\nЗапусти: node tools/build-partials.js');
        process.exit(1);
    }
    console.log('Шапка, футер и политика безопасности совпадают с образцом на всех страницах.');
} else {
    for (const part of PARTS) {
        console.log(`${part.title}: обновлено ${changed[part.key]}` +
            (skipped[part.key] ? `, пропущено ${skipped[part.key]}` : ''));
    }
}
