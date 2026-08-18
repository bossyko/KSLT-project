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
];

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
        .replace(/\{\{LIVE_ON\}\}/g, page.name === 'index' ? ' is-live' : '')
        .replace(/\{\{LIVE_CLASS\}\}/g, page.name === 'index' ? ' class="is-live"' : '');

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

const changed = { footer: 0, header: 0 };
const skipped = { footer: 0, header: 0 };
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

        const block = `${part.start}\n${fill(templates[part.key][lang], page)}${part.end}`;
        let next;

        if (html.includes(part.start) && html.includes(part.end)) {
            // Маркеры уже стоят — меняем то, что между ними
            next = html.replace(new RegExp(part.start + '[\\s\\S]*?' + part.end), block);
        } else {
            // Первый проход: оборачиваем существующий кусок маркерами
            const m = html.match(part.grab);
            if (!m) { skipped[part.key]++; continue; }
            next = html.replace(m[0], block + '\n');
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
    console.log('Шапка и футер совпадают с образцом на всех страницах.');
} else {
    for (const part of PARTS) {
        console.log(`${part.title}: обновлено ${changed[part.key]}` +
            (skipped[part.key] ? `, пропущено ${skipped[part.key]}` : ''));
    }
}
