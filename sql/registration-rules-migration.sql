-- ============================================
-- KSLT — Правила допуска на турнир
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- 1. Статус blocked — заявка не прошла правила допуска.
--    Запись всё равно сохраняется: админу нужна статистика,
--    сколько человек хотело попасть на турнир.
--
-- 2. Статус draw — проставляется при жеребьёвке (bracket.js:3980, 6947).
--    Код его пишет уже давно, а ограничение не разрешает,
--    поэтому обновление молча падало и заявка оставалась без группы и посева.

ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_status_check;

ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'waitlist', 'blocked', 'draw'));

-- 3. Причина блокировки — показывается админу в разделе «Заблокированные заявки»
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- 4. Индекс под выборку заблокированных по турниру
CREATE INDEX IF NOT EXISTS idx_registrations_blocked
  ON tournament_registrations(tournament_id) WHERE status = 'blocked';

-- 5. Проверка
SELECT status, count(*) AS заявок
FROM tournament_registrations
GROUP BY status
ORDER BY 2 DESC;
