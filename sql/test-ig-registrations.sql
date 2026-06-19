-- 13 женских регистраций для турнира "Стыковые матчи" (тест межгрупповых матчей)
-- 4 группы, 13 игроков → 4+3+3+3

DELETE FROM matches
WHERE tournament_id = '3f7b399d-550e-4945-a070-54ec5a082934';

DELETE FROM tournament_registrations
WHERE tournament_id = '3f7b399d-550e-4945-a070-54ec5a082934';

WITH female_players AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) AS rn
  FROM players
  WHERE category_id = 'women-tour'
  LIMIT 13
)
INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number, registered_at)
SELECT
  '3f7b399d-550e-4945-a070-54ec5a082934',
  id,
  'approved',
  NULL,
  '2026-06-19 10:00:00+06'::timestamptz + (interval '1 minute' * (rn - 1) * 5)
FROM female_players;
