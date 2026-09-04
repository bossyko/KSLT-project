-- ============================================================
-- Проверка записи счёта игроками — только чтение
-- ============================================================
--
-- Запускать до и после match-score-by-players.sql. Ничего не меняет.

-- 1. Легли ли столбцы. Ждём семь строк.
SELECT column_name AS столбец, data_type AS тип
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'matches'
   AND column_name LIKE 'score_%'
 ORDER BY column_name;

-- 2. Матчи, ожидающие счёта или подтверждения.
--    Сразу после выкладки список пуст: игроки ещё ничего не вписывали.
SELECT m.id,
       t.title                    AS турнир,
       p1.name                    AS игрок1,
       p2.name                    AS игрок2,
       m.score                    AS счёт,
       m.score_status             AS состояние,
       m.score_submitted_at       AS вписан,
       m.score_confirmed_at       AS подтверждён,
       pr.full_name               AS вписал
  FROM matches m
  LEFT JOIN tournaments t ON t.id = m.tournament_id
  LEFT JOIN players p1 ON p1.id = m.player1_id
  LEFT JOIN players p2 ON p2.id = m.player2_id
  LEFT JOIN profiles pr ON pr.id = m.score_submitted_by
 WHERE m.score_status IS NOT NULL
 ORDER BY m.score_submitted_at DESC NULLS LAST;

-- 3. Заведена ли часовая проверка на просроченные подтверждения.
SELECT jobname, schedule, active FROM cron.job
 WHERE jobname = 'accept-stale-match-scores';

-- 4. Функции на месте и доступны вошедшим.
SELECT p.proname                          AS функция,
       pg_get_function_identity_arguments(p.oid) AS аргументы,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS доступна_игроку
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('match_side_of', 'submit_match_score',
                     'confirm_match_score', 'dispute_match_score',
                     'accept_stale_match_scores')
 ORDER BY функция;

-- 5. Разбор счёта — проверить на живом матче, не меняя базу.
--    Подставить свой номер матча; функция вернёт ошибку «not_a_player»,
--    если запускать не от имени участника, и это правильно.
--
-- SELECT public.submit_match_score('сюда-номер-матча', '6/3 6/4');
