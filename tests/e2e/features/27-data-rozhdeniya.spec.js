// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-DR: дата рождения необязательна, и регистрация через Telegram не
 * падает (кусок A5).
 *
 * ЗАМЕР: `birth_day/_month/_year` встречаются в 42 местах, и НИ В ОДНОМ
 * нет проверки возраста. Слово Кости 29.10: возрастных категорий не
 * будет. Значит три обещания обязательности — звёздочка в кабинете,
 * звёздочка на трёх страницах входа и атрибут `required` — обещали то,
 * чего никто не требует. `required` был единственным, который браузер
 * ДЕЙСТВИТЕЛЬНО требовал, и его проверяет этот файл НА ЖИВОЙ СТРАНИЦЕ:
 * сторож видит атрибут в файле, а браузер — в разобранном дереве.
 *
 * ЖИВАЯ БЕДА, КОТОРУЮ ЗАКРЫЛ ЭТОТ КУСОК: `tg-birth-year` читался без
 * защиты, а элемента с таким id нет ни в одной разметке — `.value` у
 * `null` бросал TypeError, и регистрация через Telegram ПАДАЛА при
 * отправке формы.
 *
 * ФОРМУ ТЕСТ НЕ ОТПРАВЛЯЕТ. Отправка посылает человеку код и пишет в
 * базу; доказывается не нажатием, а тем, что в коде, КОТОРЫЙ ОТДАЁТ
 * СТРАНИЦА, незащищённого чтения не осталось — и что элемента, из-за
 * которого падало, действительно нет в разобранном дереве.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/auth.html', метка: 'Дата рождения' },
    { язык: 'en', адрес: '/pages/auth-en.html', метка: 'Date of Birth' },
    { язык: 'kg', адрес: '/pages/auth-kg.html', метка: 'Туулган күнү' }
];

test.describe('Дата рождения — необязательна', () => {

    for (const с of СТРАНИЦЫ) {
        test('страница входа · ' + с.язык, async ({ page }) => {
            const ошибки = [];
            page.on('pageerror', e => ошибки.push(String(e.message || e)));
            await page.goto(с.адрес, { waitUntil: 'domcontentloaded' });
            await page.locator('#tg-birth-day').waitFor({ state: 'attached', timeout: 20000 });

            const снимок = await page.evaluate((метка) => {
                const поля = ['tg-birth-day', 'tg-birth-month', 'tg-birth-year'];
                const состояние = {};
                for (const id of поля) {
                    const э = document.getElementById(id);
                    состояние[id] = э ? { есть: true, required: э.required } : { есть: false };
                }
                /* Подпись ищем по тексту, а не по положению: разметка у
                   трёх языков одна, а слова разные. */
                const метки = Array.from(document.querySelectorAll('.auth-label'))
                    .filter(э => (э.textContent || '').indexOf(метка) !== -1);
                return {
                    состояние,
                    меток: метки.length,
                    звёздочек: метки.reduce((с, э) => с + э.querySelectorAll('.auth-required').length, 0),
                    деньМожноОставитьПустым: (() => {
                        const э = document.getElementById('tg-birth-day');
                        return э ? э.checkValidity() : null;
                    })()
                };
            }, с.метка);

            expect(снимок.меток, 'подпись «дата рождения» на странице одна').toBe(1);
            expect(снимок.звёздочек, 'звёздочки у даты рождения нет').toBe(0);
            expect(снимок.состояние['tg-birth-day'].required, 'день не required').toBe(false);
            expect(снимок.состояние['tg-birth-month'].required, 'месяц не required').toBe(false);
            expect(снимок.деньМожноОставитьПустым,
                'пустое поле проходит проверку браузера — форма отправится').toBe(true);

            /* ПАРНОЕ ПРАВИЛО: года в разметке нет. Появится — тест
               упадёт, и защищённое чтение можно будет снять осознанно. */
            expect(снимок.состояние['tg-birth-year'].есть,
                'элемента года в разметке нет — именно из-за него падало').toBe(false);

            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('в коде, который отдаёт страница, нет незащищённого чтения года', async ({ page }) => {
        await page.goto(СТРАНИЦЫ[0].адрес, { waitUntil: 'domcontentloaded' });
        const найдено = await page.evaluate(async () => {
            /* Берём ИМЕННО ТОТ адрес, который стоит в разметке, вместе с
               версией: сторож читает файл в репозитории, а здесь —
               то, что страница действительно грузит. */
            const тег = Array.from(document.querySelectorAll('script[src]'))
                .map(э => э.getAttribute('src'))
                .filter(с => /(^|\/)auth\.js\?/.test(с))[0];
            if (!тег) return { беда: 'тега auth.js на странице нет' };
            const т = await (await fetch(тег)).text();
            const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
            return {
                адрес: тег,
                незащищённых: (безКом.match(/getElementById\('tg-birth-year'\)\s*\.\s*value/g) || []).length,
                защищённыхЧтений: (безКом.match(/поле\('tg-birth-year'\)/g) || []).length
            };
        });
        expect(найдено.беда).toBeUndefined();
        expect(найдено.незащищённых, 'незащищённого чтения не осталось').toBe(0);
        expect(найдено.защищённыхЧтений, 'год читается через защищённое поле').toBeGreaterThan(0);
    });

    test.describe('кабинет', () => {
        test.use({ storageState: require('../../auth-setup').playerState });

        test('у даты рождения в профиле нет звёздочки, у ФИО и пола — есть', async ({ page }) => {
            const ошибки = [];
            page.on('pageerror', e => ошибки.push(String(e.message || e)));
            await page.goto('/pages/dashboard.html#profile', { waitUntil: 'domcontentloaded' });
            await page.locator('#profileBirthDay').waitFor({ state: 'attached', timeout: 20000 });

            const снимок = await page.evaluate(() => {
                const поле = (id) => {
                    const э = document.getElementById(id);
                    const обёртка = э ? э.closest('.db-field') : null;
                    const метка = обёртка ? обёртка.querySelector('.db-field-label') : null;
                    return {
                        есть: !!э,
                        звёздочек: метка ? метка.querySelectorAll('.db-required').length : null,
                        required: э ? !!э.required : null
                    };
                };
                return {
                    дата: поле('profileBirthDay'),
                    год: поле('profileBirthYear'),
                    имя: поле('profileFullName'),
                    пол: поле('profileGender')
                };
            });

            expect(снимок.дата.есть, 'поле даты осталось — его не выбрасывали').toBe(true);
            expect(снимок.дата.звёздочек, 'у даты звёздочки нет').toBe(0);
            expect(снимок.дата.required, 'и required тоже нет').toBe(false);
            expect(снимок.год.required, 'у года required нет').toBe(false);

            /* ЗВЁЗДОЧКА ОСТАЛАСЬ ТАМ, ГДЕ ОБЯЗАТЕЛЬНОСТЬ НАСТОЯЩАЯ:
               ФИО и пол спрашивает и `isProfileComplete`, и проверка
               перед подачей заявки. Иначе тест доказывал бы, что я снял
               все звёздочки подряд. */
            expect(снимок.пол.звёздочек, 'у пола звёздочка на месте').toBeGreaterThan(0);

            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    });
});
