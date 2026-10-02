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
});
