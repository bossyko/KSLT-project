-- ============================================================
-- Одиночный FUTURES: обмен Эрена и Санжара — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Ожидаем после обмена:
--   группа D — Санжар Эргешалиев во встречах 1, 4, 6;
--   группа G — Эрен Камчибеков во встречах 2, 4, 5;
--   время и корты прежние, счёта нет;
--   состав матчей совпадает с заявками.

SELECT CASE m.group_number WHEN 4 THEN 'D' WHEN 7 THEN 'G' END AS группа,
       m.match_order                                            AS встреча,
       m.scheduled_time                                         AS время,
       COALESCE(m.court::text, '—')                                   AS корт,
       COALESCE(p1.name, '—') || '  vs  ' || COALESCE(p2.name, '—') AS пара,
       COALESCE(m.score, '—')                                   AS счёт,
       CASE WHEN m.player1_id IS DISTINCT FROM r1.player_id
              OR m.player2_id IS DISTINCT FROM r2.player_id
            THEN 'состав разошёлся с заявкой' ELSE '' END       AS замечание
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
  LEFT JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
  LEFT JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
 WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND m.group_number IN (4, 7)
 ORDER BY m.group_number, m.match_order;

-- Заявки: у Эрена должна стоять группа 7, у Санжара 4
SELECT p.name AS игрок, r.group_number AS группа, r.status AS состояние
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND r.player_id IN ('eren-kamchibekov', 'sanzhar-ergeshaliev');

-- ---- След обмена: то, на чём спотыкались раньше ----
--
-- Пусто во всех строках — обмен прошёл без следа. Проверяем весь турнир,
-- а не только две группы: перепутанный состав всплывал и в соседних.

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

-- Число встреч в каждой группе: при 4 участниках их 6, при 3 — три
SELECT m.group_number                        AS группа,
       count(*)                              AS встреч,
       count(DISTINCT m.player1_id) + 0      AS справочно_первых,
       count(*) FILTER (WHERE m.status = 'completed') AS сыграно
  FROM public.matches m
 WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND m.group_number IS NOT NULL
 GROUP BY m.group_number
 ORDER BY m.group_number;
