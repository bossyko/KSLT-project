// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-SEO: SEO basics — title, meta, lang attribute, charset
 */

const PAGES = [
    { path: '/', name: 'Homepage RU', lang: 'ru' },
    { path: '/index-en.html', name: 'Homepage EN', lang: 'en' },
    { path: '/index-kg.html', name: 'Homepage KG', lang: 'ky' },
    { path: '/pages/players.html', name: 'Players RU', lang: 'ru' },
    { path: '/pages/players-en.html', name: 'Players EN', lang: 'en' },
    { path: '/pages/tournaments.html', name: 'Tournaments RU', lang: 'ru' },
    { path: '/pages/tournaments-en.html', name: 'Tournaments EN', lang: 'en' },
    { path: '/pages/coaches.html', name: 'Coaches RU', lang: 'ru' },
    { path: '/pages/courts.html', name: 'Courts RU', lang: 'ru' },
    { path: '/pages/news.html', name: 'News RU', lang: 'ru' },
    { path: '/pages/auth.html', name: 'Auth RU', lang: 'ru' },
    { path: '/pages/pricing.html', name: 'Pricing RU', lang: 'ru' },
];

test.describe('SEO — Title tags', () => {
    for (const pg of PAGES) {
        test(`${pg.name} has non-empty title`, async ({ page }) => {
            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
            const title = await page.title();
            expect(title.trim().length).toBeGreaterThan(0);
            // Русская версия сайта пишет аббревиатуру кириллицей — КСЛТ
            expect(title).toContain(pg.lang === 'ru' ? 'КСЛТ' : 'KSLT');
        });
    }
});

test.describe('SEO — HTML lang attribute', () => {
    for (const pg of PAGES) {
        test(`${pg.name} has lang="${pg.lang}"`, async ({ page }) => {
            await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
            const lang = await page.locator('html').getAttribute('lang');
            expect(lang).toBe(pg.lang);
        });
    }
});

test.describe('SEO — Charset', () => {
    test('Homepage has UTF-8 charset', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const charset = page.locator('meta[charset]');
        const val = await charset.getAttribute('charset');
        expect(val.toLowerCase()).toBe('utf-8');
    });
});

test.describe('Accessibility — Basic', () => {
    test('Homepage images have alt attributes', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const imgsWithoutAlt = await page.evaluate(() => {
            const imgs = document.querySelectorAll('img');
            let count = 0;
            imgs.forEach(img => {
                if (!img.hasAttribute('alt')) count++;
            });
            return count;
        });

        // Allow at most 5 images without alt (decorative)
        expect(imgsWithoutAlt).toBeLessThanOrEqual(5);
    });

    test('Form inputs have labels or aria-label', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });

        const inputsWithoutLabel = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])');
            let count = 0;
            inputs.forEach(input => {
                const id = input.id;
                const hasForLabel = id && document.querySelector('label[for="' + id + '"]');
                const hasAria = input.getAttribute('aria-label') || input.getAttribute('placeholder');
                // Also check wrapping <label> (radio/checkbox pattern)
                const hasWrappingLabel = input.closest('label');
                if (!hasForLabel && !hasAria && !hasWrappingLabel) count++;
            });
            return count;
        });

        expect(inputsWithoutLabel).toBeLessThanOrEqual(2);
    });
});
