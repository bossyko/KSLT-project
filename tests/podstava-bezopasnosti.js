/**
 * ПОДСТАВНАЯ БАЗА ДЛЯ ЖАЛОБ И БЛОКИРОВОК (кусок 1.2, 04.11).
 *
 * ЗАЧЕМ ОНА ЕСТЬ. Кнопки жалобы и блокировки стоят только у ВОШЕДШЕГО
 * члена клуба и только на ЧУЖОЙ карточке: гостю их нет, себе их нет. По
 * настоящей базе прогона это значит «страница почти всегда без кнопок» —
 * проба молча пропускалась бы, а проверка, которая всегда пропускается,
 * не доказывает ничего.
 *
 * НИ БАЗУ, НИ ФУНКЦИИ ЭТО НЕ ЗОВЁТ. `window.supabaseClient` подменяется в
 * окне ДО загрузки скриптов страницы: цепочка `.from().select().eq()`
 * отвечает заготовленными строками, `rpc` — заготовленными ответами, и
 * каждый зов записывается в `window.КСЛТ_ЗОВЫ`. Так проверяется не только
 * то, что нарисовалось, но и ЧТО УШЛО БЫ В БАЗУ — имя функции и доводы.
 *
 * ПОЧЕМУ НЕ ПОДМЕНА `fetch`. Страница ходит в базу клиентом supabase, и
 * подмена на уровне сети проверяла бы ЕГО, а не наш код. Нас занимает
 * свой слой: какую функцию зовём и с какими доводами.
 *
 * ДАННЫЕ КРАЙНИЕ, А НЕ УДОБНЫЕ:
 *   · имя чужого игрока — самое длинное, какое встречается в клубе,
 *     двойное, с дефисом: на нём кнопки безопасности и переносятся;
 *   · в списке блокировок — и свежая запись, и годовалая, и человек
 *     вовсе без фотографии;
 *   · ответ блокировки отдаёт и отменённые одиночные, и парный матч,
 *     который НЕ отменяется: про него говорится отдельной фразой;
 *   · список блокировок пустой — тоже вид, и у него своя надпись.
 *
 * ЧЕГО ОНА НЕ ДЕЛАЕТ, И ЭТО НАЗВАНО: она не проверяет саму серверную
 * функцию. Что `kslt_zablokirovat` правда снимает назначенный матч,
 * доказывают правила на SQL и чтение базы, а не этот прогон.
 */
'use strict';

/* Кто я и кто он. Профиль и карточка — разные сущности, и путать их
   нельзя: блокировка живёт по ПРОФИЛЮ, кнопки стоят на КАРТОЧКЕ. */
const Я = { профиль: 'U-ME', игрок: 'P-ME' };
const ОН = { профиль: 'U-HIM', игрок: 'P-HIM' };

/* САМОЕ ДЛИННОЕ ИМЯ, КАКОЕ БЫВАЕТ: двойная фамилия через дефис. Короткое
   имя ничего не проверяет — кнопки на нём встанут при любой вёрстке. */
const ИМЯ_ЕГО = 'Жапаркул Абдыкадыр-Тургунбаев';

function данные(о) {
    о = о || {};
    return {
        я: Я,
        он: ОН,
        заблокирован: !!о.заблокирован,
        /* Ответ тихой отмены: два одиночных сняты, один парный остался. */
        отмена: о.отмена || { ok: true, otmeneno: 2, parnyh: 1 },
        /* ФОРМА — РОВНО ТА, ЧТО ОТДАЁТ `kslt_moi_blokirovki()`
           (sql/схема/apple-1-2-zaslon.sql:137): player_id, name, name_en,
           name_kg, photo, created_at. Подстава, разошедшаяся с базой по
           именам полей, доказывает работу подставы, а не кода.
           Крайние случаи: свежая запись и годовалая, самое длинное имя и
           самое короткое, человек без фотографии. */
        блокировки: о.блокировки !== undefined ? о.блокировки : [
            { player_id: ОН.игрок, name: ИМЯ_ЕГО, name_en: ИМЯ_ЕГО,
              name_kg: ИМЯ_ЕГО, photo: null,
              created_at: '2026-11-03T10:00:00Z' },
            { player_id: 'P-OLD', name: 'Ли', name_en: 'Li', name_kg: 'Ли',
              photo: null, created_at: '2025-09-01T08:30:00Z' }
        ],
        /* Моя собственная карточка — самое короткое имя, какое бывает. */
        мой: {
            id: Я.игрок, name: 'Я Сам', name_en: 'Me Myself', name_kg: 'Я Сам',
            photo: null, country: 'KG', category_id: 'masters',
            points: 2000, wins: 30, losses: 5, rank_change: 0,
            form: ['W', 'W', 'W', 'W', 'W'],
            doubles_wins: 0, doubles_losses: 0, mixed_wins: 0, mixed_losses: 0,
            ntrp_singles: 5.0, ntrp_doubles: 4.5,
            gender: 'men', is_online: true, is_member: true,
            is_guest: false, has_account: true
        },
        игрок: {
            id: ОН.игрок, name: ИМЯ_ЕГО, name_en: ИМЯ_ЕГО, name_kg: ИМЯ_ЕГО,
            photo: null, country: 'KG', category_id: 'masters',
            points: 1240, wins: 18, losses: 7, rank_change: 0,
            form: ['W', 'W', 'L', 'W', 'W'],
            doubles_wins: 4, doubles_losses: 2, mixed_wins: 0, mixed_losses: 0,
            ntrp_singles: 4.5, ntrp_doubles: 4.0,
            gender: 'men', is_online: false, is_member: true,
            is_guest: false, has_account: true
        }
    };
}

