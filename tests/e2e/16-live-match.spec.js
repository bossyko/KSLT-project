// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-LIVE: Live match page structure tests
 * Tests page loads and structural elements across all 3 languages
 */

const LIVE_PAGES = [
    { path: '/pages/live-match.html', lang: 'RU', name: 'Live Match RU' },
    { path: '/pages/live-match-en.html', lang: 'EN', name: 'Live Match EN' },
    { path: '/pages/live-match-kg.html', lang: 'KG', name: 'Live Match KG' },
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
        !e.includes('WebSocket') &&
        !e.includes('wss://')
    );
}

test.describe('Live Match — Load', () => {
    for (const lp of LIVE_PAGES) {
        test(`${lp.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(lp.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${lp.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Live Match — Page Structure', () => {
    for (const lp of LIVE_PAGES) {
        test(`${lp.name}: Has header element`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${lp.name}: Has KSLT logo`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('.logo-text').first()).toBeVisible();
        });

        test(`${lp.name}: Has main container for live content`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const container = page.locator('#lmContainer, .lm-container');
            expect(await container.count()).toBe(1);
        });

        test(`${lp.name}: Has footer`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const footer = page.locator('footer, .site-footer');
            expect(await footer.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Live Match — Navigation', () => {
    for (const lp of LIVE_PAGES) {
        test(`${lp.name}: Has nav links`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const navLinks = page.locator('.nav-links');
            expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${lp.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });

        test(`${lp.name}: Language options link to correct live-match variants`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const langOptions = page.locator('.lang-menu .lang-option, .lang-menu a[data-lang]');
            expect(await langOptions.count()).toBeGreaterThanOrEqual(2);

            const allHrefs = await langOptions.evaluateAll(els => els.map(el => el.getAttribute('href')));
            for (const href of allHrefs) {
                expect(href).toContain('live-match');
            }
        });

        test(`${lp.name}: Has burger menu button`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const burgerMenu = page.locator('#burgerMenu, .burger-menu');
            expect(await burgerMenu.count()).toBe(1);
        });

        test(`${lp.name}: Has mobile nav`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const mobileNav = page.locator('#mobileNav, .mobile-nav');
            expect(await mobileNav.count()).toBe(1);
        });
    }
});

test.describe('Live Match — CSS', () => {
    for (const lp of LIVE_PAGES) {
        test(`${lp.name}: Includes live-match.css stylesheet`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const liveCSS = page.locator('link[href*="live-match.css"]');
            expect(await liveCSS.count()).toBe(1);
        });
    }
});

test.describe('Live Match — Content Security Policy', () => {
    for (const lp of LIVE_PAGES) {
        test(`${lp.name}: CSP allows WebSocket connections`, async ({ page }) => {
            await page.goto(lp.path, { waitUntil: 'domcontentloaded' });

            const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
            if (await cspMeta.count() > 0) {
                const content = await cspMeta.getAttribute('content');
                // Should allow wss:// for Supabase Realtime
                expect(content).toContain('wss://');
            }
        });
    }
});

test.describe('Live Match — Footer Links', () => {
    test('Live Match RU: Footer has navigation links', async ({ page }) => {
        await page.goto('/pages/live-match.html', { waitUntil: 'domcontentloaded' });

        const footerLinks = page.locator('footer .footer-links a, .site-footer .footer-links a');
        expect(await footerLinks.count()).toBeGreaterThan(0);
    });

    test('Live Match RU: Footer has social links', async ({ page }) => {
        await page.goto('/pages/live-match.html', { waitUntil: 'domcontentloaded' });

        const socialLinks = page.locator('footer .social-link, .site-footer .footer-socials a');
        expect(await socialLinks.count()).toBeGreaterThanOrEqual(2);
    });

    test('Live Match RU: Footer has contact info', async ({ page }) => {
        await page.goto('/pages/live-match.html', { waitUntil: 'domcontentloaded' });

        const contactSection = page.locator('#contacts, footer .footer-contacts');
        expect(await contactSection.count()).toBeGreaterThanOrEqual(1);
    });
});
