-- ============================================================
-- Микст FUTURES: кто числится дважды — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Триггер «один игрок — одна пара» останавливает сброс,
-- значит кто-то стоит сразу в двух живых заявках: своей и чужой.
--
-- Показываем всех, кто встречается больше одного раза, и сами заявки.

WITH стороны AS (
    SELECT r.id, r.status, r.player_id AS человек, 'капитан'::text AS роль,
           r.player_id AS кто_подал, r.partner_id AS напарник
      FROM public.tournament_registrations r
     WHERE r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND r.player_id IS NOT NULL
       AND r.status NOT IN ('withdrawn', 'rejected')
    UNION ALL
    SELECT r.id, r.status, r.partner_id, 'напарник',
           r.player_id, r.partner_id
      FROM public.tournament_registrations r
     WHERE r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND r.partner_id IS NOT NULL
       AND r.status NOT IN ('withdrawn', 'rejected')
),
дважды AS (
    SELECT человек
      FROM стороны
     GROUP BY человек
    HAVING count(*) > 1
)
SELECT p.name                                   AS человек,
       с.роль,
       с.status                                 AS статус_заявки,
       COALESCE(pk.name, '—') || ' + ' || COALESCE(pn.name, '—') AS заявка,
       с.id                                     AS id_заявки
  FROM стороны с
  JOIN дважды д ON д.человек = с.человек
  JOIN public.players p  ON p.id = с.человек
  LEFT JOIN public.players pk ON pk.id = с.кто_подал
  LEFT JOIN public.players pn ON pn.id = с.напарник
 ORDER BY p.name, с.роль;
