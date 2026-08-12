// @ts-check
const { test, expect } = require('../fixtures');

/**
 * TC-DASHBOARD: разметка кабинета.
 *
 * Кабинет закрыт: без входа страница уводит на форму авторизации, и искать
 * в ней разделы кабинета бессмысленно. Поэтому проверки идут под сессией
 * тестового игрока — её готовит tests/auth-setup.js.
 */

// Все проверки в файле идут от лица тестового игрока
test.use({ storageState: require('../auth-setup').playerState });

const DASHBOARD_PAGES = [
    { path: '/pages/dashboard.html', lang: 'RU', name: 'Dashboard RU' },
    { path: '/pages/dashboard-en.html', lang: 'EN', name: 'Dashboard EN' },
    { path: '/pages/dashboard-kg.html', lang: 'KG', name: 'Dashboard KG' },
];

// Helper: filter out non-critical JS errors (Supabase, auth redirects, network)
function filterCriticalErrors(errors) {
    return errors.filter(e =>
        !e.includes('supabase') &&
        !e.includes('Supabase') &&
        !e.includes('fetch') &&
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !e.includes('net::ERR') &&
        !e.includes('CORS') &&
        !e.includes('auth') &&
        !e.includes('session') &&
        !e.includes('getSession') &&
        !e.includes('getUser') &&
        !e.includes('redirect') &&
        !e.includes('null')
    );
}

test.describe('Dashboard Page — Load without crash', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Loads with HTTP 200`, async ({ page }) => {
            const response = await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);
        });

        test(`${dashPage.name}: No critical JS errors on load`, async ({ page }) => {
            const jsErrors = [];
            page.on('pageerror', err => jsErrors.push(err.message));

            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);

            const critical = filterCriticalErrors(jsErrors);
            expect(critical).toEqual([]);
        });
    }
});

test.describe('Dashboard Page — Structure', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Has header element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('header')).toBeVisible();
        });

        test(`${dashPage.name}: Has KSLT logo`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('.logo-img').first()).toBeVisible();
        });

        test(`${dashPage.name}: Has profile section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const profileSection = page.locator('#db-profile');
            expect(await profileSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has stats section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const statsSection = page.locator('#db-stats');
            expect(await statsSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has games section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const gamesSection = page.locator('#db-games');
            expect(await gamesSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has sidebar element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const sidebar = page.locator('#dbSidebar, .db-sidebar');
            expect(await sidebar.count()).toBe(1);
        });

        test(`${dashPage.name}: Has mobile tabs element`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const mobileTabs = page.locator('#dbMobileTabs, .db-mobile-tabs');
            expect(await mobileTabs.count()).toBe(1);
        });

        test(`${dashPage.name}: Has layout container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const layout = page.locator('.db-layout');
            expect(await layout.count()).toBe(1);
        });

        test(`${dashPage.name}: Has vouchers section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const vouchersSection = page.locator('#db-vouchers');
            expect(await vouchersSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has loyalty section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const loyaltySection = page.locator('#db-loyalty');
            expect(await loyaltySection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has payments section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const paymentsSection = page.locator('#db-payments');
            expect(await paymentsSection.count()).toBe(1);
        });

        test(`${dashPage.name}: Has settings section container`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const settingsSection = page.locator('#db-settings');
            expect(await settingsSection.count()).toBe(1);
        });
    }
});

