// @ts-check
const { test } = require('../../fixtures');
const { expect } = require('@playwright/test');

/**
 * ВОЗВРАТ С ЭКРАНА КОДА — на тот экран, где вводили адрес.
 *
 * ЗАЧЕМ. Ссылка возврата всегда звала showScreen('forgotStep1'), а на экран
 * кода ведут ЧЕТЫРЕ двери: вход по коду, восстановление пароля, регистрация
 * и Telegram. Три из четырёх выбрасывали человека в восстановление пароля —
 * то есть в починку того, что не ломалось. Нашёл Костя вопросом «куда она
 * его перекинет», когда я собирался менять НАДПИСЬ, не проверив ПЕРЕХОД.
 *
 * ВТОРАЯ ПОЛОВИНА. showScreen() чистит все формы через f.reset(). Просто
 * вернуть мало: человек попадает в пустое поле и набирает адрес заново.
 * Поэтому адрес вписывается обратно, и подпись меняется на «Изменить
 * адрес» — она обещает правку, а не пустой бланк.
 *
 * ПОЧЕМУ СЕТЬ ЗАГЛУШЕНА. Настоящая отправка жжёт код: сервер даёт 5 кодов в
 * час на адрес, и база боевая. Тест подменяет ответ send-otp и до сервера не
 * доходит. Живой проход по письму — отдельно, руками, на боевой базе.
 *
 * ЧЕГО ЗДЕСЬ НЕТ. Двери «восстановление», «регистрация» и «Telegram» закрыты
 * капчей Cloudflare, и обойти её тест не может — её нельзя решать. Их
 * стережёт tools/check-auth.js по таблице ПОЛЕ_АДРЕСА.
 *
 * Прогон: npx playwright test tests/e2e/design-system/29-vozvrat-s-ekrana-koda.spec.js
 */

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/pages/auth.html',    подпись: 'Изменить адрес' },
    { имя: 'en', адрес: '/pages/auth-en.html', подпись: 'Change email' },
    { имя: 'kg', адрес: '/pages/auth-kg.html', подпись: 'Дарегин өзгөртүү' }
];

const ПОЧТА = 'proverka.vozvrata@example.com';

async function дождатьсяСтилей(page) {
    await page.waitForFunction(() => {
        const в = document.querySelector('.auth-tab');
        return в && getComputedStyle(в).minHeight === '44px';
    });
}

/** Подменяем проверку кода: сервер отвечает «неверный код», попыток 2. */
async function заглушитьПроверку(page) {
    await page.route('**/functions/v1/verify-otp', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'wrong_code', remaining: 2 })
        });
    });
}

/** Подменяем отправку кода: до сервера не идём, код не жжём. */
async function заглушитьОтправку(page) {
    await page.route('**/functions/v1/send-otp', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, channel: 'email' })
        });
    });
}

for (const с of СТРАНИЦЫ) {
    test.describe('возврат с экрана кода · ' + с.имя, () => {

        test('подпись называет назначение, а не направление', async ({ page }) => {
            await page.goto(с.адрес);
            await дождатьсяСтилей(page);
            const текст = (await page.locator('#otpBackToForgot').textContent() || '').trim();
            expect(текст, 'подпись ссылки возврата').toBe(с.подпись);
        });

        test('цель нажатия не меньше 44 по высоте', async ({ page }) => {
            // Экран кода скрыт, пока на него не пришли: мерить надо ОТКРЫТЫМ.
            // Первый заход мерил на загрузке и падал пятнадцать раз подряд —
            // это была ошибка проверки, а не разметки.
            await заглушитьОтправку(page);
            await page.goto(с.адрес);
            await дождатьсяСтилей(page);
            await page.fill('#signin-email', ПОЧТА);
            await page.click('#signinByCode');
            await expect(page.locator('#otpCodeForm')).toHaveClass(/active/);

            const р = await page.locator('#otpBackToForgot').boundingBox();
            expect(р && Math.round(р.height), 'высота цели «изменить адрес»').toBeGreaterThanOrEqual(44);
            expect(р && Math.round(р.width), 'ширина цели — по тексту, не во всю карточку')
                .toBeLessThan(300);
        });

        test('вход по коду: возврат ведёт на форму входа, адрес на месте', async ({ page }) => {
            const ошибкиJS = [];
            page.on('pageerror', e => ошибкиJS.push(String(e)));

            await заглушитьОтправку(page);
            await page.goto(с.адрес);
            await дождатьсяСтилей(page);

            await page.fill('#signin-email', ПОЧТА);
            await page.click('#signinByCode');
            await expect(page.locator('#otpCodeForm')).toHaveClass(/active/);

            await page.click('#otpBackToForgot');

            await expect(page.locator('#signinForm'), 'вернулись на форму входа')
                .toHaveClass(/active/);
            await expect(page.locator('#forgotStep1'), 'восстановление пароля НЕ открылось')
                .not.toHaveClass(/active/);
            await expect(page.locator('#signin-email'), 'адрес вернулся в поле')
                .toHaveValue(ПОЧТА);
            await expect(page.locator('.auth-tab[data-tab="signin"]'), 'активна вкладка входа')
                .toHaveClass(/active/);

            expect(ошибкиJS, 'ошибки JS за проход').toEqual([]);
        });

        test('две ссылки под паролем — два разных действия', async ({ page }) => {
            await page.goto(с.адрес);
            await дождатьсяСтилей(page);

            // «Забыли пароль?» — своя дверь. Обработчик висел на соседке, и
            // эта ссылка не делала ровно ничего.
            await page.click('#signinForgot');
            await expect(page.locator('#forgotStep1'), '«Забыли пароль?» открывает восстановление')
                .toHaveClass(/active/);
        });

        test('ошибка видна на экране, а не за сгибом', async ({ page }) => {
            await заглушитьОтправку(page);
            await заглушитьПроверку(page);
            await page.goto(с.адрес);
            await дождатьсяСтилей(page);

            await page.fill('#signin-email', ПОЧТА);
            await page.click('#signinByCode');
            await expect(page.locator('#otpCodeForm')).toHaveClass(/active/);

            // набираем шесть цифр — код уходит сам, ответ заглушён
            const клетки = page.locator('#otpInputs .otp-digit');
            for (let i = 0; i < 6; i++) await клетки.nth(i).fill(String(i + 1));

            const ошибка = page.locator('#otpCodeForm .auth-message-error');
            await expect(ошибка, 'сообщение об ошибке показано').toBeVisible();

            // главное: оно ВНУТРИ экрана, а не ниже сгиба
            const рамка = await ошибка.boundingBox();
            const высотаЭкрана = page.viewportSize().height;
            expect(рамка && Math.round(рамка.y + рамка.height), 'низ сообщения не ниже сгиба')
                .toBeLessThanOrEqual(высотаЭкрана);

            // и оно объявляется вслух
            await expect(ошибка, 'сообщение объявляется диктором').toHaveAttribute('role', 'alert');

            // клетки — не уже 44 там, где палец
            const первая = await клетки.first().boundingBox();
            const сенсорный = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
            if (сенсорный) {
                expect(первая && Math.round(первая.width), 'ширина клетки на сенсорном экране')
                    .toBeGreaterThanOrEqual(44);
            }
        });
    });
}
