-- Reset tournament 087ec8e5-4d15-4043-b0f8-41441d62067c
-- Delete matches
DELETE FROM matches WHERE tournament_id = '087ec8e5-4d15-4043-b0f8-41441d62067c';

-- Delete tournament results
DELETE FROM tournament_results WHERE tournament_id = '087ec8e5-4d15-4043-b0f8-41441d62067c';

-- Reset registrations: draw → approved
UPDATE tournament_registrations
SET status = 'approved'
WHERE tournament_id = '087ec8e5-4d15-4043-b0f8-41441d62067c'
  AND status = 'draw';

-- Reset tournament status
UPDATE tournaments
SET status = 'registration_open'
WHERE id = '087ec8e5-4d15-4043-b0f8-41441d62067c';
