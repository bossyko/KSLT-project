// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ЛИСТ ПЕЧАТАЕТСЯ ЦЕЛИКОМ, И КАЖДЫЙ ЛИСТ САМ ГОВОРИТ, ЧЕЙ ОН.
 *
 * Кусок 01.10, четыре коммита подряд — и три редакции полосы клуба, две из
 * них мои поломки. Заморозки у печати нет вовсе: правила читают файлы как
 * текст, а печать — это computed styles в режиме `print`, которых в файле
 * не видно. Сказать, что получилось на листе, может только прогон.
 *
 * ПРИЁМ. `window.print` заглушается ДО загрузки страницы, затем жмётся
 * НАСТОЯЩАЯ кнопка «Печать». Вся подготовка листа отрабатывает — шапка,
 * подвал, полоса клуба, класс `ad-printing`, — а `afterprint` не
 * срабатывает, и DOM остаётся в печатном состоянии. Так проверяется путь
 * продукта, а не моя имитация.
 *
 * Виды: печать не зависит от ширины экрана, и телефонной раскладки у
 * админки нет. Гоняем на десктопе и планшете.
 */

/* Турнир с ГРУППАМИ и матчами: у `test-tournament` ни расписания, ни
   групп — прогон 02.10 упал на пороге «проверять нечего», и это
   правильное падение. */
const ТУРНИР = 'test-metka';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

