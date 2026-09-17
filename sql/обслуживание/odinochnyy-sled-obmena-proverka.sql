-- ============================================================
-- Одиночный FUTURES: след обмена — ПРОВЕРКА
-- ============================================================
--
-- Только читает, один запрос — редактор Supabase показывает результат
-- последнего, и в сборном файле эта проверка терялась.
--
-- Ищем по всему турниру то, на чём спотыкались раньше:
--
--   в двух группах     — человек попал сразу в две;
--   пара дважды        — встреча заведена не один раз;
--   пустая сторона     — в матче нет соперника;
--   состав разошёлся   — в матче один человек, а в его заявке другой;
--   запуск без времени — матч выпал из расписания.
--
-- Пусто — следа нет.

WITH участники AS (
    SELECT DISTINCT m.group_number, m.player1_id AS игрок
      FROM public.matches m
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL AND m.player1_id IS NOT NULL
    UNION
    SELECT DISTINCT m.group_number, m.player2_id
      FROM public.matches m
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL AND m.player2_id IS NOT NULL
),
две_группы AS (
    SELECT 'в двух группах'::text AS беда,
           p.name                 AS кто,
           string_agg(у.group_number::text, ', ' ORDER BY у.group_number) AS где
      FROM участники у
      JOIN public.players p ON p.id = у.игрок
     GROUP BY p.name, у.игрок
    HAVING count(*) > 1
),
пара_дважды AS (
    SELECT 'пара дважды'::text AS беда,
           COALESCE(p1.name, '—') || ' — ' || COALESCE(p2.name, '—') AS кто,
           'группа ' || m.group_number || ', записей ' || count(*)     AS где
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = LEAST(m.player1_id, m.player2_id)
      LEFT JOIN public.players p2 ON p2.id = GREATEST(m.player1_id, m.player2_id)
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL
       AND m.player1_id IS NOT NULL AND m.player2_id IS NOT NULL
     GROUP BY m.group_number, LEAST(m.player1_id, m.player2_id),
              GREATEST(m.player1_id, m.player2_id), p1.name, p2.name
    HAVING count(*) > 1
),
пустая_сторона AS (
    SELECT 'пустая сторона'::text AS беда,
           COALESCE(p1.name, '—') || '  vs  ' || COALESCE(p2.name, '—') AS кто,
           'группа ' || m.group_number || ', встреча ' || m.match_order  AS где
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = m.player1_id
      LEFT JOIN public.players p2 ON p2.id = m.player2_id
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL
       AND (m.player1_id IS NULL OR m.player2_id IS NULL)
),
состав_разошёлся AS (
    SELECT 'состав разошёлся'::text AS беда,
           COALESCE(pm.name, '—') || ' вместо ' || COALESCE(pz.name, '—') AS кто,
           'группа ' || m.group_number || ', встреча ' || m.match_order   AS где
      FROM public.matches m
      JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
      LEFT JOIN public.players pm ON pm.id = m.player1_id
      LEFT JOIN public.players pz ON pz.id = r1.player_id
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL
       AND m.player1_id IS DISTINCT FROM r1.player_id
    UNION ALL
    SELECT 'состав разошёлся',
           COALESCE(pm.name, '—') || ' вместо ' || COALESCE(pz.name, '—'),
           'группа ' || m.group_number || ', встреча ' || m.match_order
      FROM public.matches m
      JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
      LEFT JOIN public.players pm ON pm.id = m.player2_id
      LEFT JOIN public.players pz ON pz.id = r2.player_id
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL
       AND m.player2_id IS DISTINCT FROM r2.player_id
),
без_времени AS (
    SELECT 'запуск без времени'::text AS беда,
           COALESCE(p1.name, '—') || '  vs  ' || COALESCE(p2.name, '—') AS кто,
           'группа ' || m.group_number || ', встреча ' || m.match_order  AS где
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = m.player1_id
      LEFT JOIN public.players p2 ON p2.id = m.player2_id
     WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
       AND m.group_number IS NOT NULL
       AND m.scheduled_time IS NULL
)
SELECT * FROM две_группы
UNION ALL SELECT * FROM пара_дважды
UNION ALL SELECT * FROM пустая_сторона
UNION ALL SELECT * FROM состав_разошёлся
UNION ALL SELECT * FROM без_времени
 ORDER BY беда, кто;
