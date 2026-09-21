// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');
const { expect } = require('@playwright/test');

/**
 * ВХОД — геометрия после закрытия экрана 21.09.2026.
 *
 * ЗАЧЕМ. tools/check-auth.js стережёт ПРАВИЛА по исходникам и не открывает
 * браузер. Он не может сказать, что получилось на экране: сетка могла
 * встать не так, кыргызская подпись могла перенестись в две строки,
 * кнопка могла уйти за сгиб. Это делает здесь.
 *
 * ЧТО МЕРИМ:
 *   1) уходит ли что-нибудь за сгиб — кнопка входа И способы входа.
 *      До 21.09 на 844x390 способы были за сгибом на 158px, и человек
 *      про Google и Telegram просто не узнавал;
 *   2) две колонки включаются ровно там, где должны: экран ниже 680 и
 *      шире 600, и больше нигде;
 *   3) вкладки: дорожка 44, цель 44, пилюля 38 — рисунок и палец это
 *      разные числа, и они намеренно не равны;
 *   4) цели нажатия меньше 44 — их должно быть ноль;
 *   5) Apple под включённым флагом: кнопка той же высоты 52 и тоже
 *      не уходит за сгиб.
 *
 * Прогон: npx playwright test tests/e2e/design-system/27-vhod-dve-kolonki.spec.js
 * Результат: tests/reports/vhod/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'vhod');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/pages/auth.html' },
    { имя: 'en', адрес: '/pages/auth-en.html' },
    { имя: 'kg', адрес: '/pages/auth-kg.html' }
];

const ЗАМЕР = function () {
    window.scrollTo(0, 0);
    const экран = window.innerHeight;
    const карточка = document.querySelector('.auth-card');
    const кнопка = document.querySelector('#signinForm .auth-btn');
    const дорожка = document.querySelector('.auth-tabs');
    const активная = document.querySelector('.auth-tab.active');
    const почта = document.querySelector('#signin-email');

    const способы = Array.from(document.querySelectorAll('#signinForm .auth-col-methods > *'))
        .filter(function (э) { return э.getBoundingClientRect().height > 0; });
    const низСпособов = способы.length
        ? Math.max.apply(null, способы.map(function (э) { return э.getBoundingClientRect().bottom; }))
        : 0;

    const ст = getComputedStyle(активная);
    const кк = карточка.getBoundingClientRect();
    const кн = кнопка.getBoundingClientRect();
    const ак = активная.getBoundingClientRect();

    const мелкие = [];
    document.querySelectorAll('#signinForm button, #signinForm a, .auth-tab').forEach(function (э) {
        const r = э.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.width < 44 || r.height < 44) {
            мелкие.push((э.textContent || э.className).trim().slice(0, 24) +
                ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
    });

    return {
        экран: экран,
        ширинаОкна: window.innerWidth,
        карточка: Math.round(кк.width) + 'x' + Math.round(кк.height),
        колонок: getComputedStyle(карточка).gridTemplateColumns.trim().split(/\s+/).length,
        вкладкиРазныхКолонок: Math.round(дорожка.getBoundingClientRect().left) !==
                              Math.round(почта.getBoundingClientRect().left),
        дорожка: Math.round(дорожка.getBoundingClientRect().height),
        цельВкладки: Math.round(ак.height),
        пилюля: Math.round(ак.height - parseFloat(ст.borderTopWidth) - parseFloat(ст.borderBottomWidth)),
        строкВПодписи: Math.round(ак.height) > 60,
        кнопкаЗаСгибом: Math.max(0, Math.round(кн.bottom - экран)),
        способыЗаСгибом: Math.max(0, Math.round(низСпособов - экран)),
        способов: способы.length,
        высотыСпособов: способы.map(function (э) { return Math.round(э.getBoundingClientRect().height); }),
        мелкие: мелкие
    };
};

test.describe('Вход — две колонки и размеры по шкале', () => {

    test('геометрия на трёх языках', async ({ page }, info) => {
        const окно = page.viewportSize();
        const поЯзыкам = {};

        for (const с of СТРАНИЦЫ) {
            await page.goto(с.адрес, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(400);
            const з = await page.evaluate(ЗАМЕР);
            поЯзыкам[с.имя] = з;

            // 1. за сгибом не должно быть ничего — ни кнопки, ни способов
            expect(з.кнопкаЗаСгибом, с.имя + ': кнопка «Войти» за сгибом').toBe(0);
            expect(з.способыЗаСгибом, с.имя + ': способы входа за сгибом').toBe(0);

            // 2. две колонки ровно там, где положено
            const должноБытьДве = з.экран <= 680 && з.ширинаОкна >= 600;
            expect(з.колонок === 2, с.имя + ': колонок ' + з.колонок +
                ' при экране ' + з.ширинаОкна + 'x' + з.экран).toBe(должноБытьДве);
            expect(з.вкладкиРазныхКолонок, с.имя + ': вкладки и поле почты в одной колонке')
                .toBe(должноБытьДве);

            // 3. вкладки: рисунок и палец — разные числа
            expect(з.дорожка, с.имя + ': дорожка вкладок').toBe(44);
            expect(з.цельВкладки, с.имя + ': цель нажатия вкладки').toBe(44);
            expect(з.пилюля, с.имя + ': нарисованная пилюля').toBe(38);

            // 4. целей меньше 44 быть не должно
            expect(з.мелкие, с.имя + ': цели меньше 44').toEqual([]);

            // 5. способы входа одной высоты
            const высоты = Array.from(new Set(з.высотыСпособов));
            expect(высоты.length, с.имя + ': способы входа разной высоты — ' +
                з.высотыСпособов.join(', ')).toBe(1);
        }

        // ---- Apple: тот же замер, но с включённым флагом ----
        await page.addInitScript(() => { window.KSLT_APPLE = true; });
        await page.goto(СТРАНИЦЫ[0].адрес, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
        const сApple = await page.evaluate(ЗАМЕР);
        поЯзыкам['ru + Apple'] = сApple;

        expect(сApple.способов, 'под флагом должно быть три способа входа').toBe(3);
        expect(Array.from(new Set(сApple.высотыСпособов)),
            'Apple выбивается по высоте из ряда: ' + сApple.высотыСпособов.join(', '))
            .toEqual([52]);
        expect(сApple.способыЗаСгибом, 'с Apple способы уходят за сгиб').toBe(0);
        expect(сApple.кнопкаЗаСгибом, 'с Apple кнопка уходит за сгиб').toBe(0);

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify({ вид: окно, языки: поЯзыкам }, null, 1));
    });
});
