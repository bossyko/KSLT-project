// @ts-check
const { test } = require('../../fixtures');
const { expect } = require('@playwright/test');

/**
 * РЕГИСТРАЦИЯ ПО ВАРИАНТУ B — узор целиком, а не половина.
 *
 * ЗАЧЕМ. Решение Кости 21.09: пароль уходит из формы регистрации, почта
 * подтверждается кодом, пароль предлагается после — на экране «Готово», с
 * кнопкой «Пропустить». У этого узора ТРИ части, и любая в одиночку хуже,
 * чем ничего:
 *   1) в форме нет пароля;
 *   2) на экране входа есть «Войти по коду» — иначе человек без пароля
 *      попадёт внутрь только через «Забыли пароль?», то есть через
 *      починку того, что не сломано;
 *   3) экран «Готово» умеет говорить на всех трёх языках — иначе человек
 *      увидит «Новый пароль» вместо «Готово, аккаунт создан».
 *
 * tools/check-auth.js стережёт те же правила по исходникам. Здесь — то,
 * чего он не видит: что страница действительно так себя ведёт и не падает.
 *
 * ОШИБКИ JS ПРОВЕРЯЮТСЯ ОТДЕЛЬНО И НАРОЧНО. Когда поле пароля убрали,
 * подсказка о его правилах осталась висеть на несуществующем элементе, и
 * КАЖДАЯ загрузка страницы падала с «Cannot read properties of null» —
 * включая экран входа, к регистрации отношения не имеющий. Глазами это не
 * видно: страница выглядит целой.
 *
 * Прогон: npx playwright test tests/e2e/design-system/28-registraciya-bez-parolya.spec.js
 */

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/pages/auth.html' },
    { имя: 'en', адрес: '/pages/auth-en.html' },
    { имя: 'kg', адрес: '/pages/auth-kg.html' }
];

async function дождатьсяСтилей(page) {
    await page.waitForFunction(() => {
        const в = document.querySelector('.auth-tab');
        return в && getComputedStyle(в).minHeight === '44px';
    }, null, { timeout: 15000 });
}

test.describe('Регистрация без пароля — вариант B', () => {

    test('узор целиком на трёх языках', async ({ page }) => {
        for (const с of СТРАНИЦЫ) {
            const ошибки = [];
            page.on('pageerror', e => ошибки.push(String(e)));

            await page.goto(с.адрес, { waitUntil: 'domcontentloaded' });
            await дождатьсяСтилей(page);

            // ---- 2. вход по коду ----
            const поКоду = await page.evaluate(() => {
                const к = document.getElementById('signinByCode');
                if (!к) return null;
                const r = к.getBoundingClientRect();
                return { подпись: к.textContent.trim(), в: Math.round(r.height) };
            });
            expect(поКоду, с.имя + ': нет «Войти по коду» на экране входа').not.toBeNull();
            expect(поКоду.подпись.length, с.имя + ': подпись «Войти по коду» пустая').toBeGreaterThan(3);
            expect(поКоду.в, с.имя + ': цель «Войти по коду» меньше 44').toBeGreaterThanOrEqual(44);

            // ---- 3. тексты экрана «Готово» ----
            const готово = await page.evaluate(() => {
                const ф = document.getElementById('otpNewPasswordForm');
                return ф ? { з: ф.dataset.gotovoTitle, п: ф.dataset.gotovoSkip, к: ф.dataset.gotovoBtn } : null;
            });
            expect(готово, с.имя + ': нет формы установки пароля').not.toBeNull();
            for (const [ключ, имя] of [['з', 'заголовок'], ['п', 'пропустить'], ['к', 'кнопка']]) {
                expect((готово[ключ] || '').length,
                    с.имя + ': у экрана «Готово» пустой ' + имя).toBeGreaterThan(2);
            }

            // ---- 1. форма регистрации ----
            await page.click('.auth-tab[data-tab="signup"]');
            await page.click('#signupShowForm');
            await page.waitForFunction(() => {
                const п = document.getElementById('signupFields');
                return п && п.style.display !== 'none';
            }, null, { timeout: 5000 });

            const форма = await page.evaluate(() => ({
                пароль: !!document.getElementById('signup-password'),
                подтверждение: !!document.getElementById('signup-confirm'),
                ntrp: !!document.getElementById('signup-ntrp'),
                др: !!document.getElementById('signup-birth-day'),
                полей: document.querySelectorAll('#signupFields .auth-input').length,
                карточка: Math.round(document.querySelector('.auth-card').getBoundingClientRect().height)
            }));

            expect(форма.пароль, с.имя + ': поле пароля вернулось в форму').toBe(false);
            expect(форма.подтверждение, с.имя + ': подтверждение пароля вернулось').toBe(false);
            expect(форма.ntrp, с.имя + ': NTRP вернулся в форму').toBe(false);
            expect(форма.др, с.имя + ': дата рождения вернулась в форму').toBe(false);
            expect(форма.полей, с.имя + ': полей ввода должно быть три (имя, фамилия, почта)').toBe(3);

            // ---- страница не падает ----
            expect(ошибки, с.имя + ': ошибки JS на странице').toEqual([]);
            page.removeAllListeners('pageerror');
        }
    });
});
