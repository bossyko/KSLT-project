-- ============================================================
-- Проверка: порядок очереди по времени постановки
-- ============================================================
--
-- Запускать ПОСЛЕ `ochered-vremya-postanovki.sql`. Базу не меняет —
-- только читает и считает. Каждая проверка отвечает «ок» или «БЕДА».
--
-- Результат проверяется ЧТЕНИЕМ, а не ответом «Success»: этот файл и
-- есть чтение.

-- ── 1. Столбцы завелись, и queue_at считается базой ──────────────────
SELECT
    'столбцы' AS проверка,
    CASE WHEN count(*) FILTER (WHERE column_name = 'waitlisted_at') = 1
          AND count(*) FILTER (WHERE column_name = 'queue_at') = 1
         THEN 'ок' ELSE 'БЕДА: столбца нет' END AS итог,
    string_agg(column_name || ' ' || data_type ||
               CASE WHEN is_generated = 'ALWAYS' THEN ' (считает база)' ELSE '' END, ', ')
        AS подробно
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tournament_registrations'
  AND column_name IN ('waitlisted_at', 'queue_at', 'registered_at');

-- ── 2. queue_at именно генерируемый, а не обычный ────────────────────
--    Обычный столбец кто-нибудь однажды заполнит руками, и порядок
--    очереди снова станет мнением, а не правилом.
SELECT
    'queue_at считает база' AS проверка,
    CASE WHEN is_generated = 'ALWAYS' THEN 'ок' ELSE 'БЕДА: его можно записать руками' END AS итог,
    generation_expression AS выражение
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tournament_registrations'
  AND column_name = 'queue_at';

-- ── 3. Старые очереди не переставились ───────────────────────────────
--    У всех существующих заявок waitlisted_at пуст, значит queue_at
--    равен registered_at и нынешний порядок сохранён до байта.
SELECT
    'старый порядок цел' AS проверка,
    CASE WHEN count(*) = 0 THEN 'ок'
         ELSE 'БЕДА: у ' || count(*) || ' заявок queue_at разошёлся с registered_at' END AS итог
FROM public.tournament_registrations
WHERE waitlisted_at IS NULL
  AND queue_at IS DISTINCT FROM registered_at;

-- ── 4. Индекс на месте ───────────────────────────────────────────────
SELECT
    'индекс очереди' AS проверка,
    CASE WHEN count(*) = 1 THEN 'ок' ELSE 'БЕДА: индекса нет' END AS итог
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'tournament_registrations'
  AND indexname = 'tournament_registrations_queue_idx';

-- ── 5. Сколько заявок уже помечено временем постановки ───────────────
--    Сразу после прогона ожидается 0. Число растёт по мере того, как
--    менеджеры снимают людей с основы.
SELECT
    'помечено временем постановки' AS проверка,
    count(*) FILTER (WHERE waitlisted_at IS NOT NULL) AS с_отметкой,
    count(*) FILTER (WHERE status = 'waitlist') AS всего_в_очереди
FROM public.tournament_registrations;

-- ── 6. Живая очередь глазами: как её теперь видит подъём ─────────────
--    Для турнира с самой длинной очередью. Первая строка — тот, кто
--    займёт освободившееся место.
SELECT
    'очередь турнира ' || left(tournament_id::text, 8) AS проверка,
    row_number() OVER (ORDER BY queue_at) AS "№",
    left(coalesce(external_name, player_id::text), 24) AS кто,
    registered_at AS подал,
    waitlisted_at AS встал_в_очередь,
    queue_at AS порядок
FROM public.tournament_registrations
WHERE status = 'waitlist'
  AND seat_pool = 'online'
  AND tournament_id = (
      SELECT tournament_id FROM public.tournament_registrations
      WHERE status = 'waitlist' AND seat_pool = 'online'
      GROUP BY tournament_id ORDER BY count(*) DESC LIMIT 1
  )
ORDER BY queue_at;
