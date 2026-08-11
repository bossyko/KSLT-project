// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-DASHBOARD: Dashboard page structure tests
 * Tests public-facing elements load without auth dependency errors
 * Dashboard requires auth, so we test structural HTML elements only
 */

const DASHBOARD_PAGES = [
    { path: '/pages/dashboard.html', lang: 'RU', name: 'Dashboard RU' },
    { path: '/pages/dashboard-en.html', lang: 'EN', name: 'Dashboard EN' },
    { path: '/pages/dashboard-kg.html', lang: 'KG', name: 'Dashboard KG' },
];

// Helper: filter out non-critical JS errors (Supabase, auth redirects, network)
function filterCriticalErrors(errors) {
    return errors.filter(e =>
        !e.includes('supabase') &&
        !e.includes('Supabase') &&
        !e.includes('fetch') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !e.includes('net::ERR') &&
        !e.includes('CORS') &&
        !e.includes('auth') &&
        !e.includes('session') &&
        !e.includes('getSession') &&
        !e.includes('getUser') &&
        !e.includes('redirect') &&
        !e.includes('null')
    );
}

test.describe('Dashboard Page — Load without crash', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${dashPage.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Dashboard Page — Structure', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Has header element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${dashPage.name}: Has KSLT logo`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('.logo-img').first()).toBeVisible();
        });

        test(`${dashPage.name}: Has profile section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const profileSection = page.locator('#db-profile');
            expect(await profileSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has stats section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const statsSection = page.locator('#db-stats');
            expect(await statsSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has games section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const gamesSection = page.locator('#db-games');
            expect(await gamesSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has sidebar element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const sidebar = page.locator('#dbSidebar, .db-sidebar');
            expect(await sidebar.count()).toBe(1);
        });

        test(`${dashPage.name}: Has mobile tabs element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const mobileTabs = page.locator('#dbMobileTabs, .db-mobile-tabs');
            expect(await mobileTabs.count()).toBe(1);
        });

        test(`${dashPage.name}: Has layout container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const layout = page.locator('.db-layout');
            expect(await layout.count()).toBe(1);
        });

        test(`${dashPage.name}: Has vouchers section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const vouchersSection = page.locator('#db-vouchers');
            expect(await vouchersSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has loyalty section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const loyaltySection = page.locator('#db-loyalty');
            expect(await loyaltySection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has payments section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const paymentsSection = page.locator('#db-payments');
            expect(await paymentsSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has settings section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const settingsSection = page.locator('#db-settings');
            expect(await settingsSection.count()).toBe(1);
        });
    }
});

test.describe('Dashboard Page — Navigation Elements', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Has nav-links in header`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const navLinks = page.locator('.nav-links');
            expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${dashPage.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });

        test(`${dashPage.name}: Has burger menu button`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const burgerMenu = page.locator('#burgerMenu, .burger-menu');
            expect(await burgerMenu.count()).toBe(1);
        });
    }
});
