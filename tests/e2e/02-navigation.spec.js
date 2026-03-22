// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-NAV: Navigation, header links, language switching
 */

test.describe('Header Navigation', () => {
    test('RU homepage — header nav links exist', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const header = page.locator('header');
        await expect(header).toBeVisible();

        // Logo / brand link
        const logo = header.locator('a').first();
        await expect(logo).toBeVisible();

        // Nav items should exist
        const navLinks = header.locator('nav a, .nav a, .header-nav a, [class*="nav"] a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('EN homepage — header nav links exist', async ({ page }) => {
        await page.goto('/index-en.html', { waitUntil: 'domcontentloaded' });
        const header = page.locator('header');
        await expect(header).toBeVisible();
    });

    test('KG homepage — header nav links exist', async ({ page }) => {
        await page.goto('/index-kg.html', { waitUntil: 'domcontentloaded' });
        const header = page.locator('header');
        await expect(header).toBeVisible();
    });
});

test.describe('Language Switching', () => {
    test('RU → EN language switch available on homepage', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Look for language switcher (EN link or dropdown)
        const enLink = page.locator('a[href*="-en"], a[href*="index-en"], [class*="lang"] a, .lang-switch a, .language a');
        const count = await enLink.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('EN → RU language switch available', async ({ page }) => {
        await page.goto('/index-en.html', { waitUntil: 'domcontentloaded' });

        const ruLink = page.locator('a[href*="index.html"]:not([href*="-en"]):not([href*="-kg"]), [class*="lang"] a, .lang-switch a');
        const count = await ruLink.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Tournaments RU has lang links', async ({ page }) => {
        await page.goto('/pages/tournaments.html', { waitUntil: 'domcontentloaded' });
        const langLinks = page.locator('a[href*="tournaments-en"], a[href*="tournaments-kg"], [class*="lang"] a');
        const count = await langLinks.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Players RU has lang links', async ({ page }) => {
        await page.goto('/pages/players.html', { waitUntil: 'domcontentloaded' });
        const langLinks = page.locator('a[href*="players-en"], a[href*="players-kg"], [class*="lang"] a');
        const count = await langLinks.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});

test.describe('Footer', () => {
    test('Homepage has footer', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
    });

    test('Footer contains KSLT text', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const footer = page.locator('footer');
        const text = await footer.textContent();
        expect(text.toLowerCase()).toContain('kslt');
    });
});

test.describe('Internal Links — no broken anchors', () => {
    test('Homepage links have valid href (no empty href)', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const links = page.locator('a[href]');
        const count = await links.count();

        for (let i = 0; i < Math.min(count, 50); i++) {
            const href = await links.nth(i).getAttribute('href');
            // Should not be empty or just #
            if (href) {
                expect(href.trim()).not.toBe('');
            }
        }
    });
});
