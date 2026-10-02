// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ЗАМЕНУ БЕРУТ ИЗ ОЧЕРЕДИ — ЗНАЧИТ ОЧЕРЕДЬ И ОТКРЫВАЕТСЯ ПЕРВОЙ.
 *
 * Слово Кости 01.10: «замена берётся в основном из листа ожидания».
 * Раньше окно знало два источника, и оба ручные: искать по всей базе или
 * вписывать гостя. Тот, кто уже стоит в очереди ЭТОГО турнира, не
 * предлагался вовсе — менеджер набирал имя в поиске и мог промахнуться
 * мимо однофамильца.
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файл как текст: что сортировка
 * написана и что вкладка помечена `on`. Но ЧТО ИМЕННО ОТКРЫЛОСЬ и в каком
 * порядке стоят люди, видно только прогоном.
 *
 * КНОПКУ, КОТОРАЯ ПИШЕТ В БАЗУ, ТЕСТ НЕ НАЖИМАЕТ. «Заменить» открывает
 * окно выбора и в базу не пишет (`bracket.js:4688`) — её жать можно.
 * Подтверждение замены не трогаем вовсе.
 *
 * ДАННЫЕ ПОДОБРАНЫ ТАК, ЧТОБЫ ДВА ПОРЯДКА РАЗЛИЧАЛИСЬ: подали
 * alpha → bravo → charlie, а в очередь поставили наоборот. Совпади они —
 * проверка не отличила бы `queue_at` от `registered_at` и прошла бы
 * вхолостую.
 */

const ТУРНИР = 'test-ochered';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

/** Порядок в очереди по времени ПОСТАНОВКИ: charlie → bravo → alpha. */
const ЖДЁМ_ПОРЯДОК = ['Борис Равный', 'Эдуард Равный', 'Яков Первый'];

