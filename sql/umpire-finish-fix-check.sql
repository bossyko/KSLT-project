-- ============================================================
-- Проверка завершения матча судьёй — только чтение
-- ============================================================
--
-- Запускать до и после umpire-finish-fix.sql. Ничего не меняет.

-- 1. Живые матчи и их состояние.
--    Матч, который судья завершил, но база не приняла, выглядит так:
--    статус live, победитель пуст, счёт пуст.
SELECT id,
       player1_name              AS игрок1,
       player2_name              AS игрок2,
       status                    AS состояние,
       winner_player             AS победитель,
       final_score               AS счёт,
       completed_at              AS завершён,
       (player1_id IS NULL)      AS первый_гость,
       (player2_id IS NULL)      AS второй_гость
  FROM live_matches
 ORDER BY created_at DESC
 LIMIT 10;

-- 2. Заведена ли запись о встрече для завершённых матчей.
--    Пусто у завершённого — значит вставка не прошла; сам матч при этом
--    после правки всё равно сохраняется.
SELECT lm.id                     AS матч,
       lm.player1_name           AS игрок1,
       lm.player2_name           AS игрок2,
       lm.status                 AS состояние,
       c.id                      AS запись_о_встрече,
       c.status                  AS её_состояние
  FROM live_matches lm
  LEFT JOIN challenges c ON c.live_match_id = lm.id
 ORDER BY lm.created_at DESC
 LIMIT 10;

-- 3. Проверка, на которой всё падало.
--    Правило: сторона — либо игрок клуба, либо гость по имени.
SELECT conname AS правило, pg_get_constraintdef(oid) AS условие
  FROM pg_constraint
 WHERE conrelid = 'public.challenges'::regclass
   AND conname = 'challenges_side_filled';

-- 4. Довести застрявший матч до конца, не переигрывая его на корте.
--    Подставить номер матча из запроса 1 и снять комментарий.
--    Счёт взять с судейской страницы.
--
-- UPDATE live_matches
--    SET status = 'completed',
--        winner_player = 1,
--        final_score = '6/0 6/1',
--        completed_at = now()
--  WHERE id = 'сюда-номер-матча';
