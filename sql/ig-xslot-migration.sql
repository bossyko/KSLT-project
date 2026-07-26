-- IG/X-slot system migration
-- Adds ig_meta JSONB column to tournaments for storing IG match metadata
-- (auto-pass players, IG match count, X-slot count)

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ig_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN tournaments.ig_meta IS 'IG match metadata: auto_pass_players, ig_match_count, x_slot_count';
