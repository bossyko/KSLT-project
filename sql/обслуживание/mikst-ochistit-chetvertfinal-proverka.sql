-- ============================================================
-- Микст FUTURES: первый круг и четвертьфинал рядом — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Показывает пары четвертьфинала и обе встречи первого
-- круга, которые их наполняют.
--
-- Правильно так: в клетке стоит победитель своей встречи, а если встреча
-- не сыграна — прочерк. Имени при несыгранной встрече быть не должно.

SELECT 'QF-' || qf.match_order                          AS клетка,
       COALESCE(a.name, '—') || '  vs  ' || COALESCE(b.name, '—') AS в_четвертьфинале,
       'R1-' || р1.match_order || ': ' || р1.status ||
           COALESCE(' (' || р1.score || ')', '')        AS откуда_первый,
       'R1-' || р2.match_order || ': ' || р2.status ||
           COALESCE(' (' || р2.score || ')', '')        AS откуда_второй,
       CASE WHEN (qf.player1_id IS NOT NULL AND р1.status <> 'completed')
              OR (qf.player2_id IS NOT NULL AND р2.status <> 'completed')
            THEN 'стоит, хотя встреча не сыграна' ELSE '' END AS замечание
  FROM public.matches qf
  LEFT JOIN public.players a ON a.id = qf.player1_id
  LEFT JOIN public.players b ON b.id = qf.player2_id
  JOIN public.matches р1 ON р1.tournament_id = qf.tournament_id
       AND р1.group_number IS NULL AND р1.round = 'R1'
       AND р1.match_order = qf.match_order * 2 - 1
  JOIN public.matches р2 ON р2.tournament_id = qf.tournament_id
       AND р2.group_number IS NULL AND р2.round = 'R1'
       AND р2.match_order = qf.match_order * 2
 WHERE qf.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND qf.group_number IS NULL
   AND qf.round = 'QF'
 ORDER BY qf.match_order;
