-- ============================================================
-- Микст FUTURES, группа D — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Показывает все встречи группы: кто по заявкам, кто в
-- игроках, какой счёт. Состав и заявки должны совпадать, встреч должно
-- быть шесть, каждая пара — по одному разу.

SELECT m.match_order                                   AS nn,
       COALESCE(p1.name, '—') || ' vs ' || COALESCE(p2.name, '—') AS в_игроках,
       COALESCE(з1.name, '—') || ' vs ' || COALESCE(з2.name, '—') AS по_заявкам,
       m.score                                         AS счёт,
       CASE WHEN m.player1_id IS DISTINCT FROM r1.player_id
              OR m.player2_id IS DISTINCT FROM r2.player_id
            THEN 'состав разошёлся' ELSE '' END        AS замечание
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
  LEFT JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
  LEFT JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
  LEFT JOIN public.players з1 ON з1.id = r1.player_id
  LEFT JOIN public.players з2 ON з2.id = r2.player_id
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number  = 4
 ORDER BY m.match_order;
