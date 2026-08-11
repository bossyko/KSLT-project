// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-MOBILE: Mobile app shell (Capacitor) structure tests
 * Tests the mobile/www/index.html app shell structure
 * Base URL is different — uses /mobile/www/index.html path
 */

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
        !e.includes('Capacitor') &&
        !e.includes('capacitor') &&
        !e.includes('StatusBar') &&
        !e.includes('SplashScreen') &&
        !e.includes('PushNotifications') &&
        !e.includes('Cannot read')
    );
}

test.describe('Mobile App — Load', () => {
    test('Mobile app shell loads with HTTP 200', async ({ page }) => {
        const response = await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);
    });

    test('Mobile app shell loads without critical JS errors', async ({ page }) => {
        const jsErrors = [];
        page.on('pageerror', err => jsErrors.push(err.message));

        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        const critical = filterCriticalErrors(jsErrors);
        expect(critical).toEqual([]);
    });

    test('Mobile app has page content (not blank)', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const body = await page.locator('body').textContent();
        expect(body.trim().length).toBeGreaterThan(0);
    });
});

test.describe('Mobile App — Tab Bar', () => {
    test('Has tab bar navigation', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tabBar = page.locator('.tab-bar, nav.tab-bar');
        expect(await tabBar.count()).toBe(1);
    });

    test('Tab bar has Home button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const homeTab = page.locator('.tab-item[data-screen="screenHome"]');
        expect(await homeTab.count()).toBe(1);
    });

    test('Tab bar has Tournaments button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tournamentsTab = page.locator('.tab-item[data-screen="screenTournaments"]');
        expect(await tournamentsTab.count()).toBe(1);
    });

    test('Tab bar has Rating button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const ratingTab = page.locator('.tab-item[data-screen="screenRating"]');
        expect(await ratingTab.count()).toBe(1);
    });

    test('Tab bar has News button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const newsTab = page.locator('.tab-item[data-screen="screenNews"]');
        expect(await newsTab.count()).toBe(1);
    });

    test('Tab bar has Profile button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const profileTab = page.locator('.tab-item[data-screen="screenProfile"]');
        expect(await profileTab.count()).toBe(1);
    });

    test('Tab bar has exactly 5 buttons', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tabItems = page.locator('.tab-bar .tab-item');
        expect(await tabItems.count()).toBe(5);
    });

    test('Home tab is active by default', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const homeTab = page.locator('.tab-item[data-screen="screenHome"]');
        await expect(homeTab).toHaveClass(/active/);
    });
});

test.describe('Mobile App — Header', () => {
    test('Has header with KSLT logo', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const header = page.locator('header.header, .header');
        expect(await header.count()).toBeGreaterThanOrEqual(1);

        const logoText = page.locator('.header-logo-img');
        expect(await logoText.count()).toBe(1);
    });

    test('Has notification bell button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const notifBtn = page.locator('#notifBtn');
        expect(await notifBtn.count()).toBe(1);
    });

    test('Notification bell has aria-label', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const notifBtn = page.locator('#notifBtn');
        const ariaLabel = await notifBtn.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
    });

    test('Has notification dot element (initially hidden)', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const notifDot = page.locator('#notifDot');
        expect(await notifDot.count()).toBe(1);
    });

    test('Has menu button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const menuBtn = page.locator('#menuBtn');
        expect(await menuBtn.count()).toBe(1);
    });

    test('Menu button has aria-label', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const menuBtn = page.locator('#menuBtn');
        const ariaLabel = await menuBtn.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
    });
});

test.describe('Mobile App — Screens', () => {
    test('Has Home screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenHome').count()).toBe(1);
    });

    test('Home screen is active by default', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#screenHome')).toHaveClass(/active/);
    });

    test('Has Tournaments screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenTournaments').count()).toBe(1);
    });

    test('Has Rating screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenRating').count()).toBe(1);
    });

    test('Has News screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenNews').count()).toBe(1);
    });

    test('Has Profile screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenProfile').count()).toBe(1);
    });

    test('Has Battles screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenBattles').count()).toBe(1);
    });

    test('Has Live screen', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });
        expect(await page.locator('#screenLive').count()).toBe(1);
    });
});

