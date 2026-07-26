-- Reset test-ig-singles-12: delete playoff/IG matches, keep group stage only
-- Run in Supabase SQL Editor

-- 1. Delete all non-group matches (playoff + IG)
DELETE FROM matches
WHERE tournament_id = 'test-ig-singles-12'
  AND group_number IS NULL;

-- 2. Clear ig_meta
UPDATE tournaments
SET ig_meta = NULL
WHERE id = 'test-ig-singles-12';

-- Verify: only group matches remain
SELECT round, group_number, status, score
FROM matches
WHERE tournament_id = 'test-ig-singles-12'
ORDER BY group_number, round_number, match_order;