test.describe('Печать протокола', () => {

    test.use({ storageState: require('../../auth-setup').adminState });

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');

        // Заглушка ставится ДО загрузки: кнопка зовёт window.print синхронно
        await page.addInitScript(() => {
            window.__печатьВызвана = false;
            window.print = () => { window.__печатьВызвана = true; };
        });
        /* ПЕЧАТНОЕ МЕДИА ВКЛЮЧАЕТСЯ ПОСЛЕ ЗАГРУЗКИ, А НЕ ДО НЕЁ. Человек
           открывает страницу на экране и только потом жмёт «Печать».
           Включённое заранее, оно меняет отрисовку, и первый прогон 02.10
           не нашёл даже кнопки. */
    });

    /** Открыть турнир, раскрыть нужную вкладку и нажать настоящую кнопку
     *  печати в ней. Панели живут в DOM всегда, но видима только активная:
     *  расписание рисует `.ad-sched-wrap`, группы — `.ad-grp-block` и
     *  `.ad-table-wrap`, и это РАЗНЫЕ панели (`bracket.js:4879` и `:5369`). */
    async function напечатать(page, вкладка) {
        const панель = вкладка === 'schedule' ? '#adBrkSchedulePanel' : '#adBrkBracketPanel';
        await page.goto('/pages/admin.html#tournaments/bracket/' + ТУРНИР);

        /* ВКЛАДКУ НАДО ОТКРЫТЬ. Панели заявок, сетки и расписания лежат в
           DOM всегда, но скрытыми: видима только активная. Прогон 02.10
           искал видимую кнопку и не находил ни одной — при том что на
           странице их ТРИ, и диагноз это назвал. Печатаем расписание: ради
           него кусок и делался. */
        await page.waitForSelector('[data-trn-nav="' + вкладка + '"]', { timeout: 20000 })
            .catch(() => null);
        await page.locator('[data-trn-nav="' + вкладка + '"]').first().click().catch(() => null);

        const естьКнопка = await page
            .waitForSelector(панель + ' .ad-export-print', { timeout: 20000 })
            .then(() => true).catch(() => false);
        if (!естьКнопка) {
            /* ПРИБОР НАЗЫВАЕТ ПРИЧИНУ ПОИМЁННО. Первая редакция сказала
               «кнопки нет» и замолчала — этого мало, чтобы понять, что
               именно не сложилось. Спрашиваем и базу, и страницу. */
            const что = await page.evaluate(async (id) => {
                const о = {
                    адрес: location.hash,
                    заголовок: (document.querySelector('.ad-page-title, h1') || {}).textContent || '—',
                    вкладок: document.querySelectorAll('[data-trn-nav]').length,
                    панелей: document.querySelectorAll('.ad-brk-panel').length,
                    полосВыгрузки: document.querySelectorAll('.ad-export-bar').length,
                    кнопокПечати: document.querySelectorAll('.ad-export-print').length,
                    кнопокВидимых: [...document.querySelectorAll('.ad-export-print')]
                        .filter(э => э.offsetParent !== null).length,
                    активнаяВкладка: (document.querySelector('[data-trn-nav].active') || {}).dataset
                        ? document.querySelector('[data-trn-nav].active').dataset.trnNav : '—',
                    панелиВидимы: [...document.querySelectorAll('.ad-brk-panel')]
                        .map(э => э.id + ':' + (э.offsetParent !== null ? 'видна' : 'скрыта')).join(' '),
                    модульВыгрузки: !!(window.KSLT_ADMIN && window.KSLT_ADMIN.экспорт)
                };
                if (window.supabaseClient) {
                    const т = await window.supabaseClient.from('tournaments')
                        .select('id, bracket_type').eq('id', id);
                    const м = await window.supabaseClient.from('matches')
                        .select('id').eq('tournament_id', id);
                    о.турнирВБазе = т.data && т.data.length ? JSON.stringify(т.data[0]) : 'нет';
                    о.матчей = (м.data || []).length;
                }
                return JSON.stringify(о);
            }, ТУРНИР);
            throw new Error('кнопка печати не найдена. Страница: ' + что);
        }

        /* Печатное медиа — ровно перед нажатием, как у человека. */
        await page.emulateMedia({ media: 'print' });
        await page.locator(панель + ' .ad-export-print').first().click();
        await page.waitForFunction(() => window.__печатьВызвана === true, null, { timeout: 10000 });
        await page.waitForSelector('body.ad-printing .ad-print-area', { timeout: 10000 });
    }

    test('лист не обрезается окном: у печатной области нет прокрутки',
        async ({ page }) => {
            // Обёртки с прокруткой живут в панели ГРУПП: `.ad-table-wrap`
            // у таблицы группы и `.ad-brk-scroll` у сетки плей-офф
            await напечатать(page, 'bracket');

            /* ЗАМЕР 01.10 НА БОЕВОМ РАСПИСАНИИ: PDF вышел ОДНОЙ страницей и
               начинался с 25-й строки — ровно с той, что была видна на
               экране. Сорока двух матчей на листе не оказалось. На бумаге
               прокрутки нет и быть не может. */
            const обёртки = await page.evaluate(() => {
                const сел = ['.ad-sched-wrap', '.ad-table-wrap', '.ad-brk-scroll'];
                const найдено = [];
                document.querySelectorAll('.ad-print-area ' + сел.join(', .ad-print-area '))
                    .forEach(э => {
                        const с = getComputedStyle(э);
                        найдено.push({
                            класс: э.className.split(' ')[0],
                            overflowX: с.overflowX, overflowY: с.overflowY,
                            maxHeight: с.maxHeight
                        });
                    });
                return найдено;
            });

            expect(обёртки.length,
                'внутри печатной области нет ни одной обёртки с прокруткой — ' +
                'правилу нечего сторожить, проверка прошла бы вхолостую')
                .toBeGreaterThanOrEqual(1);

            обёртки.forEach(о => {
                expect(['visible', ''], о.класс + ': прокрутка уехала на лист')
                    .toContain(о.overflowY);
                expect(о.maxHeight, о.класс + ': у печатной обёртки осталась высота окна')
                    .toBe('none');
            });
        });

    test('полоса клуба одна, прилипла к низу листа и лежит вне печатной области',
        async ({ page }) => {
            await напечатать(page, 'schedule');

            const полоса = await page.evaluate(() => {
                const все = document.querySelectorAll('.ad-print-contacts');
                if (!все.length) return { нет: true };
                const э = все[0];
                const с = getComputedStyle(э);
                return {
                    сколько: все.length,
                    прямойРебёнокBody: э.parentElement === document.body,
                    внутриПечатной: !!э.closest('.ad-print-area'),
                    position: с.position, bottom: с.bottom,
                    видима: с.visibility
                };
            });

            expect(полоса.нет, 'полосы клуба на листе нет вовсе').toBeFalsy();
            expect(полоса.сколько, 'полос клуба больше одной').toBe(1);
            /* ТРИ РЕДАКЦИИ ЗА ДЕНЬ, ДВЕ ИЗ НИХ МОИ ПОЛОМКИ. `static` ставил
               полосу посреди второго листа, `bottom: -10mm` — в начало
               следующего, поверх «ГРУППА C». Осталась `fixed; bottom: 0`. */
            expect(полоса.position, 'полоса перестала прилипать к низу листа').toBe('fixed');
            expect(полоса.bottom, 'полоса ушла от нижнего края').toBe('0px');
            /* Внутри печатной области прилипание к листу не работает —
               полоса выходила один раз в конце. Она прямой ребёнок body. */
            expect(полоса.прямойРебёнокBody, 'полоса уехала внутрь панели').toBe(true);
            expect(полоса.внутриПечатной, 'полоса оказалась в печатной области').toBe(false);
            expect(полоса.видима, 'полоса спрятана вместе со всем, что вне печатной области')
                .toBe('visible');
        });

    test('подписи не доезжают до полосы: воздух под ними больше её высоты',
        async ({ page }) => {
            await напечатать(page, 'schedule');

            const числа = await page.evaluate(() => {
                const подвал = document.querySelector('.ad-print-foot');
                const полоса = document.querySelector('.ad-print-contacts');
                if (!подвал || !полоса) return null;
                return {
                    отступПодПодписями: parseFloat(getComputedStyle(подвал).marginBottom),
                    высотаПолосы: полоса.getBoundingClientRect().height
                };
            });

            expect(числа, 'подвала подписей или полосы на листе нет').not.toBeNull();
            /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: не «16mm», а «воздуха
               под подписями больше, чем высота полосы». Полоса `fixed` и
               места в потоке не занимает — подписи обязаны уйти от неё
               сами. */
            expect(числа.отступПодПодписями,
                'воздух под подписями (' + числа.отступПодПодписями + ') не больше высоты ' +
                'полосы клуба (' + числа.высотаПолосы + ') — подписи лягут под неё')
                .toBeGreaterThan(числа.высотаПолосы);
        });

    test('блок группы едет одним куском',
        async ({ page }) => {
            await напечатать(page, 'bracket');

            const группы = await page.evaluate(() =>
                [...document.querySelectorAll('.ad-print-area .ad-grp-block')]
                    .map(э => getComputedStyle(э).breakInside));

            expect(группы.length,
                'на листе нет ни одной таблицы группы — проверять нечего')
                .toBeGreaterThanOrEqual(1);
            /* «ГРУППА C» без строк и строки без буквы одинаково бесполезны. */
            группы.forEach(б => {
                expect(б, 'блок группы снова рвётся между страницами').toBe('avoid');
            });
        });

    test('длинное расписание переносится, и шапка повторяется на каждом листе',
        async ({ page }) => {
            await напечатать(page, 'schedule');

            const расписание = await page.evaluate(() => {
                const т = document.querySelector('.ad-print-area .ad-sched-table');
                if (!т) return null;
                return {
                    рвётся: getComputedStyle(т).breakInside,
                    шапка: т.tHead ? getComputedStyle(т.tHead).display : 'шапки нет'
                };
            });

            expect(расписание, 'на листе нет таблицы расписания — проверять нечего')
                .not.toBeNull();
            /* ЭТО ПРАВИЛО НЕЛЬЗЯ ДАВАТЬ ВСЕМ ТАБЛИЦАМ: применённое к `table`
               вообще, оно порвало таблицы групп по четыре строки — группа C
               ушла заголовком на первый лист, телом на второй. */
            expect(расписание.рвётся, 'длинное расписание перестало переноситься').toBe('auto');
            expect(расписание.шапка,
                'шапка расписания не повторяется на каждом листе — лист уходит на ' +
                'корты отдельно, и без шапки на нём не разобрать, где что')
                .toBe('table-header-group');
        });

    test('рабочее на лист не идёт, и всё печатается чёрным',
        async ({ page }) => {
            await напечатать(page, 'schedule');

            const лист = await page.evaluate(() => {
                const скрыто = сел => {
                    const э = document.querySelector('.ad-print-area ' + сел);
                    if (!э) return 'нет на странице';
                    return getComputedStyle(э).display;
                };
                const область = document.querySelector('.ad-print-area');
                const первыйТекст = область ? область.querySelector('td, th, .ad-print-title-text') : null;
                return {
                    кнопки: скрыто('button'),
                    полосаВыгрузки: скрыто('.ad-export-bar'),
                    цветТекста: первыйТекст ? getComputedStyle(первыйТекст).color : null,
                    естьШапкаЛиста: !!document.querySelector('.ad-print-title'),
                    естьЛоготип: !!document.querySelector('.ad-print-logo')
                };
            });

            if (лист.кнопки !== 'нет на странице') {
                expect(лист.кнопки, 'кнопки уехали на лист').toBe('none');
            }
            if (лист.полосаВыгрузки !== 'нет на странице') {
                expect(лист.полосаВыгрузки, 'полоса выгрузки уехала на лист').toBe('none');
            }
            expect(лист.цветТекста, 'на листе остался приглушённый серый — он выцветает в нечитаемое')
                .toBe('rgb(0, 0, 0)');
            /* Лист уходит на корты и в чат по частям: без опознания это бумажка
               непонятно откуда. */
            expect(лист.естьШапкаЛиста, 'на листе нет шапки с названием турнира').toBe(true);
            expect(лист.естьЛоготип, 'на листе нет знака клуба').toBe(true);
        });
});
