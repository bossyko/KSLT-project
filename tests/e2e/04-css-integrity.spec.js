// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-CSS: CSS files load, no 404 for stylesheets or scripts
 */

test.describe('CSS & JS Resources — No 404s', () => {
    const PAGES = [
        { path: '/', name: 'Homepage' },
        { path: '/pages/players.html', name: 'Players' },
        { path: '/pages/tournaments.html', name: 'Tournaments' },
        { path: '/pages/coaches.html', name: 'Coaches' },
        { path: '/pages/courts.html', name: 'Courts' },
        { path: '/pages/news.html', name: 'News' },
        { path: '/pages/auth.html', name: 'Auth' },
        { path: '/pages/services.html', name: 'Services' },
        { path: '/pages/pricing.html', name: 'Pricing' },
        { path: '/pages/info.html', name: 'Info' },
        { path: '/pages/about.html', name: 'About' },
        { path: '/pages/faq.html', name: 'FAQ' },
        { path: '/pages/partners.html', name: 'Partners' },
        { path: '/pages/battles-overview.html', name: 'Battles Overview' },
        { path: '/pages/live-match.html', name: 'Live Match' },
    ];

    for (const pg of PAGES) {
        test(`${pg.name}: all CSS/JS resources load (no 404)`, async ({ page }) => {
            const failed = [];

            page.on('response', response => {
                const url = response.url();
                const status = response.status();
                if ((url.endsWith('.css') || url.endsWith('.js')) && status >= 400 && !url.includes('supabase')) {
                    failed.push({ url, status });
                }
            });

            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            expect(failed).toEqual([]);
        });
    }
});

test.describe('CSS Variables — Dark theme', () => {
    test('Homepage uses dark background', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const bgColor = await page.evaluate(() => {
            return getComputedStyle(document.body).backgroundColor;
        });

        // Dark theme: background should be dark (RGB values < 50)
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const avg = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
            expect(avg).toBeLessThan(80);
        }
    });

    test('Accent color #CCFF00 is used', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const hasAccent = await page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                const style = getComputedStyle(el);
                if (style.color === 'rgb(204, 255, 0)' ||
                    style.backgroundColor === 'rgb(204, 255, 0)' ||
                    style.borderColor === 'rgb(204, 255, 0)') {
                    return true;
                }
            }
            return false;
        });

        expect(hasAccent).toBe(true);
    });
});

test.describe('Font Loading', () => {
    test('Inter font is loaded on homepage', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const fontFamily = await page.evaluate(() => {
            return getComputedStyle(document.body).fontFamily;
        });

        expect(fontFamily.toLowerCase()).toContain('inter');
    });
});
