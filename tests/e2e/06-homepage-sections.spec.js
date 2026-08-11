// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-HOME: Homepage sections and content blocks
 */

test.describe('Homepage RU — Sections', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
    });

    test('Hero section exists and has CTA', async ({ page }) => {
        const hero = page.locator('.hero, .hp-hero, [class*="hero"]').first();
        await expect(hero).toBeVisible();

        // Hero should have a CTA button or link
        const cta = hero.locator('a, button');
        const count = await cta.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Header is visible and fixed/sticky', async ({ page }) => {
        const header = page.locator('header');
        await expect(header).toBeVisible();

        const position = await header.evaluate(el => getComputedStyle(el).position);
        expect(['fixed', 'sticky']).toContain(position);
    });

    test('Scroll-to-top button appears on scroll', async ({ page }) => {
        // Scroll down
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.waitForTimeout(500);

        const scrollBtn = page.locator('.scroll-top, .back-to-top, [class*="scroll-top"], #scrollTop, [class*="totop"]');
        const count = await scrollBtn.count();
        if (count > 0) {
            await expect(scrollBtn.first()).toBeVisible();
        }
    });

    test('Footer is present at bottom', async ({ page }) => {
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
    });
});

test.describe('Homepage EN — Sections', () => {
    test('Hero section exists', async ({ page }) => {
        await page.goto('/index-en.html', { waitUntil: 'domcontentloaded' });
        const hero = page.locator('.hero, .hp-hero, [class*="hero"]').first();
        await expect(hero).toBeVisible();
    });
});

test.describe('Homepage KG — Sections', () => {
    test('Hero section exists', async ({ page }) => {
        await page.goto('/index-kg.html', { waitUntil: 'domcontentloaded' });
        const hero = page.locator('.hero, .hp-hero, [class*="hero"]').first();
        await expect(hero).toBeVisible();
    });
});
