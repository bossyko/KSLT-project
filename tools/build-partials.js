#!/usr/bin/env node
/**
 * Сборка общих кусков разметки
 * ============================
 *
 * Футер лежал скопированным в каждую из семидесяти страниц. Любая правка —
 * это семьдесят одинаковых правок, и достаточно один раз пропустить файл,
 * чтобы страницы разошлись. Так и вышло: на сайте оказалось три разных
 * футера, в одном — обрывок текста внутри ссылки, в другом — мёртвый блок.
 *
 * Теперь футер живёт в partials/footer-<язык>.html, а этот скрипт разносит
 * его по страницам между маркерами. В репозиторий по-прежнему коммитится
 * готовый статический HTML — GitHub Pages ничего собирать не умеет.
 *
 * Как пользоваться:
 *     node tools/build-partials.js          — разнести
 *     node tools/build-partials.js --check  — только проверить, ничего не писать
 *
 * Проверка нужна для тестов: она отвечает ненулевым кодом, если хоть одна
 * страница разошлась с образцом. Забыл пересобрать — узнаешь сразу.
 *
 * Подстановки в образце:
 *     {{ROOT}} — путь до корня сайта:  '' для index, '../' для pages/
 *     {{P}}    — путь до папки pages:  'pages/' для index, '' для pages/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const START = '<!-- FOOTER:START -->';
const END = '<!-- FOOTER:END -->';

const check = process.argv.includes('--check');

function langOf(file) {
    const base = path.basename(file, '.html');
    if (base.endsWith('-en')) return 'en';
    if (base.endsWith('-kg')) return 'kg';
    return 'ru';
}

/** Страницы в корне и в pages/ ссылаются друг на друга по-разному. */
function resolvePaths(tpl, inPagesDir) {
    return tpl
        .replace(/\{\{ROOT\}\}/g, inPagesDir ? '../' : '')
        .replace(/\{\{P\}\}/g, inPagesDir ? '' : 'pages/');
}

const templates = {};
for (const lang of ['ru', 'en', 'kg']) {
    templates[lang] = fs.readFileSync(
        path.join(ROOT, 'partials', `footer-${lang}.html`), 'utf8');
}

const files = [
    ...fs.readdirSync(ROOT).filter(f => /^index.*\.html$/.test(f)).map(f => path.join(ROOT, f)),
    ...fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html'))
        .map(f => path.join(ROOT, 'pages', f)),
];

let changed = 0, skipped = 0, drift = [];

for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const inPages = path.dirname(file).endsWith('pages');
    const footer = resolvePaths(templates[langOf(file)], inPages);
    const block = `${START}\n${footer}${END}`;

    let next;
    if (html.includes(START) && html.includes(END)) {
        // Маркеры уже стоят — меняем то, что между ними
        const re = new RegExp(START + '[\\s\\S]*?' + END);
        next = html.replace(re, block);
    } else {
        // Первый проход: оборачиваем существующий футер маркерами
        const m = html.match(/[ \t]*<footer[\s\S]*?<\/footer>\n?/);
        if (!m) { skipped++; continue; }
        next = html.replace(m[0], block + '\n');
    }

    if (next === html) continue;
    if (check) { drift.push(path.relative(ROOT, file)); continue; }
    fs.writeFileSync(file, next);
    changed++;
}

if (check) {
    if (drift.length) {
        console.error('Футер разошёлся с образцом на страницах:');
        drift.forEach(f => console.error('  ' + f));
        console.error('\nЗапусти: node tools/build-partials.js');
        process.exit(1);
    }
    console.log('Футер совпадает с образцом на всех страницах.');
} else {
    console.log(`Обновлено страниц: ${changed}` + (skipped ? `, без футера: ${skipped}` : ''));
}
