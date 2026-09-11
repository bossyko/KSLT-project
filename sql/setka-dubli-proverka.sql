-- ============================================================
-- Двойные матчи: есть ли они где-то ещё
-- ============================================================
--
-- Только читает. На дружеском Futures жеребьёвка отработала дважды подряд, и
-- в турнире оказались две раскладки разом: 36 матчей вместо 18, а пары стояли
-- сразу в двух группах. То же самое было на Masters.
--
-- Прежде чем ставить запрет на уровне базы, смотрим, нет ли таких же следов в
-- других турнирах и не помешает ли запрет прошлым сеткам.

-- 1. Турниры, где в одной клетке сетки больше одного матча
SELECT t.title AS турнир,
       m.group_number AS группа,
       m.round        AS круг,
       m.round_number AS номер_круга,
       m.match_order  AS место,
       count(*)       AS матчей
  FROM public.matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
 GROUP BY t.title, m.group_number, m.round, m.round_number, m.match_order
HAVING count(*) > 1
 ORDER BY count(*) DESC, t.title
 LIMIT 50;
-- Пусто — значит запрет можно ставить смело.

-- 2. Турниры, где один участник попал в две группы разом
SELECT t.title AS турнир,
       p.name  AS участник,
       count(DISTINCT m.group_number) AS групп
  FROM public.matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
  JOIN public.players p ON p.id IN (m.player1_id, m.player2_id)
 WHERE m.group_number IS NOT NULL
 GROUP BY t.title, p.name
HAVING count(DISTINCT m.group_number) > 1
 ORDER BY t.title, p.name
 LIMIT 50;

-- 3. Сколько матчей и когда заведены — по дружеским турнирам
SELECT t.title AS турнир,
       count(*) AS матчей,
       count(DISTINCT date_trunc('second', m.created_at)) AS заходов,
       min(m.created_at) AS первый,
       max(m.created_at) AS последний
  FROM public.matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
 WHERE m.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                           '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
 GROUP BY t.title;
