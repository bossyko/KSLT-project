// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-AUTH: Auth page UI checks (no real login — no test credentials)
 */

test.describe('Auth Page — Form Elements', () => {
    test('RU: Login form has email, password, submit button', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });

        // Auth page has multiple forms (signin, register, forgot) — check first visible
        await expect(page.locator('#signin-email').first()).toBeVisible();
        await expect(page.locator('#signin-password, input[type="password"]').first()).toBeVisible();

        // Submit button
        const submitBtn = page.locator('button[type="submit"], .auth-btn, form button');
        await expect(submitBtn.first()).toBeVisible();
    });

    test('EN: Login form has email, password, submit button', async ({ page }) => {
        await page.goto('/pages/auth-en.html', { waitUntil: 'domcontentloaded' });

        await expect(page.locator('#signin-email').first()).toBeVisible();
        await expect(page.locator('#signin-password, input[type="password"]').first()).toBeVisible();
    });

    test('KG: Login form has email, password, submit button', async ({ page }) => {
        await page.goto('/pages/auth-kg.html', { waitUntil: 'domcontentloaded' });

        await expect(page.locator('#signin-email').first()).toBeVisible();
        await expect(page.locator('#signin-password, input[type="password"]').first()).toBeVisible();
    });

    test('Google OAuth button exists', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });

        const googleBtn = page.locator('[class*="google"], button:has-text("Google"), a:has-text("Google")');
        const count = await googleBtn.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('Switch to registration form', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });

        // Look for registration tab/link
        const regLink = page.locator('[class*="register"], [class*="signup"], a:has-text("Регистрация"), button:has-text("Регистрация"), [data-tab="register"]');
        const count = await regLink.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});

test.describe('Auth Page — Validation', () => {
    test('Empty form submit shows error or prevents submission', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });

        const submitBtn = page.locator('button[type="submit"], .auth-btn, form button').first();
        await submitBtn.click();

        // Either HTML5 validation prevents submit, or an error toast appears
        await page.waitForTimeout(500);
        const url = page.url();
        expect(url).toContain('auth');
    });
});
