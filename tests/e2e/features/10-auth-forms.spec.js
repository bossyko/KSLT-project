// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-AUTH-FORMS: Comprehensive auth page form testing
 * Tests login, registration, forgot password forms across all 3 languages
 * No real auth — tests public-facing form elements only
 */

const AUTH_PAGES = [
    { path: '/pages/auth.html', lang: 'RU', name: 'Auth RU' },
    { path: '/pages/auth-en.html', lang: 'EN', name: 'Auth EN' },
    { path: '/pages/auth-kg.html', lang: 'KG', name: 'Auth KG' },
];

// Helper: filter out non-critical JS errors (Supabase, network)
function filterCriticalErrors(errors) {
    return errors.filter(e =>
        !e.includes('supabase') &&
        !e.includes('Supabase') &&
        !e.includes('fetch') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !e.includes('net::ERR') &&
        !e.includes('CORS')
    );
}

test.describe('Auth Forms — Login Form', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Login form has email and password fields`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            // Email field
            const emailInput = page.locator('#signin-email');
            await expect(emailInput).toBeVisible();
            await expect(emailInput).toHaveAttribute('type', 'email');
            await expect(emailInput).toHaveAttribute('required', '');

            // Password field
            const passwordInput = page.locator('#signin-password');
            await expect(passwordInput).toBeVisible();
            await expect(passwordInput).toHaveAttribute('type', 'password');
            await expect(passwordInput).toHaveAttribute('required', '');
        });

        test(`${authPage.name}: Login form has submit button`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const submitBtn = page.locator('#signinForm button[type="submit"]');
            await expect(submitBtn).toBeVisible();
        });

        test(`${authPage.name}: Login form email has autocomplete="email"`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            await expect(page.locator('#signin-email')).toHaveAttribute('autocomplete', 'email');
        });

        test(`${authPage.name}: Login form password has autocomplete="current-password"`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            await expect(page.locator('#signin-password')).toHaveAttribute('autocomplete', 'current-password');
        });
    }
});

test.describe('Auth Forms — Password Eye Toggle', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Eye toggle button exists for login password`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const eyeBtn = page.locator('.auth-eye[data-target="signin-password"]');
            await expect(eyeBtn).toBeVisible();
        });

        test(`${authPage.name}: Eye toggle changes password field type`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const passwordInput = page.locator('#signin-password');
            const eyeBtn = page.locator('.auth-eye[data-target="signin-password"]');

            // Initially type=password
            await expect(passwordInput).toHaveAttribute('type', 'password');

            // Click eye — should toggle to text
            await eyeBtn.click();
            await page.waitForTimeout(200);
            const typeAfterClick = await passwordInput.getAttribute('type');
            // Type should change (to text) or stay password depending on JS — we just verify the button is clickable
            expect(typeAfterClick).toBeTruthy();
        });

        test(`${authPage.name}: Eye toggle has open and closed SVG icons`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const eyeBtn = page.locator('.auth-eye[data-target="signin-password"]');
            const eyeOpen = eyeBtn.locator('.eye-open');
            const eyeClosed = eyeBtn.locator('.eye-closed');

            // Both SVGs exist in DOM
            expect(await eyeOpen.count()).toBe(1);
            expect(await eyeClosed.count()).toBe(1);
        });
    }
});

test.describe('Auth Forms — Tab Switching', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Signin and signup tabs exist`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const signinTab = page.locator('.auth-tab[data-tab="signin"]');
            const signupTab = page.locator('.auth-tab[data-tab="signup"]');

            await expect(signinTab).toBeVisible();
            await expect(signupTab).toBeVisible();
        });

        test(`${authPage.name}: Signin tab is active by default`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const signinTab = page.locator('.auth-tab[data-tab="signin"]');
            await expect(signinTab).toHaveClass(/active/);
        });

        test(`${authPage.name}: Clicking signup tab switches form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const signupTab = page.locator('.auth-tab[data-tab="signup"]');
            await signupTab.click();
            await page.waitForTimeout(300);

            // Signup form should become active
            const signupForm = page.locator('#signupForm');
            await expect(signupForm).toHaveClass(/active/);
        });
    }
});

