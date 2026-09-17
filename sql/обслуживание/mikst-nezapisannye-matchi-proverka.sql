-- ============================================================
-- Микст FUTURES: что ещё не записано — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Считает ровно так же, как счётчик под сеткой: матч с
-- двумя участниками, который не сыгран и не отменён.
--
-- Первым запросом — сам список, вторым — расхождения состава с заявками
-- (из-за них таблица группы выглядит доигранной, а счётчик считает иначе).

SELECT CASE WHEN m.group_number IS NOT NULL
            THEN 'группа ' || m.group_number
            ELSE m.round END || '-' || m.match_order      AS клетка,
       COALESCE(p1.name, '—') || '  vs  ' || COALESCE(p2.name, '—') AS пара,
       m.status                                            AS состояние
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.status NOT IN ('completed', 'cancelled')
   AND m.player1_id IS NOT NULL
   AND m.player2_id IS NOT NULL
 ORDER BY m.group_number NULLS LAST, m.round_number, m.match_order;

-- Состав против заявок: после правки строк быть не должно
SELECT CASE WHEN m.group_number IS NOT NULL
            THEN 'группа ' || m.group_number
            ELSE m.round END || '-' || m.match_order      AS клетка,
       COALESCE(pm1.name, '—')                            AS в_матче_первый,
       COALESCE(pz1.name, '—')                            AS по_заявке_первый,
       COALESCE(pm2.name, '—')                            AS в_матче_второй,
       COALESCE(pz2.name, '—')                            AS по_заявке_второй
  FROM public.matches m
  LEFT JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
  LEFT JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
  LEFT JOIN public.players pm1 ON pm1.id = m.player1_id
  LEFT JOIN public.players pz1 ON pz1.id = r1.player_id
  LEFT JOIN public.players pm2 ON pm2.id = m.player2_id
  LEFT JOIN public.players pz2 ON pz2.id = r2.player_id
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND ((m.reg1_id IS NOT NULL AND m.player1_id IS DISTINCT FROM r1.player_id)
     OR (m.reg2_id IS NOT NULL AND m.player2_id IS DISTINCT FROM r2.player_id))
 ORDER BY m.group_number NULLS LAST, m.round_number, m.match_order;
