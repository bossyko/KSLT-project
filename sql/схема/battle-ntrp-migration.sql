-- Battle NTRP / Country / Category — per-challenge overrides
-- Allows storing NTRP rating, country, and category directly on the challenge
-- (useful for guest players who are not KSLT members with full player profiles)

-- 1. Add columns to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_ntrp NUMERIC(4,2);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_ntrp NUMERIC(4,2);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_country TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_country TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_category TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_category TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS set_format TEXT DEFAULT 'standard';

-- 2. Update get_battle_public RPC — add new fields + player-level fallbacks
CREATE OR REPLACE FUNCTION get_battle_public(p_challenge_id UUID)
RETURNS JSON AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.counter_date, c.counter_time, c.counter_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               -- Challenge-level overrides
               c.challenger_ntrp, c.opponent_ntrp,
               c.challenger_country, c.opponent_country,
               c.challenger_category, c.opponent_category,
               c.set_format,
               -- Player data
               p1.name AS challenger_name, p1.name_en AS challenger_name_en, p1.name_kg AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               p2.name AS opponent_name, p2.name_en AS opponent_name_en, p2.name_kg AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               -- Court map links
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        JOIN players p1 ON p1.id = c.challenger_player_id
        JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