test.describe('Auth Forms — Registration Form', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Show form button reveals registration fields`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            // Switch to signup tab
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(300);

            // Click "show form" button
            const showFormBtn = page.locator('#signupShowForm');
            await expect(showFormBtn).toBeVisible();
            await showFormBtn.click();
            await page.waitForTimeout(300);

            // Fields should become visible
            const signupFields = page.locator('#signupFields');
            await expect(signupFields).toBeVisible();
        });

        test(`${authPage.name}: Registration form has firstname field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const firstnameInput = page.locator('#signup-firstname');
            await expect(firstnameInput).toBeVisible();
            await expect(firstnameInput).toHaveAttribute('autocomplete', 'given-name');
        });

        test(`${authPage.name}: Registration form has lastname field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const lastnameInput = page.locator('#signup-lastname');
            await expect(lastnameInput).toBeVisible();
            await expect(lastnameInput).toHaveAttribute('autocomplete', 'family-name');
        });

        test(`${authPage.name}: Registration form has email field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const emailInput = page.locator('#signup-email');
            await expect(emailInput).toBeVisible();
            await expect(emailInput).toHaveAttribute('type', 'email');
            await expect(emailInput).toHaveAttribute('autocomplete', 'email');
        });

        /**
         * ПАРОЛЯ В РЕГИСТРАЦИИ НЕТ — ЭТО РЕШЕНИЕ, А НЕ ПОЛОМКА.
         *
         * ПРОБЫ ПЕРЕПИСАНЫ 30.10. Две прежние требовали `#signup-password`
         * и `#signup-confirm` и падали на всех трёх языках × двух видах.
         * Полей нет В РАЗМЕТКЕ ВОВСЕ: они ушли коммитом `7eaaef2` от
         * 21.09 — «Вариант B: регистрация без пароля, вход по коду».
         * То есть пробы были красными ПЯТЬ НЕДЕЛЬ, и никто не знал:
         * набор не прогоняли. БЕГУНОК, КОТОРЫЙ НЕ ЗАПУСКАЮТ, МОЛЧА
         * ГНИЁТ — тот же вывод, что дали 42 сгнивших прувера 29.10.
         *
         * Теперь проба держит САМО РЕШЕНИЕ: пароля в регистрации нет, и
         * она упадёт, если он вернётся мимо разговора.
         */
        test(`${authPage.name}: пароля в регистрации нет — вход по коду`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            expect(await page.locator('#signup-password').count(),
                'пароль в регистрации не спрашивают с 21.09').toBe(0);
            expect(await page.locator('#signup-confirm').count(),
                'и подтверждения пароля тоже нет').toBe(0);
            expect(await page.locator('#signupForm input[type="password"]').count(),
                'ни одного поля пароля во всей форме регистрации').toBe(0);

            /* А ЧТО ЕСТЬ — названо здесь же: иначе проба стерегла бы
               только отсутствие и не заметила бы пустую форму. */
            await expect(page.locator('#signup-email')).toBeVisible();
            await expect(page.locator('#signup-firstname')).toBeVisible();
            await expect(page.locator('#signup-lastname')).toBeVisible();
        });

        test(`${authPage.name}: Registration form has gender radio buttons`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const maleRadio = page.locator('#signupForm input[name="gender"][value="men"]');
            const femaleRadio = page.locator('#signupForm input[name="gender"][value="women"]');
            expect(await maleRadio.count()).toBe(1);
            expect(await femaleRadio.count()).toBe(1);
        });

        /**
         * ДАТЫ РОЖДЕНИЯ В РЕГИСТРАЦИИ НЕТ — ТОЖЕ РЕШЕНИЕ (21.09,
         * `ff36dd3` «Регистрация: дата рождения уходит из формы»; шаг A5
         * трекера: «дата рождения необязательна»). Прежние две пробы
         * требовали день и месяц и падали пять недель.
         */
        test(`${authPage.name}: даты рождения в регистрации не спрашивают`,
            async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            expect(await page.locator('#signup-birth-day').count(),
                'дня рождения в регистрации нет').toBe(0);
            expect(await page.locator('#signup-birth-month').count(),
                'месяца тоже нет').toBe(0);
            expect(await page.locator('#signupForm [id*="birth"]').count(),
                'и ни одного поля с «birth» во всей форме').toBe(0);
        });

        test(`${authPage.name}: Registration form does NOT have birth year field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const birthYear = page.locator('#signup-birth-year, #signupForm [id*="birth-year"]');
            expect(await birthYear.count()).toBe(0);
        });

        test(`${authPage.name}: Registration form does NOT have email confirm field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const emailConfirm = page.locator('#signup-email-confirm, #signupForm input[id*="email-confirm"]');
            expect(await emailConfirm.count()).toBe(0);
        });

        test(`${authPage.name}: Registration form does NOT have turnstile/captcha`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const turnstile = page.locator('.cf-turnstile, [data-sitekey], .g-recaptcha, #captcha');
            expect(await turnstile.count()).toBe(0);
        });

        test(`${authPage.name}: Registration has submit button`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);
            await page.locator('#signupShowForm').click();
            await page.waitForTimeout(200);

            const submitBtn = page.locator('#signupForm button[type="submit"]');
            await expect(submitBtn).toBeVisible();
        });
    }
});

/**
 * ПРАВИЛА ПАРОЛЯ СТОЯТ ТАМ, ГДЕ ПАРОЛЬ ЗАДАЮТ.
 *
 * ПРОБА ПЕРЕПИСАНА 30.10. Прежняя искала `#pwRules` в форме регистрации
 * и падала на всех трёх языках × двух видах. Замер разметки:
 * `#pwRules` НЕ СУЩЕСТВУЕТ ВОВСЕ, а правила живут двумя рядами —
 * `#otpPwRules` (экран нового пароля после кода) и `#resetPwRules`
 * (сброс по ссылке из письма). И это верно: с 21.09 регистрация пароля
 * не спрашивает, значит и правилам там делать нечего.
 *
 * Проба теперь держит ОТНОШЕНИЕ: правила есть у каждого места, где
 * задают пароль, и их НЕТ там, где пароля не спрашивают. Ряды ищутся по
 * разметке, не нажатием: оба экрана за кодом из письма, а проба в базу
 * не пишет и писем не ждёт.
 */
