-- ============================================================
-- ТЕСТОВАЯ БАЗА ДОГОНЯЕТ БОЕВУЮ: клубные цифры
-- ============================================================
--
-- Запускать в ТЕСТОВОМ проекте (itlanqwcwygxchitaatt), не в боевом.
-- По слову Кости 04.10: «заводи давай».
--
-- ЗАЧЕМ. Прогон 04.10 упал весь на проверке «четыре числа обложки»:
-- 60 проверок из 60, по 50 секунд каждая. Причина прочитана в обеих
-- базах, а не угадана:
--
--   тестовая → POST /rest/v1/rpc/get_club_stats → 404 PGRST202
--              «no matches were found in the schema cache»
--   боевая   → 200 {"members":1,"users":9,"tournaments":40,
--                    "courts":31,"coaches":1}
--
-- БАЗЫ РАСХОДИЛИСЬ СХЕМОЙ, А НЕ ТОЛЬКО ДАННЫМИ. Пока функции здесь нет,
-- на главной в прогоне стоят прочерки ВО ВСЕХ ПЯТИ счётчиках — они все
-- идут из неё одной, — и любая проверка клубных цифр слепа.
--
-- Проверено чтением тестовой базы 04.10: все пять таблиц на месте.
-- Гостю они отдают ноль строк (memberships, profiles, courts, coaches
-- закрыты правилами доступа) — ровно поэтому функция и SECURITY DEFINER:
-- считает внутри, наружу отдаёт только пять чисел.
--
-- Определение — КОПИЯ боевого из sql/функции/public-club-stats.sql.
-- ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: расходиться этим двум базам нечем,
-- иначе беда родится ровно на шве. Правишь там — правь и здесь.

CREATE OR REPLACE FUNCTION public.get_club_stats()
RETURNS TABLE (
    members      integer,   -- действующие членства
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
    SELECT
        (SELECT count(*)::integer FROM memberships
          WHERE status = 'active' AND expires_at >= CURRENT_DATE),
        (SELECT count(*)::integer FROM profiles),
        -- Турниры до 2025 года в базе не заведены: сообщество старше сайта.
        -- Архивную часть прибавляет уже сама страница, здесь только живой счёт
        (SELECT count(*)::integer FROM tournaments
          WHERE status = 'completed' AND date_start >= DATE '2025-01-01'),
        (SELECT count(*)::integer FROM courts),
        (SELECT count(*)::integer FROM coaches);
$$;

COMMENT ON FUNCTION public.get_club_stats() IS
    'Пять чисел для счётчиков на главной. Отдаёт только итоги, строки с личными данными наружу не уходят.';

REVOKE ALL ON FUNCTION public.get_club_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_stats() TO anon, authenticated;

-- ============================================================
-- ПРОВЕРКА. Отдельным запросом — РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ,
-- а не ответом «Success». Прогнать ПОСЛЕ создания, вывод прислать.
-- ============================================================

SELECT 'функция на месте'        AS что, count(*)::text AS значение
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_club_stats'
UNION ALL
SELECT 'права у anon',  has_function_privilege('anon',          'public.get_club_stats()', 'EXECUTE')::text
UNION ALL
SELECT 'права у auth',  has_function_privilege('authenticated', 'public.get_club_stats()', 'EXECUTE')::text
UNION ALL
SELECT 'что отдаёт',    (SELECT members || ' · ' || users || ' · ' || tournaments || ' · ' ||
                                courts  || ' · ' || coaches FROM public.get_club_stats());
