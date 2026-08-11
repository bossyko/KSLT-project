// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-ADMIN: Admin page structure tests
 * Tests public-facing elements load without auth dependency errors
 * Admin requires staff auth — we test structural HTML elements only
 */

const ADMIN_PAGES = [
    { path: '/pages/admin.html', lang: 'RU', name: 'Admin RU' },
    { path: '/pages/admin-en.html', lang: 'EN', name: 'Admin EN' },
];

// Helper: filter out non-critical JS errors
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
        !e.includes('null') &&
        !e.includes('requireStaff') &&
        !e.includes('requireAdmin')
    );
}

test.describe('Admin Page — Load without crash', () => {
    for (const adminPage of ADMIN_PAGES) {
        test(`${adminPage.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${adminPage.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Admin Page — Structure', () => {
    for (const adminPage of ADMIN_PAGES) {
        test(`${adminPage.name}: Has header element`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${adminPage.name}: Has KSLT logo`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('.logo-img').first()).toBeVisible();
        });

        test(`${adminPage.name}: Has sidebar element`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const sidebar = page.locator('#adSidebar, .ad-sidebar');
            expect(await sidebar.count()).toBe(1);
        });

        test(`${adminPage.name}: Has mobile tabs element`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const mobileTabs = page.locator('#adMobileTabs, .ad-mobile-tabs');
            expect(await mobileTabs.count()).toBe(1);
        });

        test(`${adminPage.name}: Has ad-layout container`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const layout = page.locator('.ad-layout');
            expect(await layout.count()).toBe(1);
        });
    }
});

test.describe('Admin Page — Section Containers', () => {
    for (const adminPage of ADMIN_PAGES) {
        test(`${adminPage.name}: Has dashboard section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-dashboard').count()).toBe(1);
        });

        test(`${adminPage.name}: Has users section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-users').count()).toBe(1);
        });

        test(`${adminPage.name}: Has tournaments section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-tournaments').count()).toBe(1);
        });

        test(`${adminPage.name}: Has players section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-players').count()).toBe(1);
        });

        test(`${adminPage.name}: Has courts section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-courts').count()).toBe(1);
        });

        test(`${adminPage.name}: Has coaches section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-coaches').count()).toBe(1);
        });

        test(`${adminPage.name}: Has content section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-content').count()).toBe(1);
        });

        test(`${adminPage.name}: Has finances section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-finances').count()).toBe(1);
        });

        test(`${adminPage.name}: Has vouchers section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-vouchers').count()).toBe(1);
        });

        test(`${adminPage.name}: Has loyalty section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-loyalty').count()).toBe(1);
        });

        test(`${adminPage.name}: Has sponsors section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-sponsors').count()).toBe(1);
        });

        test(`${adminPage.name}: Has challenges section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-challenges').count()).toBe(1);
        });

        test(`${adminPage.name}: Has live section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-live').count()).toBe(1);
        });

        test(`${adminPage.name}: Has settings section`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });
            expect(await page.locator('#ad-settings').count()).toBe(1);
        });
    }
});

test.describe('Admin Page — Navigation Elements', () => {
    for (const adminPage of ADMIN_PAGES) {
        test(`${adminPage.name}: Has nav-links in header`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const navLinks = page.locator('.nav-links');
            expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${adminPage.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });

        test(`${adminPage.name}: Has burger menu button`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            const burgerMenu = page.locator('#burgerMenu, .burger-menu');
            expect(await burgerMenu.count()).toBe(1);
        });

        test(`${adminPage.name}: Has logout button`, async ({ page }) => {
            await page.goto(adminPage.path, { waitUntil: 'domcontentloaded' });

            // Logout button with ksltLogout onclick
            const logoutBtn = page.locator('button[onclick*="ksltLogout"], .btn-auth[onclick*="ksltLogout"]');
            expect(await logoutBtn.count()).toBeGreaterThanOrEqual(1);
        });
    }
});
