/**
 * КУСОК 147 — ПО ЯЗЫКАМ, А НЕ ВПЕРЕМЕШКУ.
 *
 * Сторож читает файлы и видит, что локаль одна и `ky-KG` в коде нет. Эта
 * проба читает ЭКРАН: что на кыргызских страницах не осталось английских
 * месяцев, а на английских они на месте.
 *
 * ПОЧЕМУ КЫРГЫЗУ РУССКАЯ РАСКЛАДКА: локали `ky-KG` в браузере НЕТ
 * (`supportedLocalesOf` отдаёт пусто, локаль разрешается в `en-US`), а
 * кусок 138 замерил, что сокращения месяцев и порядок даты в кыргызском
 * те же, что в русском. Поэтому «15 окт.», а не «Oct 15».
 */
const { test, expect } = require('@playwright/test');

const МЕСЯЦЫ_АНГЛ = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/;

const СТРАНИЦЫ = [
    ['новости',  '/pages/news-kg.html',        '/pages/news-en.html'],
    ['турниры',  '/pages/tournaments-kg.html', '/pages/tournaments-en.html']
];

test.describe('по языкам, а не вперемешку', () => {

    test('дом языка отдаёт локаль, и кыргызу — русскую раскладку', async ({ page }) => {
        for (const [яз, ожидаемая] of [['', 'ru-RU'], ['-en', 'en-US'], ['-kg', 'ru-RU']]) {
            await page.goto('/pages/news' + яз + '.html');
            await page.waitForFunction(() => !!window.KSLT_YAZYK, null, { timeout: 15000 });
            const м = await page.evaluate(() => ({
                код: window.KSLT_YAZYK.код,
                локаль: window.KSLT_YAZYK.локаль,
                поддержкаКыргызской: Intl.DateTimeFormat.supportedLocalesOf(['ky-KG', 'ky']).length,
                дата: new Date('2026-10-15T06:00:00Z')
                    .toLocaleDateString(window.KSLT_YAZYK.локаль, { day: 'numeric', month: 'short' })
            }));
            expect(м.локаль, 'локаль страницы ' + (яз || 'ru') + ' не та').toBe(ожидаемая);
            expect(м.поддержкаКыргызской,
                'кыргызская локаль в браузере появилась — перемерь решение куска 147').toBe(0);
            if (ожидаемая === 'ru-RU') {
                expect(м.дата, 'русская раскладка дала не русский месяц').toMatch(/окт/);
            } else {
                expect(м.дата, 'английская раскладка дала не английский месяц').toMatch(/Oct/);
            }
        }
    });

    for (const [имя, кг, ан] of СТРАНИЦЫ) {

        test(имя + ': на кыргызской странице английских месяцев нет', async ({ page }) => {
            await page.goto(кг);
            await page.waitForFunction(() => !!window.KSLT_YAZYK, null, { timeout: 15000 });
            /* ДАННЫЕ ПРИХОДЯТ ИЗ БАЗЫ: ждём не тишины сети, а признака —
               появления хотя бы одной даты на экране. */
            await page.waitForFunction(() =>
                /\d/.test(document.body.textContent) && document.body.textContent.length > 500,
                null, { timeout: 15000 });
            await page.waitForTimeout(1200);

            /* СМОТРИМ ТОЛЬКО ТУДА, ГДЕ ДАТА, А НЕ ВО ВЕСЬ ТЕКСТ. Название
               турнира или статьи может законно содержать «May» — и проба
               упала бы по делу своего незнания, как это уже было с
               появлением карточек на телефоне боком. */
            const найдено = await page.evaluate(м => {
                const рег = new RegExp(м, 'g');
                const узлы = document.querySelectorAll(
                    '[class*="date"], [class*="dates"], [class*="meta"], [class*="expires"]');
                const из = [];
                узлы.forEach(у => {
                    const совпало = (у.textContent.match(рег) || []);
                    совпало.forEach(с => из.push(с + ' в .' + у.className.split(' ')[0]));
                });
                return из.slice(0, 5);
            }, МЕСЯЦЫ_АНГЛ.source);

            expect(найдено, 'на кыргызской странице английские месяцы: ' + найдено.join(', '))
                .toEqual([]);
        });

        test(имя + ': на английской странице месяцы английские', async ({ page }) => {
            await page.goto(ан);
            await page.waitForFunction(() => !!window.KSLT_YAZYK, null, { timeout: 15000 });
            await page.waitForFunction(() =>
                /\d/.test(document.body.textContent) && document.body.textContent.length > 500,
                null, { timeout: 15000 });
            await page.waitForTimeout(1200);

            const м = await page.evaluate(() => {
                const узлы = document.querySelectorAll(
                    '[class*="date"], [class*="dates"], [class*="meta"], [class*="expires"]');
                const из = [];
                узлы.forEach(у => {
                    const с = у.textContent.match(/(янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)/g);
                    if (с) с.forEach(x => из.push(x));
                });
                return { локаль: window.KSLT_YAZYK.локаль, русскиеМесяцы: из.slice(0, 5) };
            });

            expect(м.локаль, 'английская страница взяла не английскую локаль').toBe('en-US');
            expect(м.русскиеМесяцы, 'на английской странице русские месяцы: ' +
                м.русскиеМесяцы.join(', ')).toEqual([]);
        });
    }
});
