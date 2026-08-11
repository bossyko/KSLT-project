// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-PWA: PWA manifest, service worker, meta tags
 */

test.describe('PWA — Manifest', () => {
    test('manifest.json is served and valid JSON', async ({ page }) => {
        const response = await page.goto('/manifest.json');
        expect(response.status()).toBe(200);

        const text = await response.text();
        const manifest = JSON.parse(text);

        expect(manifest.name).toBeTruthy();
        expect(manifest.short_name).toBeTruthy();
        expect(manifest.start_url).toBeTruthy();
        expect(manifest.display).toBe('standalone');
        expect(manifest.icons).toBeTruthy();
        expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    });

    test('Homepage links to manifest', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const manifestLink = page.locator('link[rel="manifest"]');
        await expect(manifestLink).toHaveCount(1);

        const href = await manifestLink.getAttribute('href');
        expect(href).toContain('manifest');
    });
});

test.describe('PWA — Service Worker', () => {
    test('sw.js is served', async ({ page }) => {
        const response = await page.goto('/sw.js');
        expect(response.status()).toBe(200);

        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('javascript');
    });
});

test.describe('PWA — Meta Tags', () => {
    const PAGES = [
        { path: '/', name: 'Homepage' },
        { path: '/pages/players.html', name: 'Players' },
        { path: '/pages/tournaments.html', name: 'Tournaments' },
    ];

    for (const pg of PAGES) {
        test(`${pg.name} has theme-color meta`, async ({ page }) => {
            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

            const themeMeta = page.locator('meta[name="theme-color"]');
            const count = await themeMeta.count();
            expect(count).toBeGreaterThanOrEqual(1);
        });

        test(`${pg.name} has viewport meta`, async ({ page }) => {
            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

            const viewport = page.locator('meta[name="viewport"]');
            await expect(viewport).toHaveCount(1);

            const content = await viewport.getAttribute('content');
            expect(content).toContain('width=device-width');
        });
    }
});

test.describe('PWA — Icons', () => {
    test('favicon.svg exists', async ({ page }) => {
        const response = await page.goto('/favicon.svg');
        expect(response.status()).toBe(200);
    });

    test('apple-touch-icon exists', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const appleIcon = page.locator('link[rel="apple-touch-icon"]');
        const count = await appleIcon.count();
        if (count > 0) {
            const href = await appleIcon.first().getAttribute('href');
            const response = await page.goto(href.startsWith('/') ? href : '/' + href);
            expect(response.status()).toBe(200);
        }
    });
});
