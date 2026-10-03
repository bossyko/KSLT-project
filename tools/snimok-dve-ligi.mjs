/**
 * СНИМОК ТУРНИРА С ДВУМЯ ЛИГАМИ — из ТЕСТОВОЙ базы.
 *
 * Зачем. Страница турнира по умолчанию смотрит в боевую
 * (`js/supabase-config.js:16`), а `test-dve-ligi` живёт в тестовой. Открытая
 * руками, она турнира не находит и показывает «Войдите» — хотя вход тут ни
 * при чём: `renderLockedPage` зовётся и когда турнир просто НЕ НАЙДЕН.
 *
 * Здесь адрес тестовой подставляется до загрузки страницы — ровно так же, как
 * это делают автотесты (`tests/fixtures.js:37`).
 *
 * Запускать при поднятом сервере:
 *     cd ~/Documents/KSLT && python3 -m http.server 8000     (в одном окне)
 *     node tools/snimok-dve-ligi.mjs                          (в другом)
 *
 * Кладёт снимок в snimki/dve-ligi.png и ПЕЧАТАЕТ, что на странице нашлось:
 * сколько таблиц итогов, какие у них заголовки и какие очки. Снимок —
 * для глаз, печать — для доказательства.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const db = require('../tests/test-db');

const АДРЕС = process.env.KSLT_URL ||
    'http://localhost:8000/pages/tournament.html?id=test-dve-ligi';

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
    await page.waitForSelector('.td-results-table', { timeout: 15000 });
} catch (e) {
    естьТаблица = false;
}

const заперта = await page.locator('.td-hero-locked').count();
if (заперта) {
    console.log('СТРАНИЦА ПОКАЗАЛА «ВОЙДИТЕ» — значит турнир НЕ НАЙДЕН в этой базе.');
    console.log('База, которую подставили:', db.url);
}

if (естьТаблица) {
    const м = await page.evaluate(() => {
        const t = [...document.querySelectorAll('.td-results-table')];
        return t.map(таб => ({
            заголовок: (таб.querySelector('.td-results-title') || {}).textContent?.trim(),
            строк: таб.querySelectorAll('tbody tr').length,
            очки: [...таб.querySelectorAll('.td-res-pts')].slice(1).map(e => e.textContent.trim())
        }));
    });
    console.log('\nТаблиц итогов на странице:', м.length);
    м.forEach(т => console.log('  · ' + т.заголовок + ' — строк ' + т.строк + ', очки ' + т.очки.join(' · ')));
}

mkdirSync('snimki', { recursive: true });
const куда = 'snimki/dve-ligi.png';
await page.screenshot({ path: куда, fullPage: true });
console.log('\nснимок: ' + куда);
console.log(ошибки.length ? 'ОШИБКИ СТРАНИЦЫ: ' + ошибки.slice(0, 3).join(' | ') : 'ошибок страницы нет');

await browser.close();
