// @ts-check
/* ОБВЯЗКА, А НЕ ГОЛЫЙ PLAYWRIGHT: `tests/fixtures.js` подставляет адрес
   ТЕСТОВОЙ базы в `window.KSLT_DB` до загрузки страницы. Без неё страница
   уходит в боевую базу, а сессия заведена в тестовой. */
const { test, expect } = require('../../fixtures');

/**
 * ОТКУДА ПРИЕХАЛ ЧЕЛОВЕК В КЛЕТКЕ — ОДИНАКОВО У МЕНЕДЖЕРА И У ЗРИТЕЛЯ.
 *
 * Просьба Кости, сказанная трижды: «в админке показывается, кто с какой
 * группы выходит куда, а на публичной нет — может, также отрисовать её с
 * G1 F1».
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файлы как текст: они держат, что
 * карта меток одна и что ручные места применяются общей функцией. Но
 * СОВПАДАЮТ ЛИ ДВЕ МЕТКИ НА ДВУХ ЭКРАНАХ, может сказать только прогон.
 * Ровно так же 02.10 расходилось место в рейтинге: одно правило, два
 * входа, и шов ровно между ними.
 *
 * Данные — `test-metka` из `tests/seed.js`: две группы по трое, все шесть
 * матчей сыграны, порядок однозначен (ни одного жребия), финал НЕ сыгран.
 * Первые места групп — `mr-alpha` (A1) и `mr-delta` (B1), они и стоят в
 * финале.
 */

const ТУРНИР = 'test-metka';
const ТУРНИР_СЛОТЫ = 'test-sloty';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

/** Имя игрока → метка, снятая с публичной сетки. */
async function меткиНаСайте(page) {
    await page.goto('/pages/tournament.html?id=' + ТУРНИР + '&tab=bracket');

    const виден = await page.waitForFunction(
        () => document.querySelectorAll('.td-match-player').length > 0,
        null, { timeout: 20000 }).then(() => true).catch(() => false);

    if (!виден) {
        /* ПРИБОР НАЗЫВАЕТ ПРИЧИНУ, А НЕ ПРОСТО ПАДАЕТ ПО ТАЙМАУТУ: иначе в
           следе лежит снимок пустой страницы, и причина не названа ничем. */
        const что = await page.evaluate(async (id) => {
            if (!window.supabaseClient) return 'клиента базы на странице нет';
            const т = await window.supabaseClient.from('tournaments')
                .select('id, bracket_type, group_count, qualifiers_per_group').eq('id', id);
            const м = await window.supabaseClient.from('matches')
                .select('id, group_number').eq('tournament_id', id);
            if (т.error) return 'база ответила ошибкой: ' + т.error.message;
            if (!т.data || !т.data.length) return 'турнира нет в базе — прогоните node tests/seed.js';
            return 'турнир есть: ' + JSON.stringify(т.data[0]) +
                ', матчей ' + ((м.data || []).length) +
                ', из них групповых ' + ((м.data || []).filter(x => x.group_number > 0).length);
        }, ТУРНИР);
        throw new Error('на публичной странице ' + ТУРНИР + ' нет клеток сетки. ' + что);
    }

    return await page.evaluate(() => {
        const карта = {};
        document.querySelectorAll('.td-match-player').forEach(row => {
            const и = row.querySelector('.td-player-name');
            const м = row.querySelector('.td-grp-label');
            if (!и) return;
            const имя = и.textContent.replace(/\s+/g, ' ').trim();
            if (!имя || имя === 'BYE') return;
            карта[имя] = м ? м.textContent.trim() : null;
        });
        return карта;
    });
}

/** Имя игрока → метка, снятая с сетки в админке. */
async function меткиВАдминке(page) {
    await page.goto('/pages/admin.html#tournaments/bracket/' + ТУРНИР);

    const открылся = await page.waitForSelector('.ad-brk-grp-label', { timeout: 20000 })
        .then(() => true).catch(() => false);
    if (!открылся) {
        const что = await page.evaluate(async (id) => {
            if (!window.supabaseClient) return 'клиента базы на странице нет';
            const т = await window.supabaseClient.from('tournaments')
                .select('id, bracket_type, group_count').eq('id', id);
            if (т.error) return 'база ответила ошибкой: ' + т.error.message;
            if (!т.data || !т.data.length) return 'турнира нет в базе вовсе';
            return 'турнир есть: ' + JSON.stringify(т.data[0]);
        }, ТУРНИР);
        throw new Error('в админке ' + ТУРНИР + ' не показал ни одной метки группы. ' + что);
    }

    return await page.evaluate(() => {
        const карта = {};
        document.querySelectorAll('.ad-brk-player').forEach(row => {
            const и = row.querySelector('.ad-brk-name');
            const м = row.querySelector('.ad-brk-grp-label');
            if (!и) return;
            const имя = и.textContent.replace(/\s+/g, ' ').trim();
            if (!имя || имя === 'BYE') return;
            const текст = м ? м.textContent.trim() : '';
            карта[имя] = текст || null;
        });
        return карта;
    });
}

