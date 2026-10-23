/**
 * КУСОК 146 — ТРЕТЬЯ КОПИЯ ВАУЧЕРА (КАБИНЕТ) И ЛОКАЛЬ, КОТОРОЙ НЕТ.
 *
 * Окно ваучера в кабинете осталось СВОИМ ПО ВИДУ намеренно (узкое окно с
 * размытием, крупный процент сверху, без строк деталей) — сведение вида
 * это правка на глаз, а не правка копии. Сведены четыре понятия, которые
 * были третьей копией знак в знак: адрес проверки, формат срока,
 * рисование QR и скачивание карточки.
 *
 * ГЛАВНОЕ, ЧТО ЭТА ПРОБА ДЕРЖИТ, — ЛОКАЛЬ. Замерено в браузере:
 * `Intl.DateTimeFormat.supportedLocalesOf(['ky-KG','ky'])` отдаёт ПУСТО,
 * и `ky-KG` разрешается в `en-US`. То есть на кыргызской странице дата
 * печаталась ПО-АНГЛИЙСКИ. Кусок 138 замерил обратное и записал
 * решением: сокращения месяцев и порядок даты в кыргызском ТЕ ЖЕ, ЧТО В
 * РУССКОМ. Значит кыргызскому нужна русская раскладка.
 *
 * Кабинет за входом, поэтому зовы проверяются на стенде ваучерного блока
 * — на настоящем доме, а не на копии.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/stend-vaucher-blok.html?sost=istoriya&pr=co&yaz=';
const ЯЗЫКИ = [
    ['ru', '15 окт.', ''],
    ['en', 'Oct 15', '-en'],
    ['kg', '15 окт.', '-kg']
];

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_VAUCHER_BLOK, null, { timeout: 15000 });
}

test.describe('ваучер в кабинете: дом вместо третьей копии', () => {

    for (const [яз, ожидаемаяДата, суффикс] of ЯЗЫКИ) {

        test('язык ' + яз + ': дата и адрес проверки идут от дома', async ({ page }) => {
            await page.goto(СТЕНД + яз);
            await дом(page);

            const м = await page.evaluate(() => ({
                /* 15 октября 2026, полдень по Бишкеку — день, у которого в
                   русском и кыргызском одно сокращение, а в английском
                   другое: так видно, какая раскладка применилась. */
                дата: window.KSLT_VAUCHER_BLOK.дата('2026-10-15T06:00:00Z'),
                сЧасами: window.KSLT_VAUCHER_BLOK.дата('2026-10-15T06:00:00Z', true),
                пусто: window.KSLT_VAUCHER_BLOK.дата(null),
                адрес: window.KSLT_VAUCHER_BLOK.адресПроверки('abc123'),
                локальКыргызская: Intl.DateTimeFormat.supportedLocalesOf(['ky-KG', 'ky']).length
            }));

            expect(м.дата, 'раскладка даты не та, что решил замер').toBe(ожидаемаяДата);
            expect(м.сЧасами, 'срок без часов').toMatch(/\d{1,2}:\d{2}/);
            expect(м.пусто, 'пустая дата дала не пустую строку').toBe('');
            expect(м.адрес, 'адрес проверки не несёт язык страницы')
                .toContain('/pages/verify' + суффикс + '.html?token=abc123');
            expect(м.локальКыргызская, 'кыргызская локаль в браузере появилась — ' +
                'правило куска 146 держится на её ОТСУТСТВИИ, перемерь').toBe(0);
        });
    }

    test('рисование QR — одно место, и без библиотеки оно говорит', async ({ page }) => {
        await page.goto(СТЕНД + 'ru');
        await дом(page);

        const м = await page.evaluate(async () => {
            const коробка = document.createElement('div');
            document.body.appendChild(коробка);
            const сБиблиотекой = window.KSLT_VAUCHER_BLOK.нарисоватьQR(коробка, 'https://kslt/x');
            const холст = !!коробка.querySelector('canvas');

            /* БЕЗ БИБЛИОТЕКИ: прячем её на время замера и возвращаем. */
            const был = window.QRCode;
            window.QRCode = undefined;
            const вторая = document.createElement('div');
            document.body.appendChild(вторая);
            const безБиблиотеки = window.KSLT_VAUCHER_BLOK.нарисоватьQR(вторая, 'https://kslt/x');
            const надпись = вторая.textContent.trim();
            const инлайн = вторая.innerHTML.indexOf('style=') !== -1;
            window.QRCode = был;

            коробка.remove(); вторая.remove();
            return { сБиблиотекой, холст, безБиблиотеки, надпись, инлайн };
        });

        expect(м.сБиблиотекой, 'дом не сказал, что нарисовал QR').toBe(true);
        expect(м.холст, 'холст QR не появился').toBe(true);
        expect(м.безБиблиотеки, 'дом соврал, что нарисовал QR без библиотеки').toBe(false);
        expect(м.надпись.length, 'без библиотеки коробка осталась пустой МОЛЧА').toBeGreaterThan(10);
        expect(м.инлайн, 'надпись несёт инлайн-стиль').toBe(false);
    });
});
