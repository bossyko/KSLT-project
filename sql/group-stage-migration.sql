    -- ============================================
    -- Group Stage Migration
    -- Adds group_count to tournaments, group_number to matches & registrations
    -- ============================================

    -- Number of groups for round-robin tournaments
    ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS group_count INT;

    -- Which group a match belongs to (1..N)
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS group_number INT;

    -- Which group a player was drawn into
    ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS group_number INT;

    -- How many players qualify from each group into playoff
    ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS qualifiers_per_group INT DEFAULT 2;

    -- Index for faster group queries
    CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(group_number);
