-- ============================================================
-- КСЛТ в цифрах — числа, видимые всем
-- ============================================================
--
-- На главной пять счётчиков: члены клуба, зарегистрированные, турниры,
-- теннисные центры, тренеры. Гостю из них видны только два.
--
-- Причина: memberships, profiles и coaches закрыты правилами доступа — и
-- правильно закрыты, там личные данные. Но счётчик просит не данные, а
-- число. Гость получает ноль, и карточка прячется. То есть каждый, кто
-- заходит на сайт впервые — а это почти все, — видит клуб вдвое меньше,
-- чем он есть.
--
-- Функция отдаёт только пять чисел. Ни одной строки с личными данными
-- наружу не уходит: SECURITY DEFINER считает их внутри, а возвращает
-- итог.
--
-- Файл меняет базу. Читающие запросы — в public-club-stats-check.sql.

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
