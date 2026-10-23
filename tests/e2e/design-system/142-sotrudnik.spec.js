/**
 * КУСОК 142 — СОТРУДНИК КЛУБА НЕ ЧЛЕН КЛУБА.
 *
 * Сторож читает файлы: обхода по роли в них нет. Эта проба читает ЭКРАН:
 * что понятие «сотрудник» отвечает одним словом из дома, и что роль
 * больше не выдаёт членство в обход базы.
 *
 * СЕЙЧАС ИДЁТ БЕСПЛАТНЫЙ ПЕРИОД — ЗАМЕРЕНО 23.10, до 2026-12-31, —
 * и он даёт `active: true` ВСЕМ вошедшим. Поэтому «active: false» для
 * сотрудника проверять нечем: до января его замаскирует бесплатный
 * период. Проба спрашивает ПРИЧИНУ, а не итог: ответ должен прийти с
 * признаком `free_period` и БЕЗ признака `staff_bypass`. Пока обход был
 * на месте, роль отвечала раньше бесплатного периода — и признак был
 * ровно обратный.
 *
 * ВОЙТИ ПРОБА НЕ МОЖЕТ (кабинет за входом, пароля нет), поэтому вошедший
 * ПОДСТАВЛЯЕТСЯ: `window.ksltUser` с заведомо несуществующим id. Это
 * чтение, в базу ничего не пишется.
 */
const { test, expect } = require('@playwright/test');

const ВИТРИНЫ = [
    ['Корты',   '/pages/courts.html'],
    ['Тренеры', '/pages/coaches.html'],
    ['Игроки',  '/pages/players.html']
];
const КАБИНЕТЫ = ['/pages/dashboard.html', '/pages/dashboard-en.html', '/pages/dashboard-kg.html'];

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_DOSTUP, null, { timeout: 15000 });
}

test.describe('сотрудник не член клуба', () => {

    for (const [имя, адрес] of ВИТРИНЫ) {
        test(имя + ': предикат сотрудника живёт в доме и отвечает по роли', async ({ page }) => {
            await page.goto(адрес);
            await дом(page);

            const м = await page.evaluate(() => ({
                есть: typeof window.KSLT_DOSTUP.сотрудникПоРоли,
                админ: window.KSLT_DOSTUP.сотрудникПоРоли('admin'),
                менеджер: window.KSLT_DOSTUP.сотрудникПоРоли('manager'),
                игрок: window.KSLT_DOSTUP.сотрудникПоРоли('player'),
                пусто: window.KSLT_DOSTUP.сотрудникПоРоли(undefined)
            }));

            expect(м.есть, 'предиката в доме нет — кабинет напишет его себе сам').toBe('function');
            expect(м.админ, 'админ — сотрудник').toBe(true);
            expect(м.менеджер, 'менеджер — сотрудник').toBe(true);
            expect(м.игрок, 'игрок сотрудником не становится').toBe(false);
            expect(м.пусто, 'роли нет — и сотрудника нет').toBe(false);
        });
    }

    test('роль не выдаёт членство в обход базы', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await дом(page);
        await page.waitForFunction(() => typeof window.checkMembership === 'function',
            null, { timeout: 15000 });

        const м = await page.evaluate(async () => {
            /* ВОШЕДШИЙ ПОДСТАВЛЯЕТСЯ, А НЕ ВХОДИТ: id заведомо не существует,
               значит в `memberships` по нему ничего нет. */
            window.ksltUser = { id: '00000000-0000-0000-0000-000000000000' };
            window.ksltProfile = { role: 'admin' };
            const ответ = await window.checkMembership();
            const свободно = window.бесплатныйПериод ? await window.бесплатныйПериод() : null;
            return { ответ: ответ, свободно: свободно };
        });

        /* ПРИЗНАК ОБХОДА СНЯТ — это и есть то, что сторожит кусок. */
        expect(м.ответ.membership && м.ответ.membership.staff_bypass,
            'роль снова отвечает раньше базы: вернулся обход по должности').toBeFalsy();

        if (м.свободно) {
            /* бесплатный период отвечает за всех — и ответ должен прийти
               ИМЕННО ОТ НЕГО, а не от роли */
            expect(м.ответ.membership && м.ответ.membership.free_period,
                'членство пришло не от бесплатного периода и не из базы').toBe(true);
            expect(м.ответ.paid, 'бесплатный период не делает членство оплаченным').toBe(false);
        } else {
            expect(м.ответ.active, 'без членства в базе и без периода доступа нет').toBe(false);
        }
    });

    test('дом доступа стоит в кабинете раньше своего потребителя', async ({ page }) => {
        for (const адрес of КАБИНЕТЫ) {
            /* КАБИНЕТ ЗА ВХОДОМ: гостя он уводит на страницу входа, и
               читать разметку кабинета с экрана нечем. Поэтому порядок
               скриптов берётся из ОТВЕТА СЕРВЕРА, а не из окна. */
            const ответ = await page.request.get(адрес);
            expect(ответ.ok(), адрес + ' не отдался').toBeTruthy();
            const html = await ответ.text();
            const дом = html.indexOf('kslt-dostup.js');
            const кабинет = html.indexOf('dashboard.js');
            expect(дом, адрес + ': дома доступа на странице нет').toBeGreaterThan(-1);
            expect(дом, адрес + ': дом позже своего потребителя — зов предиката упадёт')
                .toBeLessThan(кабинет);
        }
    });
});
