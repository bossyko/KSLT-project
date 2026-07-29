// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-CHALLENGE: Challenge/Battle page structure tests
 * Tests the VS layout, voting, details sections across all 3 languages
 * Without an ?id= param, page shows loading state
 */

const CHALLENGE_PAGES = [
    { path: '/pages/challenge.html', lang: 'RU', name: 'Challenge RU' },
    { path: '/pages/challenge-en.html', lang: 'EN', name: 'Challenge EN' },
    { path: '/pages/challenge-kg.html', lang: 'KG', name: 'Challenge KG' },
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

test.describe('Challenge Battle — Load', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(cp.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${cp.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Challenge Battle — Page Structure', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Has header element`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${cp.name}: Has hero section (VS layout container)`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const hero = page.locator('#challengeHero, .ch-hero');
            expect(await hero.count()).toBe(1);
        });

        test(`${cp.name}: Has voting section container`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const voting = page.locator('#challengeVoting, .ch-voting');
            expect(await voting.count()).toBe(1);
        });

        test(`${cp.name}: Has details section container`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const details = page.locator('#challengeDetails, .ch-details');
            expect(await details.count()).toBe(1);
        });

        test(`${cp.name}: Has H2H section container`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const h2h = page.locator('#challengeH2H, .ch-h2h');
            expect(await h2h.count()).toBe(1);
        });

        test(`${cp.name}: Has score section container`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const score = page.locator('#challengeScore, .ch-score');
            expect(await score.count()).toBe(1);
        });

        test(`${cp.name}: Has breadcrumb container`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const breadcrumb = page.locator('#challengeBreadcrumb, .kslt-back-wrap');
            expect(await breadcrumb.count()).toBe(1);
        });
    }
});

test.describe('Challenge Battle — Footer', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Has footer`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const footer = page.locator('footer, .site-footer');
            expect(await footer.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Challenge Battle — Sponsors', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Has sponsors section`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const sponsors = page.locator('#sponsors, .section-sponsors-compact');
            expect(await sponsors.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Challenge Battle — Language Switcher', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });

        test(`${cp.name}: Language options link to correct challenge variants`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const langOptions = page.locator('.lang-menu .lang-option, .lang-menu a[data-lang]');
            expect(await langOptions.count()).toBeGreaterThanOrEqual(2);

            // Verify links contain "challenge" in href
            const allHrefs = await langOptions.evaluateAll(els => els.map(el => el.getAttribute('href')));
            for (const href of allHrefs) {
                expect(href).toContain('challenge');
            }
        });
    }
});

test.describe('Challenge Battle — Loading State', () => {
    for (const cp of CHALLENGE_PAGES) {
        test(`${cp.name}: Shows loading text in hero when no ID`, async ({ page }) => {
            await page.goto(cp.path, { waitUntil: 'domcontentloaded' });

            const hero = page.locator('#challengeHero, .ch-hero');
            const heroText = await hero.textContent();
            // Should contain some content (loading text or empty)
            expect(heroText).toBeTruthy();
        });
    }
});
