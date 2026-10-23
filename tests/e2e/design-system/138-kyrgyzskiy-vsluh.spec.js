/**
 * КУСОК 138 — КЫРГЫЗСКИЙ НАЗЫВАЕТСЯ ВСЛУХ, А НЕ ПАДАЕТ В РУССКИЙ.
 *
 * Сторож читает файлы и видит, что выбор назвал три языка. Эта проба
 * читает ЭКРАН: что на кыргызской странице НЕТ русских слов там, где
 * перевод есть, и что собранные из суффикса адреса ведут на кыргызские
 * страницы, а не на русские.
 *
 * РУССКОЕ СЛОВО НА КЫРГЫЗСКОЙ СТРАНИЦЕ — НЕ ВСЕГДА БЕДА: имя человека,
 * «сет», «гейм», «сом», «Плей-офф» в кыргызском те же. Поэтому проба
 * ищет не кириллицу вообще, а СПИСОК СЛОВ, у которых перевод ЕСТЬ в
 * продукте: их появление означает, что ветвь выбрана не та.
 *
 * ПРОБА ЖДЁТ ПРИЗНАК — сам дом языка: он есть на всех видах, потому что
 * это скрипт, а не вёрстка.
 */
const { test, expect } = require('@playwright/test');

/* Слова, у которых в продукте есть кыргызский перевод. Увидели их на
   кыргызской странице — значит выбор отдал русскую ветвь. */
const РУССКИЕ = ['Сохранить', 'Войти', 'Пароль', 'Загрузка', 'Тренеры',
                 'одиночка', 'Достижения', 'Членство', 'Профиль не найден'];

const СТРАНИЦЫ = ['/pages/auth', '/pages/coaches', '/pages/courts',
                  '/pages/tournaments', '/pages/players'];

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_YAZYK, null, { timeout: 15000 });
}

test.describe('кыргызский называется вслух', () => {

    for (const имя of СТРАНИЦЫ) {
        test('кыргызская ' + имя + ': русских слов с переводом на экране нет', async ({ page }) => {
            await page.goto(имя + '-kg.html');
            await дом(page);
            await page.waitForSelector('body', { timeout: 15000 });

            const м = await page.evaluate(списокРусских => {
                const т = document.body.innerText || '';
                return {
                    код: window.KSLT_YAZYK.код,
                    суффикс: window.KSLT_YAZYK.суффикс,
                    нашлись: списокРусских.filter(с => т.indexOf(с) !== -1),
                    длина: т.length
                };
            }, РУССКИЕ);

            expect(м.код, 'дом ответил не кыргызским на кыргызской странице').toBe('kg');
            expect(м.суффикс, 'суффикс не кыргызский').toBe('-kg');
            expect(м.длина > 200, 'страница почти пуста — мерить нечего').toBe(true);
            expect(м.нашлись, 'на кыргызской странице русские слова, у которых перевод есть').toEqual([]);
        });
    }

    test('подписи NTRP на кыргызской странице кыргызские', async ({ page }) => {
        await page.goto('/pages/coaches-kg.html');
        await дом(page);
        const м = await page.evaluate(() => {
            const R = window.KSLT_RULES;
            return R && R.ntrpСтрока ? {
                kg: R.ntrpСтрока(4.5, 4.0, 'kg'),
                ru: R.ntrpСтрока(4.5, 4.0, 'ru'),
                en: R.ntrpСтрока(4.5, 4.0, 'en')
            } : null;
        });
        expect(м, 'правил NTRP нет на странице').not.toBeNull();
        expect(м.kg, 'кыргызская подпись NTRP не кыргызская').toContain('жекече');
        expect(м.kg).toContain('жуптук');
        /* ТРИ ЯЗЫКА — ТРИ РАЗНЫХ ОТВЕТА: совпадение означает, что одна из
           ветвей молча отдаёт чужую речь. */
        expect(new Set([м.kg, м.ru, м.en]).size, 'подписи NTRP совпали на разных языках').toBe(3);
    });

    test('код локали на кыргызской странице кыргызский', async ({ page }) => {
        await page.goto('/pages/courts-kg.html');
        await дом(page);
        const локаль = await page.evaluate(() => KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU'));
        expect(локаль, 'кыргызская страница просит русскую локаль').toBe('ky-KG');
    });

    test('адреса кабинета и цен с кыргызской страницы кыргызские', async ({ page }) => {
        await page.goto('/pages/courts-kg.html');
        await дом(page);
        const ответы = await page.evaluate(async () => {
            const с = KSLT_YAZYK.суффикс;
            const из = {};
            for (const и of ['dashboard', 'pricing', 'auth']) {
                const о = await fetch('/pages/' + и + с + '.html', { method: 'HEAD' });
                из[и + с] = о.status;
            }
            return из;
        });
        for (const [имя, статус] of Object.entries(ответы)) {
            expect(статус, 'адрес `' + имя + '` не отдал страницу').toBe(200);
        }
    });
});
