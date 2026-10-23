/**
 * КУСОК 137 — ВЫБОР ЯЗЫКА ДЕЛАЕТСЯ ОДНИМ ЗОВОМ.
 *
 * Сторож читает файлы: что троек не осталось, что у каждого зова три
 * довода, что суффикс считается в одном месте. Эта проба читает ЭКРАН:
 * что на живой странице выбор отвечает ТЕМ ЖЕ языком, который объявлен,
 * и что собранные из суффикса адреса ведут на существующие страницы.
 *
 * ПОЧЕМУ АДРЕСА ПРОВЕРЯЮТСЯ ЗАПРОСОМ, А НЕ ГЛАЗАМИ: суффикс участвует в
 * именах файлов (`player-kg.html`). Ошибка в нём не видна на странице
 * вовсе — она видна только тому, кто нажал ссылку и получил 404.
 *
 * ПРИЗНАК, А НЕ ТИШИНА СЕТИ: ждём видимый `header`, а дом спрашиваем у
 * окна. Фиксированное ожидание читает не то, что загружено, а то, что
 * успело: замер 23.10 через iframe с паузой 4 с сказал «дома нет» на
 * двух страницах из трёх — на самом деле дом был, опрос это показал.
 */
const { test, expect } = require('@playwright/test');

const ЯЗЫКИ = [
    ['русская',    '',    'ru', 'ru', ''],
    ['английская', '-en', 'en', 'en', '-en'],
    ['кыргызская', '-kg', 'kg', 'ky', '-kg']
];

test.describe('выбор языка одним зовом', () => {

    for (const [имя, суф, код, lang, ждёмСуффикс] of ЯЗЫКИ) {

        test(имя + ' главная: суффикс страницы берётся у дома', async ({ page }) => {
            await page.goto('/index' + суф + '.html');
            await page.waitForSelector('header', { timeout: 15000 });

            const м = await page.evaluate(() => ({
                объявлен: document.documentElement.getAttribute('lang'),
                код: window.KSLT_YAZYK && window.KSLT_YAZYK.код,
                суффикс: window.KSLT_YAZYK && window.KSLT_YAZYK.суффикс,
                тип: window.KSLT_YAZYK && typeof window.KSLT_YAZYK.суффикс
            }));

            expect(м.объявлен, 'из разметки пропал <html lang>').toBe(lang);
            expect(м.код, 'дом ответил не тем языком, который объявлен').toBe(код);
            expect(м.тип, 'суффикс обязан быть строкой, а не undefined').toBe('string');
            expect(м.суффикс, 'суффикс страницы не совпал с её языком').toBe(ждёмСуффикс);
        });

        test(имя + ' страница: адреса, собранные из суффикса, существуют', async ({ page }) => {
            await page.goto('/pages/courts' + суф + '.html');
            await page.waitForSelector('header', { timeout: 15000 });

            /* Собираем те же имена, что собирает продукт: страница игрока,
               турнира, входа и кабинета. 404 здесь означает, что суффикс
               приклеился не к тому имени. */
            const ответы = await page.evaluate(async () => {
                const с = window.KSLT_YAZYK.суффикс;
                const имена = ['player', 'tournament', 'auth', 'dashboard', 'news'];
                const из = {};
                for (const и of имена) {
                    const адрес = '/pages/' + и + с + '.html';
                    try {
                        const о = await fetch(адрес, { method: 'HEAD' });
                        из[и] = о.status;
                    } catch (e) { из[и] = 0; }
                }
                return из;
            });

            for (const [и, статус] of Object.entries(ответы)) {
                expect(статус, 'адрес `' + и + '` с суффиксом не отдал страницу').toBe(200);
            }
        });

        test(имя + ' страница матча: словарь эфира отвечает языком дома', async ({ page }) => {
            await page.goto('/pages/live-match' + суф + '.html');
            await page.waitForSelector('header', { timeout: 15000 });

            const м = await page.evaluate(() => ({
                дом: window.KSLT_YAZYK && window.KSLT_YAZYK.код,
                эфир: window.KSLTLiveTexts && window.KSLTLiveTexts.язык(),
                пауза: window.KSLTLiveTexts && window.KSLTLiveTexts.слово('paused'),
                неизвестное: window.KSLTLiveTexts && window.KSLTLiveTexts.слово('такого-кода-нет')
            }));

            expect(м.эфир, 'словарь эфира считает язык сам, а не спрашивает дом').toBe(м.дом);
            expect((м.пауза || '').length > 0, 'слово «пауза» пропало из словаря эфира').toBe(true);
            /* Неизвестный код отдаёт ПУСТО, а не сам код: зритель не должен
               читать `set_break`. Это поведение держалось тернарником. */
            expect(м.неизвестное, 'неизвестный код словаря больше не отдаёт пусто').toBe('');
        });
    }

    test('три языка — три разных ответа выбора, а не три одинаковых', async ({ page }) => {
        const ответы = [];
        for (const [, суф] of ЯЗЫКИ.map(я => [я[0], я[1]])) {
            await page.goto('/index' + суф + '.html');
            await page.waitForSelector('header', { timeout: 15000 });
            ответы.push(await page.evaluate(() => ({
                выбор: window.KSLT_YAZYK.выбрать('EN', 'KG', 'RU'),
                суффикс: window.KSLT_YAZYK.суффикс
            })));
        }
        expect(new Set(ответы.map(о => о.выбор)).size,
            'выбор по языку вернул одно и то же на трёх языках — дом сломан').toBe(3);
        expect(new Set(ответы.map(о => о.суффикс)).size,
            'суффикс одинаков на трёх языках — страницы пойдут на один язык').toBe(3);
    });

    test('страница выхода собирается из суффикса, а не из адреса', async ({ page }) => {
        /* КНОПКУ ВЫХОДА НЕ НАЖИМАЕМ — она трогает сессию. Проверяем, что
           имя страницы входа, собранное из суффикса, существует: именно
           это имя `session-monitor.js` строит при выходе, и до 23.10 он
           считал суффикс сам, читая адрес. */
        await page.goto('/pages/dashboard-kg.html');
        const адрес = await page.evaluate(async () => {
            const с = (window.KSLT_YAZYK && window.KSLT_YAZYK.суффикс);
            if (с === undefined || с === null) return { суффикс: null };
            const имя = 'auth' + с + '.html';
            const о = await fetch('/pages/' + имя, { method: 'HEAD' });
            return { суффикс: с, имя: имя, статус: о.status };
        });
        /* Кабинет может увести гостя на вход — тогда суффикс мы читаем уже
           на странице входа, и он всё равно обязан быть кыргызским. */
        expect(адрес.суффикс, 'суффикс на кыргызской странице не кыргызский').toBe('-kg');
        expect(адрес.статус, 'страница входа с кыргызским суффиксом не отдалась').toBe(200);
    });
});