test.describe('Mobile App — Auth Screen', () => {
    test('Auth screen exists in DOM', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const authScreen = page.locator('#authScreen');
        expect(await authScreen.count()).toBe(1);
    });

    test('Auth screen has KSLT logo', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const authLogo = page.locator('#authScreen .auth-logo-img');
        expect(await authLogo.count()).toBe(1);
    });

    test('Auth screen has login/register tabs', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const loginTab = page.locator('#authTabLogin');
        const registerTab = page.locator('#authTabRegister');
        expect(await loginTab.count()).toBe(1);
        expect(await registerTab.count()).toBe(1);
    });

    test('Auth screen has login form', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const loginForm = page.locator('#authLogin');
        expect(await loginForm.count()).toBe(1);
    });

    test('Auth screen login form has email input', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const emailInput = page.locator('#loginEmail');
        expect(await emailInput.count()).toBe(1);
        expect(await emailInput.getAttribute('type')).toBe('email');
        expect(await emailInput.getAttribute('autocomplete')).toBe('email');
    });

    test('Auth screen login form has password input', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const passwordInput = page.locator('#loginPassword');
        expect(await passwordInput.count()).toBe(1);
        expect(await passwordInput.getAttribute('type')).toBe('password');
        expect(await passwordInput.getAttribute('autocomplete')).toBe('current-password');
    });

    test('Auth screen has forgot password link', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const forgotLink = page.locator('#authForgotLink');
        expect(await forgotLink.count()).toBe(1);
    });

    test('Auth screen has forgot password form', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const forgotForm = page.locator('#authForgot');
        expect(await forgotForm.count()).toBe(1);
    });

    test('Auth screen has register form', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const registerForm = page.locator('#authRegister');
        expect(await registerForm.count()).toBe(1);
    });

    test('Auth screen has skip button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const skipBtn = page.locator('#authSkip');
        expect(await skipBtn.count()).toBe(1);
    });

    test('Auth screen has Google OAuth button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const googleBtn = page.locator('#authGoogle, #authScreen .auth-social-btn.google');
        expect(await googleBtn.count()).toBeGreaterThanOrEqual(1);
    });

    test('Auth screen has Telegram button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tgBtn = page.locator('#authTelegram, #authScreen .auth-social-btn.telegram');
        expect(await tgBtn.count()).toBeGreaterThanOrEqual(1);
    });

    test('Auth screen has terms/privacy links with target=_blank', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const termsLinks = page.locator('#authScreen .auth-footer a[target="_blank"]');
        expect(await termsLinks.count()).toBeGreaterThanOrEqual(2);
    });
});

test.describe('Mobile App — Side Menu', () => {
    test('Side menu overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const menuOverlay = page.locator('#menuOverlay, .menu-overlay');
        expect(await menuOverlay.count()).toBe(1);
    });

    test('Side menu has close button', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const closeBtn = page.locator('#menuClose, .menu-close');
        expect(await closeBtn.count()).toBe(1);
    });

    test('Side menu has Live item', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const liveItem = page.locator('.side-menu .menu-item[data-screen="screenLive"]');
        expect(await liveItem.count()).toBe(1);
    });

    test('Side menu has Battles item', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const battlesItem = page.locator('.side-menu .menu-item[data-screen="screenBattles"]');
        expect(await battlesItem.count()).toBe(1);
    });

    test('Side menu has Courts item', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const courtsItem = page.locator('.side-menu .menu-item[data-screen="screenCourts"]');
        expect(await courtsItem.count()).toBe(1);
    });

    test('Side menu has Coaches item', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const coachesItem = page.locator('.side-menu .menu-item[data-screen="screenCoaches"]');
        expect(await coachesItem.count()).toBe(1);
    });

    test('Side menu has Partners item', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const partnersItem = page.locator('.side-menu .menu-item[data-screen="screenPartners"]');
        expect(await partnersItem.count()).toBe(1);
    });

    test('Side menu has theme control', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const themeControl = page.locator('#menuThemeControl');
        expect(await themeControl.count()).toBe(1);
    });

    test('Side menu has language control', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const langControl = page.locator('#menuLangControl');
        expect(await langControl.count()).toBe(1);

        // 3 language buttons: RU, EN, KG
        const langBtns = langControl.locator('.seg-btn');
        expect(await langBtns.count()).toBe(3);
    });

    test('Side menu has version info', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const versionInfo = page.locator('.menu-footer-ver');
        expect(await versionInfo.count()).toBe(1);
    });
});

test.describe('Mobile App — Splash Screen', () => {
    test('Splash screen overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const splash = page.locator('#splashOverlay, .splash-overlay');
        expect(await splash.count()).toBe(1);
    });

    test('Splash screen has KSLT logo', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        // Знак — картинка, а не надпись: раньше здесь были текст KSLT и мяч
        const mark = page.locator('.splash-mark');
        expect(await mark.count()).toBe(1);
        expect(await mark.getAttribute('src')).toContain('kslt-logo');
    });

    test('Splash screen has tagline', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tagline = page.locator('.splash-tagline');
        expect(await tagline.count()).toBe(1);
        expect((await tagline.textContent()).trim().length).toBeGreaterThan(0);
    });
});

test.describe('Mobile App — Overlays', () => {
    test('Tournament detail overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const tdOverlay = page.locator('#tdOverlay');
        expect(await tdOverlay.count()).toBe(1);
    });

    test('Live match overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const liveOverlay = page.locator('#liveFullOverlay');
        expect(await liveOverlay.count()).toBe(1);
    });

    test('Battle detail overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const battleOverlay = page.locator('#battleOverlay');
        expect(await battleOverlay.count()).toBe(1);
    });

    test('Player detail overlay exists', async ({ page }) => {
        await page.goto('/mobile/www/index.html', { waitUntil: 'domcontentloaded' });

        const playerOverlay = page.locator('#playerOverlay');
        expect(await playerOverlay.count()).toBe(1);
    });
});
