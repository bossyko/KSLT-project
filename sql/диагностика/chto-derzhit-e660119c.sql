-- ЧТО ИМЕННО ДЕРЖИТ ЗАВЕРШЕНИЕ — ПОИМЁННО. Только чтение, только `e660119c`.
--   sql/диагностика/chto-derzhit-e660119c.sql

SELECT m.round || ' #' || COALESCE(m.match_order, 0) AS krug,
       COALESCE(m.group_number::text, '—')           AS gruppa,
       COALESCE(m.slot1_label, '')                   AS m1,
       COALESCE(m.slot2_label, '')                   AS m2,
       COALESCE(m.player1_id, '—')                   AS igrok_1,
       COALESCE(m.player2_id, '—')                   AS igrok_2,
       COALESCE(m.score, '')                         AS schet,
       m.status
  FROM public.matches m
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND m.status NOT IN ('completed', 'cancelled')
 ORDER BY m.round, m.match_order;
