// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * ВХОД И РЕГИСТРАЦИЯ — снимок геометрии всех состояний.
 *
 * ЗАЧЕМ. Вкладки на карточке обещают ДВА экрана: «Вход» и «Регистрация».
 * В разметке их ДЕВЯТЬ, и семь достижимы только по ходу сценария —
 * восстановление, ввод кода, новый пароль (в двух разных копиях!), две
 * страницы успеха, дозаполнение после Telegram. Мерить только то, что
 * видно при открытии, значит померить два экрана из девяти.
 *
 * КАК ПОКАЗЫВАЕМ СКРЫТЫЕ. Через сценарий пройти нельзя: там настоящая
 * почта, настоящий код и капча, которую трогать запрещено. Поэтому класс
 * .active вешается скриптом — это ровно то же, что делает сама страница
 * при переходе между шагами. Мы не притворяемся, что прошли сценарий: мы
 * показываем экран и меряем его.
 *
 * ЧТО МЕРИМ И ПОЧЕМУ:
 *   1) сколько РАЗНЫХ высот у кнопок на одном экране. 20.09 их было пять —
 *      на глаз это читается как «собрано из кусков»;
 *   2) кегль полей ввода. Ниже 16 Safari на iOS зумит страницу при фокусе,
 *      и человек после первого же касания видит четверть формы;
 *   3) цели нажатия меньше 44;
 *   4) уходит ли форма за сгиб — и на сколько;
 *   5) ширину карточки: одна она на всех экранах или гуляет.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/26-auth-forms.spec.js
 * Результат: tests/reports/auth-forms/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'auth-forms');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/pages/auth.html' },
    { имя: 'en', адрес: '/pages/auth-en.html' },
    { имя: 'kg', адрес: '/pages/auth-kg.html' }
];

// Девять состояний одной карточки. Названия — из разметки.
const ЭКРАНЫ = [
    ['signinForm',          'Вход'],
    ['signupForm',          'Регистрация'],
    ['tgRegisterForm',      'Дозаполнение после Telegram'],
    ['forgotStep1',         'Восстановление: выбор способа'],
    ['otpCodeForm',         'Ввод кода'],
    ['otpNewPasswordForm',  'Новый пароль (после кода)'],
    ['resetForm',           'Новый пароль (по ссылке из письма)'],
    ['resetSuccess',        'Пароль обновлён'],
    ['signupSuccess',       'Проверьте почту']
];

test.describe('Вход и регистрация', () => {
    test('снимок геометрии девяти экранов', async ({ page }, info) => {
        const экран = page.viewportSize();
        const поЯзыкам = {};

        for (const стр of СТРАНИЦЫ) {
            await page.goto(стр.адрес);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(500);

            const поЭкранам = {};
            for (const [ид, название] of ЭКРАНЫ) {
                const замер = await page.evaluate(([ид, название]) => {
                    const кор = ч => Math.round(ч * 10) / 10;
                    const форма = document.getElementById(ид);
                    if (!форма) return { нет_в_разметке: true };

                    document.querySelectorAll('.auth-form').forEach(ф => ф.classList.remove('active'));
                    форма.classList.add('active');
                    // раскрываем поля регистрации: по умолчанию показаны
                    // только способы входа, а сами поля спрятаны
                    const поля = document.getElementById('signupFields');
                    if (ид === 'signupForm' && поля) поля.style.display = '';

                    const карточка = document.querySelector('.auth-card');
                    const rк = карточка.getBoundingClientRect();

                    const кнопки = [];
                    форма.querySelectorAll('button, .auth-btn').forEach(э => {
                        const r = э.getBoundingClientRect();
                        if (r.height > 0) кнопки.push({
                            класс: (э.className || '').toString().split(' ')[0],
                            высота: кор(r.height),
                            кегль: кор(parseFloat(getComputedStyle(э).fontSize))
                        });
                    });

                    const вводы = [];
                    форма.querySelectorAll('input, select, textarea').forEach(э => {
                        const r = э.getBoundingClientRect();
                        if (r.height > 0) вводы.push({
                            тип: э.tagName.toLowerCase() + (э.type ? ':' + э.type : ''),
                            высота: кор(r.height),
                            кегль: кор(parseFloat(getComputedStyle(э).fontSize))
                        });
                    });

                    const цели = [];
                    форма.querySelectorAll('a, button, input, select').forEach(э => {
                        const r = э.getBoundingClientRect();
                        if (r.width > 0 && r.height > 0) цели.push(кор(Math.min(r.width, r.height)));
                    });

                    const уник = м => [...new Set(м)].sort((a, b) => a - b);

                    return {
                        название,
                        карточка: { ширина: кор(rк.width), верх: кор(rк.top), низ: кор(rк.bottom) },
                        за_сгибом: Math.max(0, кор(rк.bottom - innerHeight)),
                        кнопок: кнопки.length,
                        разных_высот_кнопок: уник(кнопки.map(к => к.высота)),
                        разных_кеглей_кнопок: уник(кнопки.map(к => к.кегль)),
                        полей: вводы.length,
                        разных_высот_полей: уник(вводы.map(в => в.высота)),
                        кегли_полей: уник(вводы.map(в => в.кегль)),
                        поля_ниже_16: вводы.filter(в => в.кегль < 16).length,
                        целей: цели.length,
                        наименьшая_цель: цели.length ? Math.min.apply(null, цели) : null,
                        целей_меньше_44: цели.filter(ц => ц < 44).length
                    };
                }, [ид, название]);
                поЭкранам[ид] = замер;
            }

            // Прямая ссылка на регистрацию: открывается ли нужная вкладка
            await page.goto(стр.адрес + '?tab=register');
            await page.waitForTimeout(400);
            const поСсылке = await page.evaluate(() => {
                const активная = document.querySelector('.auth-tab.active');
                const форма = document.querySelector('.auth-form.active');
                return {
                    активная_вкладка: активная ? активная.dataset.tab : null,
                    активная_форма: форма ? форма.id : null
                };
            });

            поЯзыкам[стр.имя] = {
                экран: экран.width + 'x' + экран.height,
                экраны: поЭкранам,
                прямая_ссылка_tab_register: поСсылке
            };
        }

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify(поЯзыкам, null, 2), 'utf8');
        console.log(info.project.name + ': снято ' + (ЭКРАНЫ.length * СТРАНИЦЫ.length) + ' замеров');
    });
});
