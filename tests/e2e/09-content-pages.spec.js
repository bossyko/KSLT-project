// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-CONTENT: Static content pages load correctly
 */

/**
 * Правовые документы приходят из базы и подставляются в страницу уже после
 * загрузки. Однажды они подставились невидимыми: блоки на этих страницах
 * проявляются по прокрутке, а наблюдатель отработал по прежней разметке и
 * новые не увидел. Текст на странице был, а глазами — пусто.
 *
 * Поэтому проверяем не наличие знаков, а что текст видно.
 *
 * Ответ базы подсовываем сами: в тестовой базе документов нет, да и
 * проверяем мы здесь страницу, а не наполнение таблицы.
 */
test.describe('Правовые документы — текст виден', () => {
    const СТРАНИЦЫ = [
        'terms', 'terms-en', 'terms-kg',
        'privacy-policy', 'privacy-policy-en', 'privacy-policy-kg',
        'offer', 'offer-en', 'offer-kg'
    ];

    // Пять блоков с тем же классом, что и на живых страницах
    const ТЕЛО = Array.from({ length: 5 }, (_, i) =>
        `<div class="ip-section ip-fade-in"><h2>Раздел ${i + 1}</h2>` +
        `<p>${'Текст документа для проверки. '.repeat(20)}</p></div>`
    ).join('');

    for (const стр of СТРАНИЦЫ) {
        test(`${стр} — документ виден, а не прозрачен`, async ({ page }) => {
            await page.route('**/rest/v1/site_documents*', route => route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    slug: 'x', title: 'Проверка', title_en: 'Check', title_kg: 'Текшерүү',
                    body: ТЕЛО, body_en: ТЕЛО, body_kg: ТЕЛО
                })
            }));

            await page.goto(`/pages/${стр}.html`, { waitUntil: 'domcontentloaded' });

            const блок = page.locator('[data-document]');
            await expect(блок).toBeVisible();

            // Дожидаемся именно подстановки, а не запасного текста в разметке
            await expect(блок).toHaveAttribute('data-from-db', '1', { timeout: 15000 });

            const текст = (await блок.textContent()).replace(/\s+/g, ' ').trim();
            expect(текст.length).toBeGreaterThan(500);

            // Пролистываем до конца: непролистанные блоки прозрачны по замыслу.
            // А вот если и после прокрутки остались прозрачные — значит их
            // никто не показывает, и человек видит пустую страницу
            await page.evaluate(async () => {
                const шаг = window.innerHeight * 0.8;
                for (let y = 0; y < document.body.scrollHeight; y += шаг) {
                    window.scrollTo(0, y);
                    await new Promise(r => setTimeout(r, 120));
                }
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(700);

            const прозрачные = await page.evaluate(() => {
                const box = document.querySelector('[data-document]');
                if (!box) return -1;
                let n = 0;
                box.querySelectorAll('.ip-fade-in').forEach(el => {
                    if (parseFloat(getComputedStyle(el).opacity) < 0.9) n++;
                });
                return n;
            });
            expect(прозрачные).toBe(0);
        });
    }
});

test.describe('Info Pages — Content', () => {
    test('About RU has content', async ({ page }) => {
        await page.goto('/pages/about.html', { waitUntil: 'domcontentloaded' });
        const body = await page.locator('main, .content, article, [class*="about"]').first().textContent();
        expect(body.trim().length).toBeGreaterThan(50);
    });

    test('FAQ RU has questions', async ({ page }) => {
        await page.goto('/pages/faq.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Rules RU has content', async ({ page }) => {
        await page.goto('/pages/rules.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Offer RU has content', async ({ page }) => {
        await page.goto('/pages/offer.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(100);
    });

    test('Pricing RU has pricing cards or table', async ({ page }) => {
        await page.goto('/pages/pricing.html', { waitUntil: 'domcontentloaded' });
        const body = await page.textContent('body');
        expect(body.length).toBeGreaterThan(50);
    });
});

test.describe('Coaches Page', () => {
    test('Coaches RU loads with header', async ({ page }) => {
        await page.goto('/pages/coaches.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Coaches EN loads with header', async ({ page }) => {
        await page.goto('/pages/coaches-en.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Courts Page', () => {
    test('Courts RU loads with header', async ({ page }) => {
        await page.goto('/pages/courts.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });

    test('Courts EN loads with header', async ({ page }) => {
        await page.goto('/pages/courts-en.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Services Page', () => {
    test('Services RU loads', async ({ page }) => {
        await page.goto('/pages/services.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Partners Page', () => {
    test('Partners RU loads', async ({ page }) => {
        await page.goto('/pages/partners.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});

test.describe('Live Match Page', () => {
    test('Live Match RU loads without crash', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.goto('/pages/live-match.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();

        const critical = errors.filter(e => !e.includes('supabase') && !e.includes('fetch') && !e.includes('CORS') && !e.includes('NetworkError'));
        expect(critical).toEqual([]);
    });
});

test.describe('Battles Overview', () => {
    test('Battles Overview RU loads', async ({ page }) => {
        await page.goto('/pages/battles-overview.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
    });
});
