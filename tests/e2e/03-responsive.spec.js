// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TC-RESP: Responsive design checks at key breakpoints
 * 375px (mobile), 768px (tablet), 992px (desktop), 1280px (wide)
 */

const VIEWPORTS = [
    { name: '375px mobile', width: 375, height: 812 },
    { name: '480px mobile-l', width: 480, height: 854 },
    { name: '768px tablet', width: 768, height: 1024 },
    { name: '992px desktop', width: 992, height: 768 },
    { name: '1280px wide', width: 1280, height: 800 },
];

const PAGES_TO_CHECK = [
    { path: '/', name: 'Homepage' },
    { path: '/pages/players.html', name: 'Players' },
    { path: '/pages/tournaments.html', name: 'Tournaments' },
    { path: '/pages/coaches.html', name: 'Coaches' },
    { path: '/pages/courts.html', name: 'Courts' },
    { path: '/pages/news.html', name: 'News' },
    { path: '/pages/auth.html', name: 'Auth' },
    { path: '/pages/services.html', name: 'Services' },
    { path: '/pages/pricing.html', name: 'Pricing' },
];

test.describe('Responsive — No horizontal overflow', () => {
    for (const vp of VIEWPORTS) {
        for (const pg of PAGES_TO_CHECK) {
            test(`${pg.name} @ ${vp.name}: no horizontal scroll`, async ({ page }) => {
                await page.setViewportSize({ width: vp.width, height: vp.height });
                await page.goto(pg.path, { waitUntil: 'domcontentloaded' });

                // Wait a bit for dynamic content
                await page.waitForTimeout(500);

                const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
                const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

                // Allow 2px tolerance for scrollbar
                expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
            });
        }
    }
});

test.describe('Responsive — Mobile burger menu', () => {
    test('Mobile: burger menu button visible at 375px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const burger = page.locator('.burger, .hamburger, .menu-toggle, [class*="burger"], [class*="mobile-menu"], button[aria-label*="menu"], .nav-toggle');
        const count = await burger.count();
        // On mobile, there should be a burger menu
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Desktop: burger menu hidden at 1280px', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const burger = page.locator('.burger, .hamburger, .menu-toggle, [class*="burger"]');
        const count = await burger.count();
        if (count > 0) {
            // If burger exists, it should be hidden on desktop
            const visible = await burger.first().isVisible();
            expect(visible).toBe(false);
        }
    });
});

test.describe('Responsive — Text readability', () => {
    for (const vp of [{ name: '375px', width: 375, height: 812 }, { name: '768px', width: 768, height: 1024 }]) {
        test(`Homepage @ ${vp.name}: text not overflowing viewport`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto('/', { waitUntil: 'domcontentloaded' });

            // Check that no text element extends beyond viewport
            // Skip elements inside overflow:hidden containers (e.g. carousels)
            const overflowing = await page.evaluate((vpWidth) => {
                function isClipped(el) {
                    var p = el.parentElement;
                    while (p) {
                        var s = getComputedStyle(p);
                        if (s.overflow === 'hidden' || s.overflowX === 'hidden') return true;
                        p = p.parentElement;
                    }
                    return false;
                }
                const elements = document.querySelectorAll('h1, h2, h3, p, span, a, li, td, th');
                let count = 0;
                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > vpWidth + 10 && rect.width > 0 && !isClipped(el)) {
                        count++;
                    }
                });
                return count;
            }, vp.width);

            // Allow up to 3 minor overflows (badges, absolute elements)
            expect(overflowing).toBeLessThanOrEqual(3);
        });
    }
});

test.describe('Responsive — Images', () => {
    test('Images have max-width constraint on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const overflowingImages = await page.evaluate(() => {
            function isClipped(el) {
                var p = el.parentElement;
                while (p) {
                    var s = getComputedStyle(p);
                    if (s.overflow === 'hidden' || s.overflowX === 'hidden') return true;
                    p = p.parentElement;
                }
                return false;
            }
            const images = document.querySelectorAll('img');
            let count = 0;
            images.forEach(img => {
                if (img.naturalWidth > 0 && img.getBoundingClientRect().width > window.innerWidth && !isClipped(img)) {
                    count++;
                }
            });
            return count;
        });

        expect(overflowingImages).toBe(0);
    });
});
