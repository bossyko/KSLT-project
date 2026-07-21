-- Reset Summer Breeze Cup: fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a
-- Удалить матчи
DELETE FROM matches WHERE tournament_id = 'fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a';

-- Удалить результаты турнира
DELETE FROM tournament_results WHERE tournament_id = 'fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a';

-- Вернуть регистрации: draw → approved
UPDATE tournament_registrations
SET status = 'approved'
WHERE tournament_id = 'fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a'
  AND status = 'draw';

-- Сбросить статус турнира
UPDATE tournaments
SET status = 'registration_closed'
WHERE id = 'fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a';
