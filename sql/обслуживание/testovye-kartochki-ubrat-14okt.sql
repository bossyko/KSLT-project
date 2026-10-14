-- ============================================================
-- Две тестовые карточки из боевой базы — ВТОРАЯ РЕДАКЦИЯ
-- ============================================================
--
-- Слово Кости 14.10: «да убирай».
--
-- ЧТО ЭТО. Счётчик «в рейтинге» на главной (`get_club_stats`, первая
-- колонка `ranked`) считает не-гостей с заполненным разрядом и даёт 400.
-- Реально в таблицах рейтинга стоят 399. Разницу даёт ОДНА карточка:
--
--   test-testm     «Тест Тестм»    не гость, разряд `friendly`
--   test-muzhchina «Тест мужчина»  гость, в счёт не идёт
--
-- Разряд у первой не пустой, поэтому счётчик её берёт; в таблицу она не
-- идёт, потому что `friendly` — категория нерейтинговая. Формула счётчика
-- верна, лишняя здесь сама карточка.
--
-- ПОЧЕМУ ВТОРАЯ РЕДАКЦИЯ. Первая упала:
--
--   23503: update or delete on table "players" violates foreign key
--   constraint "profiles_player_id_fkey" on table "profiles"
--
-- МОЯ ОШИБКА, И ОНА В ПРИБОРЕ. Связи я считал из браузера анонимным
-- ключом, а `profiles` закрыта правилами доступа: RLS вернула «0 строк»
-- не потому, что строк нет, а потому что их не видно. СЧЁТ ПОД RLS — НЕ
-- СЧЁТ. Ниже стоит снимок, который считает ТВОИМ доступом, а не моим.
--
-- ЧТО МЕНЯЕТСЯ ПРОТИВ ПЕРВОЙ РЕДАКЦИИ. У карточки есть учётная запись.
-- Учётку НЕ удаляем — отвязываем: `profiles.player_id` становится пустым,
-- сама запись остаётся целиком. Удаляется только карточка игрока.
--
-- `player_badges` уйдёт каскадом — у него `ON DELETE CASCADE`
-- (sql/схема/schema-snapshot.sql:1174). Остальные связи проверяет шаг 1:
-- если он покажет хоть одну строку кроме profiles — НЕ ЗАПУСКАЙ дальше,
-- пришли вывод мне.
--
-- УДАЛЕНИЕ НЕОБРАТИМО.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. СНИМОК ДО: все связи, посчитанные ТВОИМ доступом --------
-- Ждём: profiles 1 (или 2), badges 1, ВСЁ ОСТАЛЬНОЕ НОЛЬ.

SELECT 'карточек'                 AS что, count(*)::text AS сколько FROM public.players
        WHERE id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'profiles',      count(*)::text FROM public.profiles
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'player_badges', count(*)::text FROM public.player_badges
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'заявки',        count(*)::text FROM public.tournament_registrations
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'итоги',         count(*)::text FROM public.tournament_results
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'история',       count(*)::text FROM public.rating_history
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'разряды',       count(*)::text FROM public.player_categories
        WHERE player_id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'матчи',         count(*)::text FROM public.matches
        WHERE player1_id IN ('test-testm', 'test-muzhchina')
           OR player2_id IN ('test-testm', 'test-muzhchina')
           OR winner_id  IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'чья учётка',    coalesce(string_agg(email, ', '), '—') FROM public.profiles
        WHERE player_id IN ('test-testm', 'test-muzhchina');


BEGIN;

-- ---- 2. Отвязать учётку, не удаляя её ---------------------------
-- Запись `profiles` остаётся целиком, пустеет только ссылка на карточку.

UPDATE public.profiles
   SET player_id = NULL
 WHERE player_id IN ('test-testm', 'test-muzhchina');

-- ---- 3. Удалить карточки ----------------------------------------

DELETE FROM public.players
 WHERE id IN ('test-testm', 'test-muzhchina');

COMMIT;


-- ---- ПРОВЕРКА 1: карточек не осталось, учётки целы --------------
-- Ждём: карточек 0, учёток столько же, сколько было в снимке.

SELECT 'карточек осталось' AS что, count(*)::text AS сколько FROM public.players
        WHERE id IN ('test-testm', 'test-muzhchina')
UNION ALL SELECT 'учёток с пустой карточкой', count(*)::text FROM public.profiles
        WHERE player_id IS NULL;


-- ---- ПРОВЕРКА 2: счётчик сошёлся с таблицами --------------------
-- Ждём ranked = 399. До удаления было 400.

SELECT * FROM public.get_club_stats();


-- ---- ПРОВЕРКА 3: тестовых карточек в базе больше нет ------------
-- Ждём 0 строк.

SELECT id, name, is_guest, category_id
  FROM public.players
 WHERE id LIKE 'test-%' OR name ILIKE 'тест%' OR name ILIKE 'test %'
 ORDER BY id;
