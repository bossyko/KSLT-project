// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-LOAD: All public pages load without critical errors
 * Checks: HTTP 200, no JS fatal errors, key elements present
 */

const PUBLIC_PAGES = [
    // Root pages
    { path: '/', title: 'KSLT', lang: 'ru', name: 'Homepage RU' },
    { path: '/index-en.html', title: 'KSLT', lang: 'en', name: 'Homepage EN' },
    { path: '/index-kg.html', title: 'KSLT', lang: 'kg', name: 'Homepage KG' },

    // Tournaments
    { path: '/pages/tournaments.html', name: 'Tournaments RU' },
    { path: '/pages/tournaments-en.html', name: 'Tournaments EN' },
    { path: '/pages/tournaments-kg.html', name: 'Tournaments KG' },
    { path: '/pages/tournaments-overview.html', name: 'Tournaments Overview RU' },
    { path: '/pages/tournaments-overview-en.html', name: 'Tournaments Overview EN' },
    { path: '/pages/tournaments-overview-kg.html', name: 'Tournaments Overview KG' },

    // Players / Rankings
    { path: '/pages/players.html', name: 'Players RU' },
    { path: '/pages/players-en.html', name: 'Players EN' },
    { path: '/pages/players-kg.html', name: 'Players KG' },

    // Coaches
    { path: '/pages/coaches.html', name: 'Coaches RU' },
    { path: '/pages/coaches-en.html', name: 'Coaches EN' },
    { path: '/pages/coaches-kg.html', name: 'Coaches KG' },

    // Courts
    { path: '/pages/courts.html', name: 'Courts RU' },
    { path: '/pages/courts-en.html', name: 'Courts EN' },
    { path: '/pages/courts-kg.html', name: 'Courts KG' },

    // News
    { path: '/pages/news.html', name: 'News RU' },
    { path: '/pages/news-en.html', name: 'News EN' },
    { path: '/pages/news-kg.html', name: 'News KG' },

    // Info pages
    { path: '/pages/info.html', name: 'Info RU' },
    { path: '/pages/info-en.html', name: 'Info EN' },
    { path: '/pages/info-kg.html', name: 'Info KG' },
    { path: '/pages/about.html', name: 'About RU' },
    { path: '/pages/about-en.html', name: 'About EN' },
    { path: '/pages/about-kg.html', name: 'About KG' },
    { path: '/pages/faq.html', name: 'FAQ RU' },
    { path: '/pages/faq-en.html', name: 'FAQ EN' },
    { path: '/pages/faq-kg.html', name: 'FAQ KG' },
    { path: '/pages/rules.html', name: 'Rules RU' },
    { path: '/pages/rules-en.html', name: 'Rules EN' },
    { path: '/pages/rules-kg.html', name: 'Rules KG' },
    { path: '/pages/offer.html', name: 'Offer RU' },
    { path: '/pages/offer-en.html', name: 'Offer EN' },
    { path: '/pages/offer-kg.html', name: 'Offer KG' },
    { path: '/pages/pricing.html', name: 'Pricing RU' },
    { path: '/pages/pricing-en.html', name: 'Pricing EN' },
    { path: '/pages/pricing-kg.html', name: 'Pricing KG' },

    // Services
    { path: '/pages/services.html', name: 'Services RU' },
    { path: '/pages/services-en.html', name: 'Services EN' },
    { path: '/pages/services-kg.html', name: 'Services KG' },

    // Partners
    { path: '/pages/partners.html', name: 'Partners RU' },
    { path: '/pages/partners-en.html', name: 'Partners EN' },
    { path: '/pages/partners-kg.html', name: 'Partners KG' },

    // Auth
    { path: '/pages/auth.html', name: 'Auth RU' },
    { path: '/pages/auth-en.html', name: 'Auth EN' },
    { path: '/pages/auth-kg.html', name: 'Auth KG' },

    // Battles
    { path: '/pages/battles-overview.html', name: 'Battles Overview RU' },
    { path: '/pages/battles-overview-en.html', name: 'Battles Overview EN' },
    { path: '/pages/battles-overview-kg.html', name: 'Battles Overview KG' },

    // Live
    { path: '/pages/live-match.html', name: 'Live Match RU' },
    { path: '/pages/live-match-en.html', name: 'Live Match EN' },
    { path: '/pages/live-match-kg.html', name: 'Live Match KG' },
];

test.describe('Page Loading — All public pages', () => {
    for (const page of PUBLIC_PAGES) {
        test(`${page.name} loads without errors`, async ({ page: p }) => {
            const jsErrors = [];
            p.on('pageerror', err => jsErrors.push(err.message));

            const response = await p.goto(page.path, { waitUntil: 'domcontentloaded' });

            // HTTP status
            expect(response.status()).toBe(200);

            // No fatal JS errors (ignore Supabase connection errors on localhost)
            const criticalErrors = jsErrors.filter(e =>
                !e.includes('supabase') &&
                !e.includes('Supabase') &&
                !e.includes('fetch') &&
                !e.includes('Failed to fetch') &&
                !e.includes('NetworkError') &&
                !e.includes('net::ERR') &&
                !e.includes('CORS')
            );
            expect(criticalErrors).toEqual([]);

            // Page has content (not blank)
            const body = await p.locator('body').textContent();
            expect(body.trim().length).toBeGreaterThan(0);
        });
    }
});

test.describe('Page Structure — Key elements', () => {
    test('Homepage RU has header, hero, sections', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('.hero, .hp-hero, [class*="hero"]').first()).toBeVisible();
    });

    test('Homepage EN has header', async ({ page }) => {
        await page.goto('/index-en.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Homepage KG has header', async ({ page }) => {
        await page.goto('/index-kg.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Auth page has login form', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#signin-email').first()).toBeVisible();
        await expect(page.locator('#signin-password, input[type="password"]').first()).toBeVisible();
    });

    test('Players page has content area', async ({ page }) => {
        await page.goto('/pages/players.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Tournaments page has content area', async ({ page }) => {
        await page.goto('/pages/tournaments.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});
