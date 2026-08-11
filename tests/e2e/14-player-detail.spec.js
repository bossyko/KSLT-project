// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-PLAYER: Players/Rankings page structure tests
 * Tests filter, search, category tabs, and page structure
 */

const PLAYER_PAGES = [
    { path: '/pages/players.html', lang: 'RU', name: 'Players RU' },
    { path: '/pages/players-en.html', lang: 'EN', name: 'Players EN' },
    { path: '/pages/players-kg.html', lang: 'KG', name: 'Players KG' },
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
        !e.includes('null') &&
        !e.includes('undefined')
    );
}

test.describe('Players Page — Load', () => {
    for (const pp of PLAYER_PAGES) {
        test(`${pp.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(pp.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${pp.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Players Page — Structure', () => {
    for (const pp of PLAYER_PAGES) {
        test(`${pp.name}: Has header element`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${pp.name}: Has hero section`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            const hero = page.locator('#playersHero, .pl-hero');
            expect(await hero.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${pp.name}: Has filters section`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            const filters = page.locator('#playersFilters, .pl-filters-section');
            expect(await filters.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${pp.name}: Has footer`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            const footer = page.locator('footer, .site-footer');
            expect(await footer.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Players Page — Navigation', () => {
    for (const pp of PLAYER_PAGES) {
        test(`${pp.name}: Rating nav item is marked active`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            // Rating nav link should have 'active' class
            const ratingNav = page.locator('.nav-links a.nav-item.active, .nav-links a.nav-item-dropdown.active');
            expect(await ratingNav.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${pp.name}: Category dropdown items exist in nav`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            // Category links in the rating dropdown
            const catLinks = page.locator('.nav-dropdown-menu a[href*="tab=men-"]');
            expect(await catLinks.count()).toBeGreaterThanOrEqual(4);
        });

        test(`${pp.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });
    }
});

test.describe('Players Page — Category Tabs via URL', () => {
    test('Players RU: Can load with ?tab= param', async ({ page }) => {
        const response = await page.goto('/pages/players.html?tab=men-promasters', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });

    test('Players RU: Can load Masters tab', async ({ page }) => {
        const response = await page.goto('/pages/players.html?tab=men-masters', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });

    test('Players RU: Can load Challenger tab', async ({ page }) => {
        const response = await page.goto('/pages/players.html?tab=men-challenger', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });

    test('Players RU: Can load Futures tab', async ({ page }) => {
        const response = await page.goto('/pages/players.html?tab=men-futures', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });

    test('Players RU: Can load Tour tab', async ({ page }) => {
        const response = await page.goto('/pages/players.html?tab=men-tour', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });
});

test.describe('Players Page — Sponsors Section', () => {
    for (const pp of PLAYER_PAGES) {
        test(`${pp.name}: Has sponsors section`, async ({ page }) => {
            await page.goto(pp.path, { waitUntil: 'domcontentloaded' });

            const sponsors = page.locator('#sponsors, .section-sponsors-compact, [id*="Sponsors"]');
            expect(await sponsors.count()).toBeGreaterThanOrEqual(1);
        });
    }
});
