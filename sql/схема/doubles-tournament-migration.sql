-- ============================================
-- DOUBLES TOURNAMENT MIGRATION
-- Adds partner fields, doubles_points, and uniqueness trigger
-- ============================================

-- tournament_registrations: partner fields
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS partner_id TEXT REFERENCES players(id);
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS partner_external_name TEXT;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS partner_external_ntrp NUMERIC;
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS partner_gender TEXT;

-- players: doubles rating points
ALTER TABLE players ADD COLUMN IF NOT EXISTS doubles_points INT DEFAULT 0;

-- tournament_results: doubles marker + partner
ALTER TABLE tournament_results ADD COLUMN IF NOT EXISTS is_doubles BOOLEAN DEFAULT false;
ALTER TABLE tournament_results ADD COLUMN IF NOT EXISTS partner_id TEXT REFERENCES players(id);

-- rating_history: doubles marker
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS is_doubles BOOLEAN DEFAULT false;

-- ============================================
-- Trigger: prevent duplicate partner usage in same tournament
-- A player cannot appear as both captain and partner, or in 2 different pairs
-- ============================================

CREATE OR REPLACE FUNCTION check_doubles_unique() RETURNS TRIGGER AS $$
BEGIN
  -- If this registration has a partner_id (KSLT player as partner)
  IF NEW.partner_id IS NOT NULL THEN
    -- Partner must not be registered as captain in the same tournament
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND player_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Partner already registered as captain in this tournament';
    END IF;

    -- Partner must not be listed as partner in another registration
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Partner already in another team in this tournament';
    END IF;
  END IF;

  -- Captain must not be listed as partner in another registration
  IF NEW.player_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.player_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Player already registered as partner in another team';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trg_check_doubles_unique ON tournament_registrations;
CREATE TRIGGER trg_check_doubles_unique
  BEFORE INSERT OR UPDATE ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION check_doubles_unique();
