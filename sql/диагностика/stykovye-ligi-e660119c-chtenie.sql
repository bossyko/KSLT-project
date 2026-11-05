-- ЧТЕНИЕ ПЕРЕД ПРАВКОЙ: что сейчас стоит в стыковых лигах этого турнира.
--
-- ЗАПРОС НИЧЕГО НЕ МЕНЯЕТ. Только читает, и только ОДИН турнир —
-- `e660119c`, как сказано: другие работают как работают.
--
-- Одна таблица тремя разделами, чтобы прогон был один: редактор Supabase
-- показывает только последний запрос.
--
--   sql/диагностика/stykovye-ligi-e660119c-chtenie.sql

WITH тур AS (
  SELECT * FROM public.tournaments
   WHERE id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
),
пары AS (
  SELECT r.id,
         r.group_number,
         r.status,
         r.seed_number,
         COALESCE(p.name,  r.external_name)              AS игрок,
         COALESCE(pp.name, r.partner_external_name)      AS напарник
    FROM public.tournament_registrations r
    LEFT JOIN public.players p  ON p.id  = r.player_id
    LEFT JOIN public.players pp ON pp.id = r.partner_id
   WHERE r.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
),
матчи AS (
  SELECT m.*,
         COALESCE(p1.name,  r1.external_name)         AS и1,
         COALESCE(pp1.name, r1.partner_external_name) AS н1,
         COALESCE(p2.name,  r2.external_name)         AS и2,
         COALESCE(pp2.name, r2.partner_external_name) AS н2
    FROM public.matches m
    LEFT JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
    LEFT JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
    LEFT JOIN public.players p1  ON p1.id  = r1.player_id
    LEFT JOIN public.players pp1 ON pp1.id = r1.partner_id
    LEFT JOIN public.players p2  ON p2.id  = r2.player_id
    LEFT JOIN public.players pp2 ON pp2.id = r2.partner_id
   WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
)

-- 1. ТУРНИР ОДНОЙ СТРОКОЙ
SELECT 1 AS раздел, 0 AS порядок,
       'ТУРНИР'                                           AS ключ,
       t.title                                            AS слот1,
       t.bracket_type || ' · групп ' || COALESCE(t.group_count,0)
         || ' · выходит ' || COALESCE(t.qualifiers_per_group,2)
         || ' · сетка ' || COALESCE(t.draw_size,0)         AS слот2,
       t.format || ' · ' || t.status                      AS состояние,
       'заявок одобрено: ' ||
         (SELECT count(*) FROM пары WHERE status = 'approved') ||
       ' · с группой: ' ||
         (SELECT count(*) FROM пары WHERE group_number IS NOT NULL) ||
       ' · групповых матчей: ' ||
         (SELECT count(*) FROM матчи WHERE round LIKE 'G%') ||
       ' · из них со счётом: ' ||
         (SELECT count(*) FROM матчи WHERE round LIKE 'G%' AND score IS NOT NULL)
                                                          AS примечание
  FROM тур t

UNION ALL
-- 2. ЗАЯВКИ ПО ГРУППАМ
SELECT 2, ROW_NUMBER() OVER (ORDER BY group_number NULLS LAST, игрок),
       'ГР ' || COALESCE(group_number::text, '—'),
       игрок || ' и ' || COALESCE(напарник, '?'),
       LEFT(id::text, 8),
       status,
       CASE WHEN seed_number IS NULL THEN '' ELSE 'посев ' || seed_number END
  FROM пары

UNION ALL
-- 3. СЕТКИ ЛИГ: ЧТО УЖЕ СТОИТ
SELECT 3, ROW_NUMBER() OVER (ORDER BY round, match_order),
       round || ' #' || match_order,
       COALESCE(slot1_label, '—') || ' = ' ||
         COALESCE(и1 || ' и ' || COALESCE(н1, '?'), 'ПУСТО'),
       COALESCE(slot2_label, '—') || ' = ' ||
         COALESCE(и2 || ' и ' || COALESCE(н2, '?'), 'ПУСТО'),
       status,
       COALESCE(score, '')
  FROM матчи
 WHERE round LIKE 'PL%' OR round LIKE 'CL%'

 ORDER BY 1, 2;