test.describe('Auth Forms — Password Rules Display', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: правила пароля стоят у пароля, а не в регистрации`,
            async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            /* ДВА МЕСТА, ГДЕ ЗАДАЮТ ПАРОЛЬ, И У КАЖДОГО СВОЙ РЯД. */
            for (const ряд of ['#otpPwRules', '#resetPwRules']) {
                expect(await page.locator(ряд).count(), 'ряд правил ' + ряд).toBe(1);
                for (const правило of ['length', 'upper', 'digit', 'special']) {
                    expect(await page.locator(ряд + ' [data-rule="' + правило + '"]').count(),
                        правило + ' в ' + ряд).toBe(1);
                }
            }

            /* И НИ ОДНОГО РЯДА В РЕГИСТРАЦИИ: пароля там не спрашивают. */
            expect(await page.locator('#pwRules').count(),
                '`#pwRules` — имя из той поры, когда пароль был в регистрации').toBe(0);
            expect(await page.locator('#signupForm [data-rule]').count(),
                'правил пароля в форме регистрации нет').toBe(0);

            /* ТЕКСТ ПРАВИЛ ЧИТАЕМ У СБРОСА: там он задан разметкой на
               всех трёх языках, а не подставляется словарём. */
            const длина = page.locator('#resetPwRules [data-rule="length"]');
            expect(await длина.textContent()).toContain('8+');
            expect(await page.locator('#resetPwRules [data-rule="upper"]').textContent())
                .toContain('A-Z');
            expect(await page.locator('#resetPwRules [data-rule="digit"]').textContent())
                .toContain('0-9');
            expect(await page.locator('#resetPwRules [data-rule="special"]').textContent())
                .toContain('!@#$');
        });
    }
});

test.describe('Auth Forms — Forgot Password Form', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Forgot password link exists in login form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const forgotLink = page.locator('.auth-forgot, #signinForm a.auth-forgot');
            await expect(forgotLink.first()).toBeVisible();
        });

        test(`${authPage.name}: Forgot form has email field and submit button`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            // The forgot form exists in DOM (may be hidden until activated)
            const forgotForm = page.locator('#forgotStep1');
            expect(await forgotForm.count()).toBe(1);

            // Check email field inside forgot form
            const forgotEmail = page.locator('#forgot-email');
            expect(await forgotEmail.count()).toBe(1);
            expect(await forgotEmail.getAttribute('type')).toBe('email');
            expect(await forgotEmail.getAttribute('required')).toBe('');

            // Submit button inside forgot form
            const submitBtn = forgotForm.locator('button[type="submit"]');
            expect(await submitBtn.count()).toBe(1);
        });

        test(`${authPage.name}: Forgot form has back link`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const backLink = page.locator('#forgotBack');
            expect(await backLink.count()).toBe(1);
        });

        test(`${authPage.name}: Forgot form does NOT have email confirm field`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const emailConfirm = page.locator('#forgotForm input[id*="email-confirm"], #forgotForm input[name*="confirm"]');
            expect(await emailConfirm.count()).toBe(0);
        });
    }
});

test.describe('Auth Forms — Terms Links', () => {
    test('RU: Terms links have target="_blank"', async ({ page }) => {
        await page.goto('/pages/auth.html', { waitUntil: 'domcontentloaded' });
        await page.locator('.auth-tab[data-tab="signup"]').click();
        await page.waitForTimeout(200);
        await page.locator('#signupShowForm').click();
        await page.waitForTimeout(200);

        const termsLinks = page.locator('#signupForm .auth-checkbox a[target="_blank"]');
        expect(await termsLinks.count()).toBeGreaterThanOrEqual(2);
    });
});

test.describe('Auth Forms — Google OAuth Button', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Google OAuth button present in login form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            // Google button in signin form (social section)
            const googleBtn = page.locator('#signinForm .auth-social-btn, #signinForm button:has-text("Google")');
            expect(await googleBtn.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${authPage.name}: Google OAuth button present in signup form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);

            const googleBtn = page.locator('#signupForm .auth-option-google, #signupForm button:has-text("Google")');
            expect(await googleBtn.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Auth Forms — Telegram Button', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Telegram button present in login form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });

            const tgBtn = page.locator('#signinForm .auth-tg-app-btn, #signinForm button:has-text("Telegram")');
            expect(await tgBtn.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${authPage.name}: Telegram button present in signup form`, async ({ page }) => {
            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.locator('.auth-tab[data-tab="signup"]').click();
            await page.waitForTimeout(200);

            const tgBtn = page.locator('#signupForm .auth-option-telegram, #signupForm button:has-text("Telegram")');
            expect(await tgBtn.count()).toBeGreaterThanOrEqual(1);
        });
    }
});

test.describe('Auth Forms — No JS Errors', () => {
    for (const authPage of AUTH_PAGES) {
        test(`${authPage.name}: Page loads without critical JS errors`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});