test.describe('Пустая клетка говорит, кого ждёт', () => {

    test('на публичной сетке стоят метки слотов, а не подряд TBD',
        async ({ page }) => {
            await page.goto('/pages/tournament.html?id=' + ТУРНИР_СЛОТЫ + '&tab=bracket');

            const виден = await page.waitForFunction(
                () => document.querySelectorAll('.td-match-player').length > 0,
                null, { timeout: 20000 }).then(() => true).catch(() => false);

            if (!виден) {
                const что = await page.evaluate(async (id) => {
                    if (!window.supabaseClient) return 'клиента базы на странице нет';
                    const м = await window.supabaseClient.from('matches')
                        .select('match_order, slot1_label, slot2_label').eq('tournament_id', id);
                    if (м.error) return 'база ответила ошибкой: ' + м.error.message;
                    if (!м.data || !м.data.length) return 'матчей нет — прогоните node tests/seed.js';
                    return 'матчей ' + м.data.length + ': ' + JSON.stringify(м.data);
                }, ТУРНИР_СЛОТЫ);
                throw new Error('на публичной странице ' + ТУРНИР_СЛОТЫ +
                    ' нет клеток сетки. ' + что);
            }

            const слоты = await page.evaluate(() =>
                [...document.querySelectorAll('.td-slot-wait')].map(э => э.textContent.trim()));

            /* ПРОВЕРКА, КОТОРАЯ НЕ МОЖЕТ УПАСТЬ, НИЧЕГО НЕ ДОКАЗЫВАЕТ:
               сперва порог, потом разбор. */
            expect(слоты.length, 'меток слотов на сетке нет — зритель снова видит подряд TBD')
                .toBeGreaterThanOrEqual(4);
            expect(слоты.sort()).toEqual(['A1', 'B1', 'IG1', 'Q1']);
        });

    test('метка слота читается иначе, чем фамилия',
        async ({ page }, testInfo) => {
            await page.goto('/pages/tournament.html?id=' + ТУРНИР_СЛОТЫ + '&tab=bracket');
            await page.waitForSelector('.td-slot-wait', { timeout: 20000 });

            /* Снимок — для шага «твои глаза»: открыть страницу руками
               нельзя, адрес базы подставляет обвязка. */
            const сетка = page.locator('.td-bracket').first();
            if (await сетка.count()) {
                await сетка.screenshot({
                    path: 'tests/reports/sloty-' + testInfo.project.name + '.png'
                });
            }

            const вид = await page.evaluate(() => {
                const э = document.querySelector('.td-slot-wait');
                const с = getComputedStyle(э);
                return { вес: с.fontWeight, цвет: с.color, ширина: э.getBoundingClientRect().width };
            });

            expect(Number(вид.вес), 'метка слота потеряла вес и читается как фамилия')
                .toBeGreaterThanOrEqual(600);
            expect(вид.ширина, 'метка слота схлопнулась').toBeGreaterThan(0);
        });
});

test.describe('Метка группы на публичной сетке', () => {

    test.use({ storageState: require('../../auth-setup').adminState });

    test('у вышедших из групп метка стоит, и это буква со списком без I и Q',
        async ({ page }) => {
            const метки = await меткиНаСайте(page);

            const сМетками = Object.keys(метки).filter(и => метки[и]);
            /* ПРОВЕРКА, КОТОРАЯ НЕ МОЖЕТ УПАСТЬ, НИЧЕГО НЕ ДОКАЗЫВАЕТ.
               Пустой список нарушений пуст и тогда, когда ни одного
               игрока не нашли. Поэтому сначала порог. */
            expect(сМетками.length,
                'на публичной сетке нет ни одной метки — проверять было нечего')
                .toBeGreaterThanOrEqual(2);

            сМетками.forEach(и => {
                expect(метки[и], и + ': метка не похожа на букву с местом')
                    .toMatch(/^[A-HJ-PR-Z]\d+$/);
            });
        });

    test('метка у зрителя и метка у менеджера — одна и та же',
        async ({ page }, testInfo) => {
            test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
                'админка — десктоп и планшет, телефонной раскладки в ней нет');

            const сайт = await меткиНаСайте(page);
            const админка = await меткиВАдминке(page);

            const сверено = [];
            const расхождения = [];
            Object.keys(сайт).forEach(имя => {
                if (админка[имя] === undefined) return;
                сверено.push(имя);
                if (сайт[имя] !== админка[имя]) {
                    расхождения.push(имя + ': на сайте ' + сайт[имя] +
                        ', в админке ' + админка[имя]);
                }
            });

            expect(сверено.length,
                'ни одного игрока не нашлось на обоих экранах — сверять было не с чем')
                .toBeGreaterThanOrEqual(2);
            expect(расхождения, 'метка группы разошлась между сайтом и админкой')
                .toEqual([]);
        });

    test('плашка метки не схлопывается и держит одну ширину',
        async ({ page }, testInfo) => {
            await меткиНаСайте(page);

            /* ШАГ «ТВОИ ГЛАЗА» ТРЕБУЕТ КАРТИНКИ, А НЕ ЧИСЕЛ. Открыть
               страницу руками нельзя: адрес базы подставляет обвязка, и в
               обычном браузере она уйдёт в боевую, где этого турнира нет.
               Поэтому снимок кладёт сам прогон — по файлу на вид. */
            const сетка = page.locator('.td-bracket').first();
            if (await сетка.count()) {
                await сетка.screenshot({
                    path: 'tests/reports/metka-' + testInfo.project.name + '.png'
                });
            }

            const размеры = await page.evaluate(() => {
                return [...document.querySelectorAll('.td-grp-label')].map(э => {
                    const к = э.getBoundingClientRect();
                    return { текст: э.textContent.trim(), ширина: Math.round(к.width) };
                });
            });

            expect(размеры.length, 'плашек метки на странице нет').toBeGreaterThanOrEqual(2);
            размеры.forEach(р => {
                expect(р.ширина, 'плашка ' + р.текст + ' схлопнулась').toBeGreaterThan(0);
            });
            const разные = [...new Set(размеры.map(р => р.ширина))];
            expect(разные.length,
                'плашки разной ширины: ' + разные.join(', ') +
                ' — имена в соседних клетках встанут разными левыми краями')
                .toBe(1);
        });
});