test.describe('Dashboard Page — Navigation Elements', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Has nav-links in header`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const navLinks = page.locator('.nav-links');
            expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
        });

        test(`${dashPage.name}: Has language dropdown`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const langDropdown = page.locator('#langDropdown, .lang-dropdown');
            expect(await langDropdown.count()).toBe(1);
        });

        test(`${dashPage.name}: Has burger menu button`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const burgerMenu = page.locator('#burgerMenu, .burger-menu');
            expect(await burgerMenu.count()).toBe(1);
        });
    }
});

/**
 * TC-DASHBOARD-GAMES: состав и порядок подразделов «Мои игры».
 *
 * Порядок здесь не украшение: турниры дают рейтинг, матчи их разбирают,
 * баттлы играются вне зачёта, приглашения ещё даже не игра. Раньше
 * подразделов было три (матчи, вызовы, турниры), вызовы и баттлы жили
 * порознь, хотя в базе это одна строка challenges, а приглашения занимали
 * отдельный пункт бокового меню наравне с турнирами.
 */
test.describe('Dashboard Page — My Games subsections', () => {
    for (const dashPage of DASHBOARD_PAGES) {
        test(`${dashPage.name}: Five subsections in fixed order`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            const bodies = page.locator('#db-games .db-subsection-body');
            await expect(bodies.first()).toBeAttached({ timeout: 15000 });
            await expect(bodies).toHaveCount(5);

            expect(await bodies.nth(0).getAttribute('id')).toBe('dbSubUpcoming');
            expect(await bodies.nth(1).getAttribute('id')).toBe('dbSubTournaments');
            expect(await bodies.nth(2).getAttribute('id')).toBe('dbSubMatches');
            expect(await bodies.nth(3).getAttribute('id')).toBe('dbSubBattles');
            expect(await bodies.nth(4).getAttribute('id')).toBe('dbSubInvites');
        });

        // Пустой блок «Предстоящие турниры» висел бы девять месяцев в году
        test(`${dashPage.name}: Upcoming block is shown only when it has rows`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            // Ждём, пока отрисуются прошедшие турниры — к этому моменту
            // предстоящие уже решили, показываться им или нет
            await expect(page.locator('#dbGamesTournaments .db-subsection-loading'))
                .toHaveCount(0, { timeout: 20000 });

            const wrap = page.locator('#dbSubUpcoming').locator('..');
            const rows = await page.locator('#dbGamesUpcoming tbody tr').count();
            expect(await wrap.isVisible()).toBe(rows > 0);
        });

        /**
         * Каждый подраздел обязан догрузиться.
         *
         * Ошибка внутри загрузчика гасится в catch и уходит в консоль — на
         * экране остаётся вечное «Загрузка...», а набор тестов при этом
         * зелёный: проверялось только наличие блоков, а не то, что в них
         * что-то появилось. Так пропустили ReferenceError, из-за которого
         * матчи и баттлы не отображались вовсе.
         */
        test(`${dashPage.name}: Every subsection finishes loading`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            for (const id of ['dbGamesTournaments', 'dbGamesMatches', 'dbGamesBattles', 'dbGamesInvites']) {
                await expect(page.locator(`#${id} .db-subsection-loading`),
                    `${id} застрял на загрузке`).toHaveCount(0, { timeout: 20000 });
                await expect(page.locator(`#${id}`),
                    `${id} остался пустым`).not.toBeEmpty();
            }
        });

        test(`${dashPage.name}: No separate Invitations tab`, async ({ page }) => {
            await page.goto(dashPage.path, { waitUntil: 'domcontentloaded' });

            await expect(page.locator('.db-sidebar-link').first()).toBeAttached({ timeout: 15000 });
            expect(await page.locator('[data-tab="invitations"]').count()).toBe(0);
            expect(await page.locator('#db-invitations').count()).toBe(0);
        });

        test(`${dashPage.name}: Old #invitations link lands on My Games`, async ({ page }) => {
            await page.goto(dashPage.path + '#invitations', { waitUntil: 'domcontentloaded' });

            // Раздел «Мои игры» помечен активным ещё в разметке, так что сам
            // по себе он ничего не доказывает: ждём, пока отработает скрипт
            await expect(page.locator('.db-sidebar-link').first()).toBeAttached({ timeout: 15000 });
            await expect.poll(() => page.url(), { timeout: 10000 }).toContain('#games');
            await expect(page.locator('#db-games')).toHaveClass(/active/);
        });
    }
});
