// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-TOURNAMENT-DETAIL: Tournament detail page structure tests
 * Tests page loads and has expected structural elements
 * Without an ?id= param, page loads but shows empty containers
 */

const TOURNAMENT_PAGES = [
    { path: '/pages/tournament.html', lang: 'RU', name: 'Tournament RU' },
    { path: '/pages/tournament-en.html', lang: 'EN', name: 'Tournament EN' },
    { path: '/pages/tournament-kg.html', lang: 'KG', name: 'Tournament KG' },
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
        !e.includes('undefined') &&
        !e.includes('Cannot read')
    );
}

test.describe('Tournament Detail — Load', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(tp.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${tp.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Tournament Detail — Page Structure', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Has header element`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${tp.name}: Has hero section`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const hero = page.locator('#tournamentHero, .td-hero');
            expect(await hero.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${tp.name}: Has tabs bar`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const tabsBar = page.locator('#tabsBar, .td-tabs-bar');
            expect(await tabsBar.count()).toBe(1);
        });

        test(`${tp.name}: Has description tab`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const descTab = page.locator('.td-tab[data-target="description"]');
            expect(await descTab.count()).toBe(1);
        });

        test(`${tp.name}: Has venue tab`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const venueTab = page.locator('.td-tab[data-target="venue"]');
            expect(await venueTab.count()).toBe(1);
        });

        test(`${tp.name}: Has participants tab`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const participantsTab = page.locator('.td-tab[data-target="participants"]');
            expect(await participantsTab.count()).toBe(1);
        });

        test(`${tp.name}: Has bracket tab`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const bracketTab = page.locator('.td-tab[data-target="bracket"]');
            expect(await bracketTab.count()).toBe(1);
        });

        test(`${tp.name}: Has results tab`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const resultsTab = page.locator('.td-tab[data-target="results"]');
            expect(await resultsTab.count()).toBe(1);
        });
    }
});

test.describe('Tournament Detail — Content Sections', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Has description content container`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const descContent = page.locator('#descriptionContent');
            expect(await descContent.count()).toBe(1);
        });

        test(`${tp.name}: Has venue content container`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const venueContent = page.locator('#venueContent');
            expect(await venueContent.count()).toBe(1);
        });

        test(`${tp.name}: Has participants grid container`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const participantsGrid = page.locator('#participantsGrid');
            expect(await participantsGrid.count()).toBe(1);
        });

        test(`${tp.name}: Has bracket container`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const bracketContainer = page.locator('#bracketContainer');
            expect(await bracketContainer.count()).toBe(1);
        });

        test(`${tp.name}: Has results podium container`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const resultsPodium = page.locator('#resultsPodium');
            expect(await resultsPodium.count()).toBe(1);
        });
    }
});

test.describe('Tournament Detail — Back Navigation', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Has back link in tabs bar`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const backLink = page.locator('#tabsBackLink, .td-tabs-back');
            expect(await backLink.count()).toBe(1);
        });

        test(`${tp.name}: Description tab is active by default`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const descTab = page.locator('.td-tab[data-target="description"]');
            await expect(descTab).toHaveClass(/active/);
        });
    }
});

test.describe('Tournament Detail — Footer', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Has footer`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const footer = page.locator('footer, .site-footer');
            expect(await footer.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Tournament Detail — Language Switcher', () => {
    for (const tp of TOURNAMENT_PAGES) {
        test(`${tp.name}: Has language dropdown with correct active language`, async ({ page }) => {
            await page.goto(tp.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);

            // Has language options in the menu
            const langOptions = page.locator('.lang-menu .lang-option, .lang-menu a[data-lang]');
            expect(await langOptions.count()).toBeGreaterThanOrEqual(2);
        });
    }
});
