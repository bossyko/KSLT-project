// ============================================
// Общие куски разметки собраны, а не скопированы
// ============================================
//
// Футер лежал скопированным в каждую из семидесяти страниц, и они разошлись:
// три разных варианта, в одном обрывок текста внутри ссылки, в другом целый
// блок мёртвых ссылок. Заметить это глазами нельзя — низ страницы читают
// редко.
//
// Теперь футер собирается скриптом из partials/. Эти проверки следят, чтобы
// он оставался собранным: забыл пересобрать после правки образца — тест
// скажет об этом сразу, а не через месяц.

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

test.describe('Партиалы', () => {
    test('футер на всех страницах совпадает с образцом', () => {
        // Скрипт отвечает ненулевым кодом, если хоть одна страница разошлась
        execFileSync('node', [path.join(ROOT, 'tools', 'build-partials.js'), '--check'],
            { cwd: ROOT, stdio: 'pipe' });
    });
});

const PAGES = [
    { path: '/index.html', lang: 'ru' },
    { path: '/index-en.html', lang: 'en' },
    { path: '/index-kg.html', lang: 'kg' },
    { path: '/pages/players.html', lang: 'ru' },
    { path: '/pages/courts-en.html', lang: 'en' },
];

test.describe('Футер', () => {
    for (const pg of PAGES) {
        test(`${pg.path} — без мёртвых ссылок`, async ({ page }) => {
            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
            const dead = await page.locator('.site-footer a[href="#"]').count();
            expect(dead, 'ссылка «в никуда» в футере').toBe(0);
        });
    }

    test('язык футера совпадает с языком страницы', async ({ page }) => {
        await page.goto('/pages/players-en.html', { waitUntil: 'domcontentloaded' });
        // Английская страница не должна вести из футера на русские
        const hrefs = await page.locator('.site-footer a').evaluateAll(
            els => els.map(e => e.getAttribute('href') || ''));
        const ruLinks = hrefs.filter(h =>
            /\.html/.test(h) && !/-en\.html/.test(h) && !/^https?:/.test(h));
        expect(ruLinks, 'ссылки не на английские страницы').toEqual([]);
    });
});
