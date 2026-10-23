/**
 * КУСОК 133 — ЯЗЫК СТРАНИЦЫ ОПРЕДЕЛЯЕТСЯ ОДИН РАЗ.
 *
 * Сторож читает файлы. Эта проба читает ЭКРАН: что дом есть на живой
 * странице, что он отвечает тем же языком, который объявлен в разметке,
 * и что выбранное по языку содержимое осталось на своём языке.
 *
 * `waitForSelector` ЖДЁТ ВИДИМОСТИ, А НЕ ПОЯВЛЕНИЯ (кусок 132): здесь
 * ничего в `<head>` не ждём, но ожидания признаков держим на видимых
 * узлах, а наличие дома спрашиваем у окна, а не у разметки.
 *
 * ТРИ ЯЗЫКА — ЭТО ТРИ РАЗНЫХ ОТВЕТА, А НЕ ТРИ ОДИНАКОВЫХ. Проба
 * проверяет, что код языка РАЗНЫЙ на трёх страницах: правило, у которого
 * все три ответа совпали бы, не заметило бы сломанного дома, молча
 * отдающего русский.
 */
const { test, expect } = require('@playwright/test');

const ЯЗЫКИ = [
    ['русская',    '/index.html',    'ru', 'ru'],
    ['английская', '/index-en.html', 'en', 'en'],
    ['кыргызская', '/index-kg.html', 'kg', 'ky']
];

test.describe('язык страницы', () => {

    for (const [имя, адрес, код, lang] of ЯЗЫКИ) {

        test(имя + ' главная: дом есть и отвечает объявленным языком', async ({ page }) => {
            await page.goto(адрес);
            await page.waitForSelector('header', { timeout: 15000 });

            const м = await page.evaluate(() => ({
                объявлен: document.documentElement.getAttribute('lang'),
                домЕсть: typeof window.KSLT_YAZYK === 'object' && window.KSLT_YAZYK !== null,
                код: window.KSLT_YAZYK && window.KSLT_YAZYK.код,
                ru: window.KSLT_YAZYK && window.KSLT_YAZYK.ru,
                en: window.KSLT_YAZYK && window.KSLT_YAZYK.en,
                kg: window.KSLT_YAZYK && window.KSLT_YAZYK.kg,
                выбраноДомом: window.KSLT_YAZYK && window.KSLT_YAZYK.выбрать('EN', 'KG', 'RU')
            }));

            expect(м.домЕсть, 'дома языка нет на странице — он подключён позже или не подключён').toBe(true);
            expect(м.объявлен, 'из разметки пропал <html lang> — дом молча отдаст русский').toBe(lang);
            expect(м.код, 'дом ответил не тем языком, который объявлен').toBe(код);

            /* РОВНО ОДИН ФЛАГ ИСТИНЕН. Два истинных означают, что страница
               считается сразу двумя языками, и выбор пойдёт по первому. */
            expect([м.ru, м.en, м.kg].filter(Boolean).length,
                'истинен не ровно один языковой флаг').toBe(1);
            expect(м.выбраноДомом, 'выбор по языку вернул не тот довод').toBe(код.toUpperCase());
        });
    }

    test('ky в разметке и kg в коде — это один язык', async ({ page }) => {
        await page.goto('/index-kg.html');
        await page.waitForSelector('header', { timeout: 15000 });
        const м = await page.evaluate(() => ({
            вРазметке: document.documentElement.getAttribute('lang'),
            вКоде: window.KSLT_YAZYK.код,
            флаг: window.KSLT_YAZYK.kg
        }));
        /* В разметке `ky` — код ЯЗЫКА по ISO 639-1; в путях и в коде `kg` —
           код СТРАНЫ. Дом мирит их; разъедутся — кыргызская страница
           перестанет узнаваться, и 1157 тернарников отдадут русский. */
        expect(м.вРазметке, 'в разметке кыргызский должен быть ky').toBe('ky');
        expect(м.вКоде, 'в коде кыргызский должен оставаться kg').toBe('kg');
        expect(м.флаг, 'кыргызская страница перестала узнаваться').toBe(true);
    });

    test('содержимое, выбранное по языку, осталось на своём языке', async ({ page }) => {
        /* Ссылка «Все турниры» в ленте главной собиралась тройным
           тернарником и переписана на один зов дома. Видна она только в
           ленте — на узких видах; на широких ту же роль играет ссылка в
           шапке раздела, поэтому проверяем САМ ТЕКСТ, а не его видимость. */
        const ждём = { '/index.html': 'Все турниры',
                       '/index-en.html': 'All tournaments',
                       '/index-kg.html': 'Бардык мелдештер' };
        for (const адрес of Object.keys(ждём)) {
            await page.goto(адрес);
            await page.waitForSelector('a.tc-more', { state: 'attached', timeout: 20000 });
            const текст = await page.evaluate(() =>
                (document.querySelector('a.tc-more') || {}).textContent.replace(/\s+/g, ' ').trim());
            expect(текст, 'ссылка «все турниры» заговорила не на своём языке: ' + адрес)
                .toContain(ждём[адрес]);
        }
    });

    test('три языка дают ТРИ РАЗНЫХ ответа, а не один', async ({ page }) => {
        const коды = [];
        for (const [, адрес] of ЯЗЫКИ.map(я => [я[0], я[1]])) {
            await page.goto(адрес);
            await page.waitForSelector('header', { timeout: 15000 });
            коды.push(await page.evaluate(() => window.KSLT_YAZYK.код));
        }
        /* ПРАВИЛО, У КОТОРОГО ВСЕ ОТВЕТЫ СОВПАЛИ, НИЧЕГО НЕ ДОКАЗЫВАЕТ:
           сломанный дом, отдающий всем русский, прошёл бы каждую проверку
           по отдельности. */
        expect(new Set(коды).size, 'дом отдал одинаковый язык разным страницам: ' + коды.join(', ')).toBe(3);
    });

});
