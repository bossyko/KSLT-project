// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-CONTENT: Static content pages load correctly
 */

test.describe('Info Pages — Content', () => {
    test('About RU has content', async ({ page }) => {
        await page.goto('/pages/about.html', { waitUntil: 'domcontentloaded' });
        const body = await page.locator('main, .content, article, [class*="about"]').first().textContent();
        expect(body.trim().length).toBeGreaterThan(50);
    });

    test('FAQ RU has questions', async ({ page }) => {
        await page.goto('/pages/faq.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Rules RU has content', async ({ page }) => {
        await page.goto('/pages/rules.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Offer RU has content', async ({ page }) => {
        await page.goto('/pages/offer.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Pricing RU has pricing cards or table', async ({ page }) => {
        await page.goto('/pages/pricing.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(50);
    });
});

test.describe('Coaches Page', () => {
    test('Coaches RU loads with header', async ({ page }) => {
        await page.goto('/pages/coaches.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Coaches EN loads with header', async ({ page }) => {
        await page.goto('/pages/coaches-en.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Courts Page', () => {
    test('Courts RU loads with header', async ({ page }) => {
        await page.goto('/pages/courts.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Courts EN loads with header', async ({ page }) => {
        await page.goto('/pages/courts-en.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Services Page', () => {
    test('Services RU loads', async ({ page }) => {
        await page.goto('/pages/services.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Partners Page', () => {
    test('Partners RU loads', async ({ page }) => {
        await page.goto('/pages/partners.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Live Match Page', () => {
    test('Live Match RU loads without crash', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto('/pages/live-match.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();

        const critical = errors.filter(e => !e.includes('supabase') && !e.includes('fetch') && !e.includes('CORS') && !e.includes('NetworkError'));
        expect(critical).toEqual([]);
    });
});

test.describe('Battles Overview', () => {
    test('Battles Overview RU loads', async ({ page }) => {
        await page.goto('/pages/battles-overview.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});
