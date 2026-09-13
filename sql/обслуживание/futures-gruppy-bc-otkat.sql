-- ============================================================
-- Futures: возвращаем группы B и C как было до правки
-- ============================================================
--
-- Правка futures-gruppy-bc-pravka.sql поменяла первого участника в двух
-- пустых матчах. Этого делать не следовало: состав матчей в идущем
-- турнире не трогаем. Возвращаем прежних игроков.
--
--   Группа B, третий матч: Эрбол   → Шавкат   (соперник Азат)
--   Группа C, третий матч: Алымбек → Бексултан (соперник Салман)
--
-- Счёт в эти записи никто не вписывал — обе пустые, состояние upcoming.
-- Поэтому откат ничего не теряет. Условия ниже это ещё раз проверяют:
-- если счёт появился, строка не изменится.
--
-- Возможность вписать счёт вернётся не через базу, а через админку:
-- клетка без матча теперь тоже открывается, и матч заводится в момент
-- сохранения счёта.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Группа B: первым снова Шавкат Михманов ----

UPDATE public.matches
   SET player1_id = 'shavkat-mihmanov'
 WHERE id = 'b8e6a748-887f-4b3d-8d40-e063f587733c'
   AND tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND group_number = 2
   AND player1_id = 'erbol-kylychev'
   AND player2_id = 'azat-bazarkulov'
   AND score IS NULL;

-- ---- Группа C: первым снова Бексултан Рустамов ----

UPDATE public.matches
   SET player1_id = 'beksultan-rustamov'
 WHERE id = 'c50c761f-07f0-4985-b2f7-aeb0749cf2af'
   AND tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND group_number = 3
   AND player1_id = 'alymbek-orokov'
   AND player2_id = 'salman-beyshenaliev'
   AND score IS NULL;

COMMIT;

-- ---- Проверка ----

SELECT CASE m.group_number WHEN 2 THEN 'B' WHEN 3 THEN 'C' END AS группа,
       m.round_number AS круг,
       p1.name        AS первый,
       p2.name        AS второй,
       m.status       AS состояние,
       COALESCE(m.score, '—') AS счёт
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IN (2, 3)
 ORDER BY m.group_number, m.match_order;

-- Ожидаем — как было изначально:
--   B: Азат — Шавкат (6/0), Эрбол — Шавкат (6/0), Шавкат — Азат (пусто)
--   C: Салман — Бексултан (6/1), Алымбек — Бексултан (6/0), Бексултан — Салман (пусто)
--
-- Сыгранных матчей 11 — как и было.