/**
 * Ставит подставу в контекст. Зовётся ДО `page.goto`.
 *
 * Внутри — одна функция, целиком уезжающая в окно: `addInitScript` не
 * умеет тянуть за собой замыкания, и всё, что ей нужно, приходит доводом.
 */
async function поставить(контекст, о) {
    await контекст.addInitScript(function (д) {
        window.КСЛТ_ЗОВЫ = [];
        /* Отдельный список: всё, что страница попыталась ЗАПИСАТЬ. */
        window.КСЛТ_ЗАПИСИ = [];
        window.КСЛТ_ПОДСТАВА = д;

        /* ОТВЕТЫ ФУНКЦИЙ — ОДНИМ МЕСТОМ. Меняется он пробой на ходу:
           `window.КСЛТ_ОТВЕТ.kslt_zablokirovat = {...}`. */
        window.КСЛТ_ОТВЕТ = {
            kslt_zablokirovan_li: д.заблокирован,
            kslt_zablokirovat: д.отмена,
            kslt_razblokirovat: { ok: true },
            kslt_pozhalovatsya: { ok: true },
            kslt_moi_blokirovki: д.блокировки,
            /* Контакты теперь отдаёт функция, а не таблица: подстава
               обязана уметь то же, что настоящая база. Заблокирован —
               функция сама вернула бы отказ. */
            kslt_kontakty: д.заблокирован
                ? { error: 'blocked' }
                : { phone: '+996700111222', show_phone: true,
                    whatsapp_phone: null, show_whatsapp: false,
                    telegram: '@kslt_test', show_telegram: true,
                    instagram: null, show_instagram: false },
            get_player_challenges: [],
            increment_player_view: null,
            get_player_avatar: null
        };

        /* Строки по таблицам. Чего нет — пустой список: страница обязана
           пережить отсутствие данных, а не только их наличие. */
        var ТАБЛИЦЫ = {
            /* ОБЕ КАРТОЧКИ, А НЕ ОДНА: проба «на своей карточке кнопок
               нет» открывает страницу по МОЕМУ id, и карточка должна
               найтись — иначе страница скажет «игрок не найден» и проверит
               не то. */
            players_public: [д.игрок, д.мой],
            players: [д.игрок, д.мой],
            /* ВЛОЖЕННАЯ КАРТОЧКА — ЧАСТЬ ОТВЕТА, А НЕ ПРИДАТОК.
               `mobile/www/js/auth.js:71` просит профиль ВМЕСТЕ с
               `players!profiles_player_id_fkey(...)`. Без вложенного
               `players` вход считает, что карточки у человека нет, кабинет
               остаётся пустым, и полоса безопасности не рисуется вовсе —
               проба молча проверяла бы экран входа. */
            profiles: [{ id: д.я.профиль, player_id: д.я.игрок,
                         full_name: 'Я Сам', role: 'user',
                         avatar_url: null, last_seen: null,
                         deleted_at: null, account_deleted_at: null,
                         phone: '+996700000000', show_phone: true,
                         whatsapp_phone: null, show_whatsapp: false,
                         telegram: null, show_telegram: false,
                         instagram: null, show_instagram: false,
                         players: { id: д.я.игрок, name: 'Я Сам',
                                    name_en: 'Me Myself', name_kg: 'Я Сам',
                                    photo: null, country: 'KG',
                                    category_id: 'masters', points: 2000,
                                    wins: 30, losses: 5, rank_change: 0,
                                    form: ['W', 'W', 'W', 'W', 'W'],
                                    doubles_wins: 0, doubles_losses: 0,
                                    mixed_wins: 0, mixed_losses: 0,
                                    ntrp_singles: 5.0, ntrp_doubles: 4.5,
                                    gender: 'men', is_online: true,
                                    is_member: true, is_guest: false,
                                    has_account: true } }],
            categories: [{ id: 'masters', name: 'Masters', name_en: 'Masters',
                           name_kg: 'Masters', sort_order: 2, gender: 'men' }],
            player_categories: [{ category_id: 'masters', points: 1240,
                                  wins: 18, losses: 7, closed_at: null }],

            /* БЕСПЛАТНЫЙ ПЕРИОД — ЭТО ДАННЫЕ, А НЕ ПОДМЕНА ФУНКЦИИ.
               04.11, НАЙДЕНО ПРОГОНОМ: страница рисовала ГОСТЕВОЙ блок, а
               не карточку, и признак готовности приходил со значением
               `gostyam-zakryto`. Причина — `KSLT_DOSTUP.уровень()` зовёт
               настоящий `checkMembership`, тот — настоящий
               `бесплатныйПериод`, а тот читает `app_settings` с ключом
               `free_access_until` (`js/membership.js:37`). Пусто — значит
               период не идёт, членства нет, человек гость, и кнопок
               безопасности на чужой карточке он не видит по праву.
               Первая моя правка подменяла сами функции в окне; это было
               неверно — `js/membership.js` объявлен `'use strict'`, и
               незаписываемое свойство уронило бы его целиком. ДАННЫЕ, А НЕ
               ПОДМЕНА: настоящий код проходит весь свой путь и приходит к
               «член клуба» сам. */
            app_settings: [{ key: 'free_access_until', value: '2099-12-31' }],
            memberships: [{ profile_id: д.я.профиль, status: 'active',
                            starts_at: '2026-01-01', expires_at: '2099-12-31',
                            paid: true }]
        };

        /**
         * ЦЕПОЧКА, КОТОРАЯ ОТВЕЧАЕТ НА ЧЁМ УГОДНО.
         *
         * Клиент supabase — это цепочка: `.select().eq().order().single()`,
         * и порядок звеньев у разных мест разный. Поэтому каждое звено
         * возвращает САМУ цепочку, а ответ отдаётся на `then`: так проба
         * не ломается от нового звена, которого в ней не предусмотрели.
         */
        function цепочка(строки, таблица) {
            var ц = {};
            /* `eq` НЕ ДЕКОРАЦИЯ: по нему страница отличает ЧУЖУЮ карточку
               от СВОЕЙ. 04.11, найдено прогоном: подстава отдавала одного и
               того же игрока на любой `id`, и проба «на своей карточке
               кнопок нет» падала — страница честно считала карточку чужой,
               потому что подстава ей так ответила. ПОДСТАВА, НЕ УВАЖАЮЩАЯ
               ОТБОР, ОТВЕЧАЕТ НЕ НА ТОТ ВОПРОС, КОТОРЫЙ ЗАДАЛИ. */
            var отбор = [];
            var отобранные = function () {
                return строки.filter(function (с) {
                    return отбор.every(function (п) {
                        return !(п.поле in с) || String(с[п.поле]) === String(п.что);
                    });
                });
            };
            var итог = function () { return { data: отобранные(), error: null }; };
            /* ЗВЕНЬЯ НЕ ВЫДУМАНЫ, А ПОСЧИТАНЫ ПО КОДУ ПРОДУКТА (04.11):
               grep по `js` и `mobile/www/js` даёт ровно этот набор —
               `.eq` 566 мест, `.filter` 464, `.contains` 105, `.match` 67,
               `.gt` 5 и так далее. Подстава, в которой звена нет, рвёт
               страницу на первом же зове: так 04.11 пропали `update` и
               `gt`, и один пропуск дал 123 падения. */
            ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
             'is', 'in', 'contains', 'containedBy', 'overlaps', 'textSearch',
             'match', 'not', 'or', 'filter', 'order', 'limit', 'range',
             'abortSignal', 'throwOnError', 'returns', 'csv'
            ].forEach(function (з) { ц[з] = function () { return ц; }; });

            ц.eq = function (поле, что) {
                отбор.push({ поле: поле, что: что });
                return ц;
            };

            /* ЗАПИСЬ ТОЖЕ ЗВЕНО ЦЕПОЧКИ, И ЕЁ НАДО ЗАПИСАТЬ, А НЕ СЪЕСТЬ.
               04.11, НАЙДЕНО ПРОГОНОМ: без `update` подстава валила
               страницу целиком. `js/supabase-config.js:92` на каждой
               странице обновляет `profiles.last_seen` у вошедшего, и
               `c.from(...).update is not a function` рвало инициализацию
               ДО загрузки игрока — страница рисовала «игрок не найден», а
               признак готовности не приходил вовсе. Одна нехватка в
               подставе дала 123 падения: ПОДСТАВА, НЕ УМЕЮЩАЯ ТОГО, ЧТО
               УМЕЕТ НАСТОЯЩИЙ КЛИЕНТ, ПРОВЕРЯЕТ СЕБЯ, А НЕ КОД.
               Записи складываются в `КСЛТ_ЗАПИСИ` — так проба может
               доказать, что кнопка в базу НЕ писала. */
            ['insert', 'update', 'upsert', 'delete'].forEach(function (з) {
                ц[з] = function (что) {
                    window.КСЛТ_ЗАПИСИ.push({ вид: з, таблица: таблица, что: что });
                    return ц;
                };
            });
            ц.single = function () {
                var с = отобранные();
                return Promise.resolve({ data: с[0] || null, error: null });
            };
            ц.maybeSingle = ц.single;
            ц.then = function (у, п) { return Promise.resolve(итог()).then(у, п); };
            ц.catch = function (п) { return Promise.resolve(итог()).catch(п); };
            return ц;
        }

        var клиент = {
            auth: {
                getSession: function () {
                    return Promise.resolve({ data: { session: { access_token: 'TOK',
                        user: { id: д.я.профиль } } }, error: null });
                },
                getUser: function () {
                    return Promise.resolve({ data: { user: { id: д.я.профиль } }, error: null });
                },
                onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
            },
            from: function (таблица) {
                window.КСЛТ_ЗОВЫ.push({ вид: 'from', таблица: таблица });
                return цепочка(ТАБЛИЦЫ[таблица] || [], таблица);
            },
            rpc: function (имя, доводы) {
                window.КСЛТ_ЗОВЫ.push({ вид: 'rpc', имя: имя, доводы: доводы || {} });
                var о = window.КСЛТ_ОТВЕТ;
                if (!(имя in о)) return Promise.resolve({ data: null, error: null });
                var ответ = о[имя];
                if (ответ && ответ.__отказ) {
                    return Promise.resolve({ data: null, error: { message: ответ.__отказ } });
                }
                return Promise.resolve({ data: ответ, error: null });
            },
            channel: function () {
                return { on: function () { return this; }, subscribe: function () { return this; } };
            },
            removeChannel: function () {}
        };

        /* СВОЙСТВО ЗАВОДИТСЯ НЕЗАПИСЫВАЕМЫМ — иначе `js/supabase-init.js`
           присвоит своего клиента поверх подставы, и проба уйдёт в базу.
           Ровно так же сделано у подставы рейтинга. */
        try {
            Object.defineProperty(window, 'supabaseClient', {
                value: клиент, writable: false, configurable: false
            });
        } catch (e) { window.supabaseClient = клиент; }

        /* Своих `checkMembership` и `бесплатныйПериод` подстава НЕ
           объявляет: их объявляет сам продукт, и пусть объявляет. Членство
           приходит из строки `app_settings` выше — настоящим путём. */

        /* ЗНАКОМСТВО УЖЕ ПРОЙДЕНО. 04.11 прогон показал поверх экрана
           приложения окно «Вход · Регистрация»: `mobile/www/js/app.js:480`
           показывает знакомство всем, у кого нет метки
           `kslt_onboarding_done`, а у чистого окна пробы её нет. Окно
           накрывает карточку целиком, и проба ждала бы кнопок, которых
           не видно. Метка ставится так же, как её ставит сам человек,
           нажав «Пропустить» (`app.js:533`). */
        try { window.localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    }, данные(о));
}

module.exports = { поставить, данные, Я, ОН, ИМЯ_ЕГО };
