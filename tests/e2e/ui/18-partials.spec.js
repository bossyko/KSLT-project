// ============================================
// Общие куски разметки собраны, а не скопированы
// ============================================
//
// Футер и шапка лежали скопированными в каждую из семидесяти страниц, и они
// разошлись: три разных футера, в одном обрывок текста внутри ссылки; ссылка
// Live с русской страницы вела на английскую главную, а на киргизской главной
// кнопка «Кирүү» не вела никуда. Заметить это глазами нельзя.
//
// Теперь оба куска собираются скриптом из partials/. Эти проверки следят,
// чтобы они оставались собранными: забыл пересобрать после правки образца —
// тест скажет об этом сразу, а не через месяц.

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

test.describe('Партиалы', () => {
    test('шапка и футер на всех страницах совпадают с образцом', () => {
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

test.describe('Шапка', () => {
    test('подсвечен раздел, которому принадлежит страница', async ({ page }) => {
        await page.goto('/pages/players.html', { waitUntil: 'domcontentloaded' });
        const active = await page.locator('.nav-links .nav-item.active').allTextContents();
        expect(active.map(t => t.trim()), 'подсвечен один пункт — Рейтинг').toEqual(['Рейтинг']);

        // В мобильном меню — тот же раздел
        const mobile = await page.locator('.mobile-nav .mobile-dropdown-toggle.active').count();
        expect(mobile, 'в мобильном меню подсвечен один пункт').toBe(1);
    });

    test('карточка внутри раздела подсвечена как раздел', async ({ page }) => {
        await page.goto('/pages/coach.html', { waitUntil: 'domcontentloaded' });
        const active = await page.locator('.nav-links .nav-item.active').allTextContents();
        expect(active.map(t => t.trim()), 'карточка тренера — это Услуги').toEqual(['Услуги']);
    });

    test('на главной не подсвечен никакой раздел', async ({ page }) => {
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('.nav-links .nav-item.active').count()).toBe(0);
    });

    test('переключатель языка ведёт на ту же страницу', async ({ page }) => {
        await page.goto('/pages/players-en.html', { waitUntil: 'domcontentloaded' });
        const hrefs = await page.locator('.lang-menu .lang-option').evaluateAll(
            els => els.map(e => e.getAttribute('href')));
        expect(hrefs, 'языки ведут на ту же страницу, а не на главную')
            .toEqual(['players.html', 'players-kg.html', 'players-en.html']);

        const mobile = await page.locator('.mobile-lang-list .mobile-lang-option').evaluateAll(
            els => els.map(e => e.getAttribute('href')));
        expect(mobile, 'в мобильном меню — тоже').toEqual(hrefs);
    });

    test('ссылка Live ведёт на главную своего языка', async ({ page }) => {
        await page.goto('/pages/about-en.html', { waitUntil: 'domcontentloaded' });
        const href = await page.locator('.nav-item-live').getAttribute('href');
        expect(href, 'с английской страницы — на английскую главную')
            .toBe('../index-en.html#live');
    });

    test('кнопка входа ведёт на страницу входа своего языка', async ({ page }) => {
        await page.goto('/index-kg.html', { waitUntil: 'domcontentloaded' });
        const href = await page.locator('.nav-right .btn-auth').getAttribute('href');
        expect(href, 'на киргизской главной кнопка входа вела в никуда')
            .toBe('pages/auth-kg.html');
    });
});
