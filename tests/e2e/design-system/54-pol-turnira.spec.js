// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ПОЛ ТУРНИРА — ОТКАЗ, А НЕ ПОМЕТКА.
 *
 * Решение Кости 30.09: «в рейтинговом одиночном пол — отказ, не
 * рассмотрение». Очки идут в мужской или женский рейтинг, и чужой пол там
 * невозможен. В парных и дружеских заявку принимаем и помечаем: женскую
 * пару в мужской парный заявляют осознанно, и решать это человеку.
 *
 * ПРИЗНАК РЕЙТИНГОВОГО ТРЕБУЕТ НЕПУСТОГО `level_id`
 * (`tournament-register/index.ts:337`): пустой уровень выключает не только
 * очки, но и сам отказ — несовпадение пола станет пометкой. Поэтому сев
 * заводит уровень и проверяет его чтением.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ. Правила читают файл как текст: что `рейтинговый`
 * собран из трёх условий и что в этой ветке стоит `403`. Но ОТВЕТИТ ЛИ
 * функция отказом — и не упрётся ли заявка в воротца раньше, — видно
 * только прогоном.
 *
 * В БАЗУ ЭТА ПРОВЕРКА НЕ ПИШЕТ. Отказ ничего не создаёт; запись появится
 * ровно тогда, когда правило сломается, — и это и будет падением. Сев
 * чистит заявку перед каждым прогоном, чтобы сломанный отказ не спрятался
 * за `already_registered`.
 *
 * ОБРАТНАЯ ВЕТКА ЗДЕСЬ НЕ ПРОВЕРЯЕТСЯ: приём заявки — это запись в базу, а
 * кнопку, которая пишет, прибор не нажимает. Пометка о рассмотрении
 * проверяется чтением кода и заморожена правилом.
 */

const ТУРНИР = 'test-pol';
const ЖЕНЩИНА = { email: 'woman@test.kslt.kg', password: 'TestWoman1!' };

