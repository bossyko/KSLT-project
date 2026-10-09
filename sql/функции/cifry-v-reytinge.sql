-- ============================================================
-- КСЛТ в цифрах: «Членов клуба» → «В рейтинге»
-- ============================================================
--
-- Слово Кости 09.10. Его же запись лежала в трекере несделанной:
-- «Главная: убрать "Членов клуба", поставить "В рейтинге"».
--
-- ПОЧЕМУ. Счётчик членов считает действующие членства в memberships, а
-- сейчас идёт бесплатный период до 31.12.2026 — членство не спрашивают и
-- почти никто его не оформлял. Замер боевой 09.10: ОДИН. Страница
-- «О проекте» встречала человека словами «Членов клуба — 1», и это
-- честное число, работающее против клуба.
--
-- ЧТО СТАВИМ ВМЕСТО. «В рейтинге» — те, кто действительно играет и имеет
-- место в таблице. Признак берётся не на глаз: KSLT_RULES.вРейтинге
-- (js/kslt-rules.js:888) пускает в рейтинг игрока, который НЕ ГОСТЬ и у
-- которого ЗАПОЛНЕН РАЗРЯД. Здесь то же условие, слово в слово.
--
-- Замер боевой 09.10: игроков всего 489, не-гостей 395, НЕ-ГОСТЕЙ С
-- РАЗРЯДОМ — 388. Это и есть число, которое увидит человек.
--
-- ФОРМА ВОЗВРАТА МЕНЯЕТСЯ, ПОЭТОМУ СНАЧАЛА DROP.
-- CREATE OR REPLACE при изменившемся наборе столбцов отвечает 42P13 и
-- откатывает весь прогон — нас это уже кусало 09.10 на get_battle_votes.
-- Старое тело функции сохранено в sql/функции/public-club-stats.sql и в
-- истории git, терять нечего.
--
-- Запускать можно повторно.

BEGIN;

DROP FUNCTION IF EXISTS public.get_club_stats();

CREATE FUNCTION public.get_club_stats()
RETURNS TABLE (
    ranked       integer,   -- игроки с местом в рейтинге: не гость и с разрядом
    users        integer,   -- заведённые учётные записи
    tournaments  integer,   -- завершённые турниры с начала работы сайта
    courts       integer,   -- теннисные центры
    coaches      integer    -- тренеры
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    -- ТО ЖЕ УСЛОВИЕ, ЧТО В KSLT_RULES.вРейтинге, И ЭТО НАМЕРЕННО:
    -- одно понятие — одно определение. Разойдутся они на второй правке,
    -- а не сразу, и тогда число на «О проекте» перестанет сходиться с
    -- длиной таблицы рейтинга.
    SELECT
        (SELECT count(*)::integer FROM players
          WHERE is_guest IS NOT TRUE AND category_id IS NOT NULL),
        (SELECT count(*)::integer FROM profiles),
        -- Турниры до 2025 года в базе не заведены: сообщество старше сайта.
        -- Архивную часть прибавляет уже сама страница, здесь только живой счёт
        (SELECT count(*)::integer FROM tournaments
          WHERE status = 'completed' AND date_start >= DATE '2025-01-01'),
        (SELECT count(*)::integer FROM courts),
        (SELECT count(*)::integer FROM coaches);
$$;

COMMENT ON FUNCTION public.get_club_stats() IS
    'Пять чисел для счётчиков на главной и на «О проекте». Отдаёт только итоги, строки с личными данными наружу не уходят. 09.10: members заменён на ranked — считаем тех, у кого есть место в рейтинге.';

REVOKE ALL ON FUNCTION public.get_club_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_stats() TO anon, authenticated;

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================

-- 1. Что теперь отдаёт функция. Ждём ranked около 388 в боевой.
SELECT * FROM public.get_club_stats();

-- 2. Сходится ли «в рейтинге» с тем, как считает сайт: оба числа должны
--    совпасть. Если разошлись — разошлись определения, и это беда на шве.
SELECT (SELECT count(*) FROM players WHERE is_guest IS NOT TRUE AND category_id IS NOT NULL) AS po_pravilu_sayta,
       (SELECT ranked FROM public.get_club_stats())                                          AS po_funkcii;

-- 3. Форма возврата: ждём ranked первым столбцом, members не должно быть.
SELECT ordinal_position, parameter_name, data_type
  FROM information_schema.parameters
 WHERE specific_schema = 'public'
   AND specific_name LIKE 'get_club_stats%'
   AND parameter_mode = 'TABLE'
 ORDER BY ordinal_position;

-- 4. Права: ждём anon и authenticated.
SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public' AND routine_name = 'get_club_stats'
 ORDER BY grantee;
