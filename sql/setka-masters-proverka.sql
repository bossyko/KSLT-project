-- ============================================================
-- Что за каша в группах: смотрим сами матчи
-- ============================================================
--
-- Только читает. Турнир — «Дружеский турнир в мужском парном разряде Masters».
-- В таблице групп пары повторяются в двух группах сразу, а в группе А их семь
-- вместо четырёх. Проверяем две версии: старые матчи не удалились при
-- пересоздании (тогда будет две партии по времени создания), либо жеребьёвка
-- разложила по группам игроков, а не пары.

-- 1. Сколько матчей в каждой группе и когда они заведены
SELECT m.group_number AS группа,
       count(*)       AS матчей,
       min(m.created_at) AS первый_заведён,
       max(m.created_at) AS последний_заведён
  FROM public.matches m
 WHERE m.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
 GROUP BY m.group_number
 ORDER BY 1;
-- Если в группе 6 матчей и время создания одно — жеребьёвка одна.
-- Если 12 и два разных времени — старые матчи остались.

-- 2. Кто в какой группе стоит: по каждой стороне матча — чья это заявка
SELECT m.group_number AS группа,
       count(DISTINCT m.player1_id) FILTER (WHERE m.player1_id IS NOT NULL)
         + count(DISTINCT m.player2_id) FILTER (WHERE m.player2_id IS NOT NULL) AS сторон_с_повторами,
       string_agg(DISTINCT p.name, ', ' ORDER BY p.name) AS кто_стоит_в_матчах
  FROM public.matches m
  LEFT JOIN public.players p ON p.id IN (m.player1_id, m.player2_id)
 WHERE m.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
 GROUP BY m.group_number
 ORDER BY 1;
-- Ждём по 4 разных человека на группу — это первые номера четырёх пар.
-- Если их 7-8 и среди них видны напарники (Кошойбеков и Серко сразу), значит
-- жеребьёвка разнесла по группам игроков, а не пары.

-- 3. Заявки: у кого какая группа проставлена
SELECT r.group_number AS группа, count(*) AS заявок,
       string_agg(COALESCE(p1.name, r.external_name) || ' / ' ||
                  COALESCE(p2.name, r.partner_external_name, '—'), '; ') AS пары
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
 GROUP BY r.group_number
 ORDER BY 1;
-- Ждём: группы 1, 2, 3 по четыре пары.