test.describe('Окно замены: очередь первой', () => {

    test.use({ storageState: require('../../auth-setup').adminState });

    test.beforeEach(({}, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');
    });

    /** Открыть заявки и нажать «Заменить» у первой строки основы. */
    async function открытьОкноЗамены(page) {
        await page.goto('/pages/admin.html#tournaments/bracket/' + ТУРНИР);

        const естьВкладка = await page.waitForSelector('[data-trn-nav="regs"]', { timeout: 20000 })
            .then(() => true).catch(() => false);
        if (!естьВкладка) {
            const что = await page.evaluate(async (id) => {
                if (!window.supabaseClient) return 'клиента базы на странице нет';
                const т = await window.supabaseClient.from('tournaments').select('id').eq('id', id);
                const з = await window.supabaseClient.from('tournament_registrations')
                    .select('id, status').eq('tournament_id', id);
                return JSON.stringify({
                    турнирВБазе: т.data && т.data.length ? 'есть' : 'нет — прогоните node tests/seed.js',
                    заявок: (з.data || []).length,
                    вОчереди: (з.data || []).filter(x => x.status === 'waitlist').length
                });
            }, ТУРНИР);
            throw new Error('турнир ' + ТУРНИР + ' не открылся. ' + что);
        }
        await page.locator('[data-trn-nav="regs"]').first().click();

        const естьЗамена = await page
            .waitForSelector('#adBrkRegPanel .ad-btn-replace', { timeout: 20000 })
            .then(() => true).catch(() => false);
        if (!естьЗамена) {
            const что = await page.evaluate(() => JSON.stringify({
                строкЗаявок: document.querySelectorAll('#adBrkRegPanel tbody tr').length,
                кнопокЗамены: document.querySelectorAll('.ad-btn-replace').length,
                видимых: [...document.querySelectorAll('.ad-btn-replace')]
                    .filter(э => э.offsetParent !== null).length
            }));
            throw new Error('кнопки «Заменить» нет. Страница: ' + что);
        }

        /* «Заменить» в базу не пишет — открывает окно выбора. */
        await page.locator('#adBrkRegPanel .ad-btn-replace').first().click();
        await page.waitForSelector('#adReplaceMode', { timeout: 10000 });
    }

    /**
     * ОКНО ОЖИЛО — ЭТО ПРИЗНАК, А НЕ ПАУЗА.
     *
     * Разметку окна `showConfirm` вставляет сразу, а слушатели навешиваются
     * ОТДЕЛЬНО и ПОЗЖЕ: `setTimeout(..., 100)` (`bracket.js:1395`, пауза на `:1478`). Проверка
     * ждала `#adReplaceMode` — то есть разметку — и нажимала по строке
     * раньше, чем на ней появлялся слушатель: нажатие уходило в пустоту, и
     * падало не окно замены, а сама проверка.
     *
     * Ждать 100 мс было бы ожиданием тишины. Ждём признак: переключатель
     * источника ОТВЕЧАЕТ на нажатие — значит слушатели уже на месте. Жмём
     * «Гость» до тех пор, пока его блок не покажется, и возвращаемся на
     * очередь: она и была открыта первой.
     */
    async function дождатьсяОживления(page) {
        await expect.poll(async () => {
            await page.locator('#adReplaceMode button[data-mode="guest"]').click();
            return await page.locator('#adReplaceGuestBlock').isVisible();
        }, { message: 'окно замены не ожило: переключатель источника не отвечает',
             timeout: 10000 }).toBe(true);

        await page.locator('#adReplaceMode button[data-mode="queue"]').click();
        await expect(page.locator('#adReplaceQueueBlock'),
            'очередь не вернулась на место').toBeVisible();
    }

    test('первой открыта очередь, а не поиск по базе',
        async ({ page }) => {
            await открытьОкноЗамены(page);

            const окно = await page.evaluate(() => {
                const активная = document.querySelector('#adReplaceMode button.on');
                const очередь = document.getElementById('adReplaceQueueBlock');
                const база = document.getElementById('adReplaceDbBlock');
                const видно = э => !!э && э.offsetParent !== null;
                return {
                    источников: document.querySelectorAll('#adReplaceMode button').length,
                    активный: активная ? активная.dataset.mode : '—',
                    очередьВидна: видно(очередь),
                    базаВидна: видно(база)
                };
            });

            /* ИСТОЧНИКА ТРИ: очередь · из базы · гость. */
            expect(окно.источников, 'источников в окне замены не три').toBe(3);
            expect(окно.активный, 'первой открылась не очередь').toBe('queue');
            expect(окно.очередьВидна, 'список очереди не показан').toBe(true);
            expect(окно.базаВидна, 'поиск по базе открыт одновременно с очередью').toBe(false);
        });

    test('очередь — список, и порядок в нём по времени постановки, а не подачи',
        async ({ page }) => {
            await открытьОкноЗамены(page);

            const строки = await page.evaluate(() =>
                [...document.querySelectorAll('.ad-replace-queue-item')].map(э => ({
                    номер: (э.querySelector('.ad-replace-queue-num') || {}).textContent,
                    имя: ((э.querySelector('.ad-replace-queue-name') || {}).textContent || '').trim()
                })));

            /* ПОРОГ ПЕРВЫМ: пустой список сравнивать не с чем. */
            expect(строки.length,
                'очередь в окне пуста — сверять порядок не с чем. В севе трое ждут')
                .toBe(ЖДЁМ_ПОРЯДОК.length);

            /* ОЧЕРЕДЬ — СПИСОК, А НЕ ПОИСК: её читают целиком и выбирают
               глазами, потому что порядок подачи и есть основание выбора.
               Поля ввода в блоке очереди быть не должно. */
            const поисковыхПолей = await page.locator('#adReplaceQueueBlock input[type="text"]').count();
            expect(поисковыхПолей, 'в очереди появился поиск — она список, а не поиск').toBe(0);

            /* ПОРОГ ВТОРОЙ: ДАННЫЕ ОБЯЗАНЫ РАЗЛИЧАТЬ ДВЕ СОРТИРОВКИ.
               Сошлись порядок подачи и порядок очереди — сверять нечего:
               проверка пройдёт при любом коде. Спрашиваем базу тем же
               клиентом, которым её читает админка, и называем причину
               здесь, а не оставляем её на чтение вывода сева. */
            const вБазе = await page.evaluate(async (id) => {
                const о = await window.supabaseClient
                    .from('tournament_registrations')
                    .select('id, status, registered_at, waitlisted_at, queue_at')
                    .eq('tournament_id', id).eq('status', 'waitlist');
                if (о.error) return { беда: о.error.message };
                const ж = о.data || [];
                const порядок = поле => ж.slice()
                    .sort((a, b) => String(a[поле] || '').localeCompare(String(b[поле] || '')))
                    .map(з => з.id).join(',');
                return {
                    ждут: ж.length,
                    своёВремя: ж.filter(з => !!з.waitlisted_at).length,
                    колонкаОчереди: ж.length ? ('queue_at' in ж[0]) : null,
                    поПодаче: порядок('registered_at'),
                    поОчереди: порядок('queue_at')
                };
            }, ТУРНИР);

            expect(вБазе.беда, 'база не ответила на запрос очереди: ' + вБазе.беда)
                .toBeUndefined();
            expect(вБазе.колонкаОчереди,
                'в заявках нет колонки `queue_at` — миграция ' +
                '`sql/функции/ochered-vremya-postanovki.sql` не применена к тестовой базе, ' +
                'и сортировать очередь не по чему. Данные: ' + JSON.stringify(вБазе))
                .toBe(true);
            expect(вБазе.своёВремя,
                'ни у одной заявки нет своего `waitlisted_at` — сев не задал порядок ' +
                'постановки. Данные: ' + JSON.stringify(вБазе))
                .toBe(ЖДЁМ_ПОРЯДОК.length);
            expect(вБазе.поОчереди === вБазе.поПодаче,
                'порядок очереди в базе совпал с порядком подачи — проверка прошла бы ' +
                'вхолостую при любом коде. Данные: ' + JSON.stringify(вБазе))
                .toBe(false);

            /* ПОРЯДОК РАЗЛИЧАЕТ ДВЕ СОРТИРОВКИ. Подали alpha → bravo →
               charlie; в очередь поставили наоборот. Вернись код к
               `registered_at` — список встал бы задом наперёд. */
            expect(строки.map(с => с.имя),
                'порядок очереди считается не по времени постановки')
                .toEqual(ЖДЁМ_ПОРЯДОК);

            expect(строки.map(с => с.номер), 'номера в очереди идут не подряд')
                .toEqual(['1', '2', '3']);
        });

    test('выбор из очереди — тот же выбор человека, а не третья ветка',
        async ({ page }) => {
            await открытьОкноЗамены(page);

            /* Нажатие по строке очереди кладёт выбор в то же скрытое поле,
               что заполнилось бы руками. В базу это не пишет: запись — за
               кнопкой подтверждения, которую тест не трогает. */
            await дождатьсяОживления(page);

            const строка = page.locator('.ad-replace-queue-item').first();
            await expect(строка, 'строки очереди в окне нет — нажимать нечего')
                .toBeVisible();
            await строка.click();

            const снять = () => page.evaluate(() => {
                const поле = document.getElementById('adReplaceQueueReg');
                const стр = document.querySelector('.ad-replace-queue-item');
                return {
                    вПоле: поле ? поле.value : null,
                    уСтроки: стр ? стр.dataset.queueReg : null,
                    помечена: стр ? стр.className : '',
                    полеЕсть: !!поле,
                    поиск: !!document.getElementById('adReplaceSearch'),
                    блокОчереди: !!document.getElementById('adReplaceQueueBlock'),
                    окон: document.querySelectorAll('.ad-confirm-overlay').length,
                    полей: document.querySelectorAll('#adReplaceQueueReg').length,
                    строк: document.querySelectorAll('.ad-replace-queue-item').length
                };
            });

            var выбор = await снять();

            /* САМ СКАЖИ, ЧЕГО НЕ ХВАТИЛО. Пустое поле бывает по двум разным
               причинам, и отличает их только нажатие изнутри страницы:
               слушателя на строке нет вовсе — или он есть, а настоящее
               нажатие до него не доходит. Один прогон обязан называть
               причину, а не оставлять её на следующий. */
            let изнутри = null;
            if (!выбор.вПоле) {
                await page.evaluate(() => {
                    const стр = document.querySelector('.ad-replace-queue-item');
                    if (стр) стр.click();
                });
                изнутри = await снять();
            }

            expect(выбор.вПоле,
                'выбор из очереди никуда не записался. Окно: ' + JSON.stringify(выбор) +
                (изнутри
                    ? (изнутри.вПоле
                        ? '. Нажатие ИЗНУТРИ страницы сработало — значит слушатель на строке есть, ' +
                          'а настоящее нажатие до него не дошло: ' + JSON.stringify(изнутри)
                        : '. Нажатие изнутри страницы тоже ничего не положило — слушателя на строке НЕТ: ' +
                          JSON.stringify(изнутри))
                    : '')).toBeTruthy();
            expect(выбор.вПоле, 'в поле лёг не тот, по кому нажали').toBe(выбор.уСтроки);
            expect(выбор.помечена, 'выбранная строка не помечена на вид').toContain('on');
        });

    test('поиск по базе не предлагает тех, кто уже играет в этом турнире',
        async ({ page }) => {
            /* ТРИ ОКНА ЗАМЕНЫ ПИСАЛИ ПОИСК ТРИЖДЫ, и копия окна одиночки
               забыла исключить занятых — предлагала человека из соседней
               группы. 01.10 поиск сведён в один `привязатьПоиск`
               (`bracket.js:626`), и окно замены зовёт его с картой занятых
               (`:1466`). Заморозка держит, что копия не заведётся снова;
               КОГО ИМЕННО показал поиск, видно только прогоном.

               Кто занят, а кто в очереди, считает `ктоЗанятВТурнире`
               (`:594`): живая заявка — занят, лист ожидания — свободен, но
               помечен; снятые и отклонённые не в счёт. Заменяемый не занят
               сам собой — иначе его нельзя было бы оставить. */
            await page.goto('/pages/admin.html#tournaments/bracket/' + ТУРНИР);
            await page.locator('[data-trn-nav="regs"]').first().click();
            await page.waitForSelector('#adBrkRegPanel .ad-btn-replace', { timeout: 20000 });

            /* Чьё окно откроется — читаем со страницы, а не предполагаем:
               от этого зависит, кого поиск обязан показать. */
            const кого = await page.evaluate(() => {
                const кн = document.querySelector('#adBrkRegPanel .ad-btn-replace');
                const стр = кн ? кн.closest('tr') : null;
                return стр ? стр.textContent.replace(/\s+/g, ' ').trim() : '';
            });

            await page.locator('#adBrkRegPanel .ad-btn-replace').first().click();
            await page.waitForSelector('#adReplaceMode', { timeout: 10000 });
            await дождатьсяОживления(page);

            await page.locator('#adReplaceMode button[data-mode="db"]').click();
            await expect(page.locator('#adReplaceDbBlock'), 'поиск по базе не открылся')
                .toBeVisible();

            await page.locator('#adReplaceSearch').fill('Равный');
            await page.waitForSelector('#adReplaceResults .ad-partner-search-item', { timeout: 10000 });

            const строки = await page.evaluate(() =>
                [...document.querySelectorAll('#adReplaceResults .ad-partner-search-item')]
                    .map(э => э.textContent.replace(/\s+/g, ' ').trim()));

            /* ПОРОГ: поиск вообще что-то нашёл. Пустой список «не предлагает
               занятых» ровно так же, как и сломанный. */
            expect(строки.length, 'поиск ничего не нашёл — проверять нечего').toBeGreaterThan(0);

            const есть = имя => строки.some(с => с.indexOf(имя) !== -1);

            /* В ОЧЕРЕДИ — МОЖНО, И ЭТО ВИДНО СТРОКОЙ. */
            expect(есть('Эдуард Равный'), 'человека из листа ожидания поиск не показал').toBe(true);
            expect(есть('Борис Равный'), 'человека из листа ожидания поиск не показал').toBe(true);

            /* В ОСНОВЕ — НЕЛЬЗЯ, кроме того, кого и меняем. */
            const меняемАнтона = кого.indexOf('Антон Равный') !== -1;
            expect(есть('Антон Равный'), меняемАнтона
                ? 'заменяемого поиск обязан предлагать: его место и освобождается'
                : 'поиск предложил того, кто уже играет в этом турнире. Меняем: ' + кого)
                .toBe(меняемАнтона);
        });

    test('замена капитана не предлагает его же напарника',
        async ({ page }) => {
            /* ПАРА ИЗ ОДНОГО ЧЕЛОВЕКА. Вопрос Кости 02.10: «если будет
               заменяться капитан, что будет перетираться?». Нормальный ход
               не ломает ничего: заявке ставится новый `player_id`, и
               `заменитьВМатчах` переписывает сторону в матчах. Ломал только
               один случай: `ктоЗанятВТурнире` пропускает заменяемую заявку
               ЦЕЛИКОМ (`bracket.js:598`), и вместе с заменяемым из списка
               занятых выпадал его НАПАРНИК — поиск предлагал поставить
               капитаном того, кто уже стоит напарником в этой же паре.

               В паре капитана нет как правила, но в ДАННЫХ он есть: матч
               несёт один идентификатор стороны — `player_id` заявки, —
               а имя пары собирается из заявки (`tournament-detail.js:102`).

               ЗАПИСЬ ЗДЕСЬ НЕ ТРОГАЕМ: окно открывается и читается, кнопку
               сохранения прибор не нажимает. */
            await page.goto('/pages/admin.html#tournaments/bracket/test-doubles');
            await page.locator('[data-trn-nav="regs"]').first().click();
            await page.waitForSelector('#adBrkRegPanel .ad-btn-replace', { timeout: 20000 });

            const строкаПары = page.locator('#adBrkRegPanel tr')
                .filter({ hasText: 'Тестовый Капитан' }).first();
            await expect(строкаПары, 'пары с Тестовым Капитаном нет — прогоните node tests/seed.js')
                .toBeVisible();
            await строкаПары.locator('.ad-btn-replace').first().click();

            /* В парном окно сперва спрашивает, кого менять. */
            await page.waitForSelector('#adReplaceMainBtn', { timeout: 10000 });
            await page.locator('#adReplaceMainBtn').click();
            await page.waitForSelector('#adReplaceMode', { timeout: 10000 });
            await дождатьсяОживления(page);

            await page.locator('#adReplaceMode button[data-mode="db"]').click();
            await page.locator('#adReplaceSearch').fill('Тестовый');
            await page.waitForSelector('#adReplaceResults .ad-partner-search-item', { timeout: 10000 });

            const найдены = await page.evaluate(() =>
                [...document.querySelectorAll('#adReplaceResults .ad-partner-search-item')]
                    .map(э => э.textContent.replace(/\s+/g, ' ').trim()));

            const есть = имя => найдены.some(с => с.indexOf(имя) !== -1);

            /* ПОРОГ: поиск вообще работает и кого-то показывает. Пустой
               список «не предлагает напарника» ровно так же, как и
               починенный. */
            expect(есть('Тестовый Админ'),
                'поиск не нашёл даже того, кто в турнире не играет: ' +
                JSON.stringify(найдены)).toBe(true);

            expect(есть('Тестовый Игрок'),
                'поиск предложил собственного напарника этой пары — выйдет пара из ' +
                'одного человека. Найдено: ' + JSON.stringify(найдены)).toBe(false);
            expect(есть('Тестовый Капитан'),
                'поиск предложил того, кого и меняем').toBe(false);
        });

    /* ПРОВЕРКИ НА СТОРОЖ «УЖЕ СТОИТ В СЕТКЕ» ЗДЕСЬ НЕТ — И ВОТ ПОЧЕМУ.
       Сторож отказывает ДО всякой записи, когда новый игрок уже стоит в
       матче этого турнира (`bracket.js:1379`). Поставить базу в такое
       состояние можно только грязными данными: один человек в двух живых
       заявках. БАЗА ТАКОГО НЕ ПУСКАЕТ — доказано 02.10 её же отказом на
       вставке: `23505 duplicate key (tournament_id, player_id)`. Запрет
       стоит УНИКАЛЬНЫМ ИНДЕКСОМ, а не ограничением таблицы, поэтому в
       `pg_constraint` его и не видно — искать надо в `pg_indexes`.

       Значит случай недостижим через данные, и поставить прибор в нужное
       состояние нельзя ничем, кроме снятия индекса. Проверка, которую
       нельзя привести в нужное состояние, ничего не доказывает — поэтому её
       здесь нет, а не висит красной. Сторож остаётся страховкой на случай,
       если индекс когда-нибудь снимут, и его держат
       четыре правила заморозки (`tools/check-ochered-poryadok.js`): отказ
       стоит до записи, пропуск в `заменитьВМатчах` не молчит, обе стороны
       заявки недоступны, сторож «разные игроки» стоит и на записи. */
});
