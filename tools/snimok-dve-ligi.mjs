/**
 * СНИМОК ТУРНИРА С ДВУМЯ ЛИГАМИ — из ТЕСТОВОЙ базы.
 *
 * Запускать ОДНОЙ командой, сервер поднимать не надо:
 *     cd ~/Documents/KSLT && node tools/snimok-dve-ligi.mjs
 *
 * Зачем. Страница турнира по умолчанию смотрит в боевую
 * (`js/supabase-config.js:16`), а `test-dve-ligi` живёт в тестовой. Открытая
 * руками, она турнира не находит и показывает «Войдите» — хотя вход тут ни
 * при чём: `renderLockedPage` зовётся и когда турнир просто НЕ НАЙДЕН.
 *
 * Адрес тестовой подставляется до загрузки страницы — тем же способом, что
 * у автотестов (`tests/fixtures.js:37`).
 *
 * СЕРВЕР ПОДНИМАЕТСЯ ЗДЕСЬ ЖЕ, на свободном порту. Первая редакция требовала
 * второго окна с `python3 -m http.server`, и прогон упал на
 * ERR_CONNECTION_REFUSED, когда его забыли поднять. ШАГ, КОТОРЫЙ МОЖНО
 * УБРАТЬ, УБИРАЕТСЯ, А НЕ ОПИСЫВАЕТСЯ В ПАМЯТКЕ.
 *
 * Кладёт снимок в snimki/dve-ligi.png и ПЕЧАТАЕТ, что нашлось на странице:
 * сколько таблиц итогов, их заголовки и очки. Снимок — для глаз, печать —
 * для доказательства.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, createReadStream, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const db = require('../tests/test-db');

const КОРЕНЬ = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const ТИПЫ = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico':  'image/x-icon',
    '.woff2':'font/woff2'
};

const сервер = createServer((req, res) => {
    /* Выход за корень закрыт: normalize снимает «..», путь остаётся внутри. */
    const путь = join(КОРЕНЬ, normalize(decodeURIComponent(req.url.split('?')[0])));
    if (!путь.startsWith(КОРЕНЬ) || !existsSync(путь) || statSync(путь).isDirectory()) {
        res.writeHead(404); res.end('нет такого файла'); return;
    }
    res.writeHead(200, { 'Content-Type': ТИПЫ[extname(путь).toLowerCase()] || 'application/octet-stream' });
    createReadStream(путь).pipe(res);
});

await new Promise(готово => сервер.listen(0, '127.0.0.1', готово));
const порт = сервер.address().port;
const АДРЕС = process.env.KSLT_URL ||
    'http://127.0.0.1:' + порт + '/pages/tournament.html?id=test-dve-ligi';
console.log('сервер поднят на порту', порт);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addInitScript(cfg => { window.KSLT_DB = cfg; }, { url: db.url, key: db.key });
const page = await ctx.newPage();

const ошибки = [];
page.on('pageerror', e => ошибки.push(e.message));

await page.goto(АДРЕС, { waitUntil: 'domcontentloaded' });

/* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: таблица итогов появляется после ответа
   базы, и ожидание «сеть замолчала» поймало бы пустую страницу. */
let естьТаблица = true;
try {
    await page.waitForSelector('.td-results-table', { timeout: 20000 });
} catch (e) {
    естьТаблица = false;
}

if (await page.locator('.td-hero-locked').count()) {
    console.log('\nСТРАНИЦА ПОКАЗАЛА «ВОЙДИТЕ» — значит турнир НЕ НАЙДЕН в этой базе.');
    console.log('База, которую подставили:', db.url);
}

if (естьТаблица) {
    /* НАЗВАНИЕ ЛИГИ ЖИВЁТ НА ПЬЕДЕСТАЛЕ, А НЕ НАД ТАБЛИЦЕЙ. Первая редакция
       прибора брала только `.td-results-title` и падала на `undefined`, когда
       заголовок переехал. Падение было верным по сути — заголовка там и не
       должно быть, — но прибор обязан СКАЗАТЬ это, а не рухнуть. Ищем
       название ближайшим заголовком выше: пьедестал лиги или свой. */
    const м = await page.evaluate(() => {
        const текст = э => (э && э.textContent ? э.textContent.trim() : '');
        return [...document.querySelectorAll('.td-results-table')].map(таб => {
            let имя = текст(таб.querySelector('.td-results-title'));
            if (!имя) {
                let выше = таб.previousElementSibling;
                while (выше && !имя) {
                    if (выше.classList && выше.classList.contains('td-league-title')) имя = текст(выше);
                    выше = выше.previousElementSibling;
                }
            }
            return {
                заголовок: имя || '(без заголовка)',
                строк: таб.querySelectorAll('tbody tr').length,
                очки: [...таб.querySelectorAll('.td-res-pts')].slice(1).map(e => текст(e))
            };
        });
    });
    const пьедесталы = await page.evaluate(() =>
        [...document.querySelectorAll('.td-podium')].map(п => ({
            лига: (() => {
                let в = п.previousElementSibling;
                while (в) {
                    if (в.classList && в.classList.contains('td-league-title')) return в.textContent.trim();
                    в = в.previousElementSibling;
                }
                return '(без названия)';
            })(),
            мест: п.children.length
        })));

    console.log('\nПьедесталов на странице:', пьедесталы.length);
    пьедесталы.forEach(п => console.log('  · ' + п.лига + ' — мест ' + п.мест));

    console.log('\nТаблиц итогов на странице:', м.length);
    м.forEach(т => console.log('  · ' + т.заголовок + ' — строк ' + т.строк +
        ', очки ' + т.очки.join(' · ')));
}

mkdirSync(join(КОРЕНЬ, 'snimki'), { recursive: true });
const куда = join(КОРЕНЬ, 'snimki', 'dve-ligi.png');
await page.screenshot({ path: куда, fullPage: true });
console.log('\nснимок: snimki/dve-ligi.png');
console.log(ошибки.length ? 'ОШИБКИ СТРАНИЦЫ: ' + ошибки.slice(0, 3).join(' | ')
                          : 'ошибок страницы нет');

await browser.close();
сервер.close();
