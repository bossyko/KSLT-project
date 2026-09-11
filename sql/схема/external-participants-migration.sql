-- ============================================
-- External Participants + Debt Label Migration
-- ============================================

-- Allow external participants (no account) in tournament registrations
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS external_name TEXT;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS external_country TEXT;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS external_ntrp NUMERIC;

-- Make player_id nullable for external participants
ALTER TABLE tournament_registrations ALTER COLUMN player_id DROP NOT NULL;

-- Drop old unique constraint and add new one that allows external participants
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_tournament_id_player_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS tournament_registrations_tournament_player_unique
  ON tournament_registrations (tournament_id, player_id) WHERE player_id IS NOT NULL;
