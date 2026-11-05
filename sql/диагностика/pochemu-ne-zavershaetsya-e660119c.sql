-- ПОЧЕМУ «ЗАВЕРШИТЬ ТУРНИР» ПОГАШЕНА. Только чтение, только `e660119c`.
--
-- Кнопка гаснет, пока не закрыты ВСЕ матчи турнира: закрытым считается
-- `completed` или `cancelled` (`js/admin/sections/bracket.js:5534`), и
-- проверяются три слоя сразу — группы, отборочный круг `IG` и сетка с
-- лигами (`:5540`).
--
-- Первый запрос — сводка по кругам. Второй показывает ПОИМЁННО то, что
-- держит. Если второй вернёт пусто, держит не статус матча.
--
--   sql/диагностика/pochemu-ne-zavershaetsya-e660119c.sql

SELECT m.round,
       count(*)                                                  AS vsego,
       count(*) FILTER (WHERE m.status = 'completed')            AS zakryto,
       count(*) FILTER (WHERE m.status = 'cancelled')            AS otmeneno,
       count(*) FILTER (WHERE m.status NOT IN ('completed','cancelled')) AS derzhit,
       string_agg(DISTINCT m.status, ', ')                       AS statusy
  FROM public.matches m
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
 GROUP BY m.round
 ORDER BY m.round;