test.describe('Пол турнира', () => {

    /* ПРОПУСК ВИДА НАЗЫВАЕТСЯ ВСЛУХ: решение о допуске принимает функция на
       сервере, и от ширины окна оно не зависит ни одной строкой. Гоняем на
       одном виде — пять одинаковых входов в учётку ничего не доказали бы. */
    test.beforeEach(({}, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop',
            'допуск решает функция на сервере: от вида не зависит');
    });


    test('порог: мужской рейтинговый одиночный и женская карточка',
        async ({ page }) => {
            await page.goto('/pages/tournament.html?id=' + ТУРНИР);
            await page.waitForFunction(() => !!window.supabaseClient, null, { timeout: 20000 });

            const что = await page.evaluate(async (ид) => {
                const т = await window.supabaseClient.from('tournaments')
                    .select('format, level_id, gender, status').eq('id', ид).single();
                const и = await window.supabaseClient.from('players')
                    .select('gender').eq('id', 'test-woman').single();
                return {
                    турнир: т.data || null, беда: (т.error || {}).message || null,
                    игрок: и.data || null
                };
            }, ТУРНИР);

            expect(что.турнир, 'турнира ' + ТУРНИР + ' в базе нет — прогоните node tests/seed.js. ' +
                (что.беда || '')).not.toBeNull();
            expect(что.турнир.format, 'турнир не одиночный — отказа по полу не будет').toBe('singles');
            expect(!!что.турнир.level_id,
                'у турнира пустой уровень: он не считается рейтинговым, и пол даст ' +
                'пометку, а не отказ. Проверка прошла бы вхолостую').toBe(true);
            expect(что.турнир.gender, 'турнир не мужской').toBe('men');
            expect(что.турнир.status, 'заявки закрыты — упрёмся в воротца раньше пола')
                .toBe('registration_open');
            expect((что.игрок || {}).gender, 'карточка test-woman не женская').toBe('women');
        });

    test('женская заявка в мужской рейтинговый — отказ, и именно по полу',
        async ({ page }) => {
            await page.goto('/pages/tournament.html?id=' + ТУРНИР);
            await page.waitForFunction(() => !!window.supabaseClient, null, { timeout: 20000 });

            /* ВЫЛОЖЕНА ЛИ ФУНКЦИЯ — ЭТО НЕ ТО ЖЕ, ЧТО СЛОМАН ЛИ ОТКАЗ.
               Замер 02.10: в тестовом проекте `tournament-register` нет
               вовсе, и вызов отвечает 404 NOT_FOUND. Падение на этом
               обвинило бы продукт в том, чего он не делал, поэтому сперва
               стучимся без входа: 404 — функции нет, любой другой ответ
               (401, 400) — функция на месте и слушает. */
            const стук = await page.evaluate(async () => {
                const r = await fetch(window.KSLT_DB.url + '/functions/v1/tournament-register', {
                    method: 'POST',
                    headers: { 'apikey': window.KSLT_DB.key, 'Content-Type': 'application/json' },
                    body: '{}'
                });
                return r.status;
            });
            test.skip(стук === 404,
                'функция tournament-register не выложена в тестовый проект: ' +
                'допуск проверить нечем. Выкладка — ' +
                'supabase functions deploy tournament-register');

            const ответ = await page.evaluate(async ([ид, почта, пароль]) => {
                const вход = await window.supabaseClient.auth.signInWithPassword({
                    email: почта, password: пароль
                });
                if (вход.error) return { вошла: false, беда: вход.error.message };

                /* ПРОФИЛЬ ЧИТАЕТСЯ ТЕМ ЖЕ СПИСКОМ КОЛОНОК, ЧТО И В ФУНКЦИИ
                   (`tournament-register/index.ts:143`). Нет одной колонки —
                   падает весь запрос, функция видит пустоту и отвечает
                   `profile_not_found`, хотя профиль на месте. Сегодня это
                   уже было с очередью: тестовая база отстаёт от боевой. */
                const проф = await window.supabaseClient.from('profiles')
                    .select('id, full_name, player_id, role, gender, lang')
                    .eq('id', вход.data.user.id).single();

                const сессия = await window.supabaseClient.auth.getSession();
                const токен = сессия.data.session ? сессия.data.session.access_token : '';

                const res = await fetch(window.KSLT_DB.url + '/functions/v1/tournament-register', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + токен,
                        'apikey': window.KSLT_DB.key,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tournament_id: ид })
                });
                let тело = null;
                try { тело = await res.json(); } catch (e) { тело = { error: 'ответ не JSON' }; }

                /* Заявка после отказа появиться не должна — читаем базу, а не
                   верим ответу. */
                const заявки = await window.supabaseClient.from('tournament_registrations')
                    .select('id, status').eq('tournament_id', ид).eq('player_id', 'test-woman');

                await window.supabaseClient.auth.signOut();
                return {
                    вошла: true, код: res.status, тело: тело,
                    заявок: (заявки.data || []).length,
                    профиль: проф.data ? 'есть' : 'нет',
                    профБеда: (проф.error || {}).message || null,
                    ид: вход.data.user.id
                };
            }, [ТУРНИР, ЖЕНЩИНА.email, ЖЕНЩИНА.password]);

            expect(ответ.вошла, 'женская учётка не вошла: ' + (ответ.беда || '') +
                '. Прогоните node tests/seed.js').toBe(true);

            /* ОТКАЗ ИМЕННО ПО ПОЛУ, А НЕ ПО ЧЕМУ ПОПАЛО. 403 бывает и от
               членства, и от взноса, и от закрытой категории — такой отказ
               доказал бы не то правило. */
            /* ПОРОГ ПЕРЕД ОТКАЗОМ: профиль обязан читаться ТЕМ ЖЕ запросом,
               что делает функция. Иначе её «profile_not_found» говорит не о
               допуске, а о недостающей колонке в тестовой базе. */
            expect(ответ.профБеда,
                'профиль не читается тем же списком колонок, что в функции: ' +
                ответ.профБеда + '. Это не беда допуска — это расхождение схем ' +
                'тестовой и боевой базы').toBeNull();
            expect(ответ.профиль, 'профиля у женской учётки нет: id ' + ответ.ид +
                '. Прогоните node tests/seed.js').toBe('есть');

            expect(ответ.тело && ответ.тело.error,
                'отказ пришёл не по полу, а по другой причине — или не пришёл вовсе. ' +
                'Ответ: ' + JSON.stringify(ответ.тело) + ', код ' + ответ.код)
                .toBe('gender_mismatch');
            expect(ответ.код, 'код ответа не 403').toBe(403);

            /* РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ. Сломайся отказ — заявка
               легла бы, и ответ «403» её бы не отменил. */
            expect(ответ.заявок, 'после отказа в базе появилась заявка').toBe(0);
        });
});
