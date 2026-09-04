-- ============================================================
-- Проверка продвижения по сетке — только чтение
-- ============================================================
--
-- Запускать до и после bracket-advance-on-server.sql. Ничего не меняет.

-- 1. Функция и триггер на месте.
SELECT p.proname AS функция,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS доступна
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname IN ('advance_bracket_winner', 'trg_advance_bracket');

SELECT tgname AS триггер, tgenabled AS включён
  FROM pg_trigger
 WHERE tgrelid = 'public.matches'::regclass AND NOT tgisinternal
 ORDER BY tgname;

-- 2. Сетка турнира целиком: где сыграно, где ещё пусто.
--    Подставить номер турнира.
--
-- SELECT round AS круг, round_number AS номер, match_order AS порядок,
--        player1_id AS игрок1, player2_id AS игрок2,
--        winner_id AS победитель, score AS счёт, group_number AS группа
--   FROM matches
--  WHERE tournament_id = 'сюда-номер-турнира'
--  ORDER BY round_number, match_order;

-- 3. Незаполненные места там, где предыдущий круг уже сыгран.
--    После правки таких строк быть не должно: победитель садится сам.
SELECT t.title                      AS турнир,
       m.round                      AS круг,
       m.round_number               AS номер,
       m.match_order                AS порядок,
       (m.player1_id IS NULL)       AS пусто_сверху,
       (m.player2_id IS NULL)       AS пусто_снизу
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
 WHERE m.group_number IS NULL
   AND m.round IS DISTINCT FROM 'IG'
   AND m.round_number > 1
   AND (m.player1_id IS NULL OR m.player2_id IS NULL)
   AND EXISTS (
       SELECT 1 FROM matches pr
        WHERE pr.tournament_id = m.tournament_id
          AND pr.round_number = m.round_number - 1
          AND pr.winner_id IS NOT NULL
   )
 ORDER BY t.title, m.round_number, m.match_order;

-- 4. Прогнать вручную по одному матчу, не меняя счёт.
--    Вернёт, куда сел победитель. Повторный запуск безопасен: пишет то же
--    самое в то же место.
--
-- SELECT public.advance_bracket_winner('сюда-номер-матча');
