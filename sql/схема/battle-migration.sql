-- ============================================================
-- Battle System Migration
-- Challenge Battles: public page, voting, TG integration
-- ============================================================

-- 1. ALTER challenges — battle fields
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS battle_title TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS battle_published BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS battle_published_at TIMESTAMPTZ;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS voting_closed BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS banner_url TEXT;

CREATE INDEX IF NOT EXISTS idx_challenges_battle ON challenges(battle_published) WHERE battle_published = true;

-- 1b. RLS: everyone (including anon) can read published battles
DROP POLICY IF EXISTS challenges_public_battles ON challenges;
CREATE POLICY challenges_public_battles ON challenges
    FOR SELECT USING (battle_published = true);

-- 2. Predictions table (voting)
CREATE TABLE IF NOT EXISTS challenge_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    voter_type TEXT NOT NULL CHECK (voter_type IN ('site', 'telegram')),
    voter_id TEXT NOT NULL,
    predicted_winner_id TEXT NOT NULL REFERENCES players(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, voter_type, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_challenge ON challenge_predictions(challenge_id);

-- 3. RLS for challenge_predictions
ALTER TABLE challenge_predictions ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated: read all predictions
DROP POLICY IF EXISTS "predictions_select_all" ON challenge_predictions;
CREATE POLICY "predictions_select_all" ON challenge_predictions
    FOR SELECT USING (true);

-- Authenticated: insert own vote (site)
DROP POLICY IF EXISTS "predictions_insert_auth" ON challenge_predictions;
CREATE POLICY "predictions_insert_auth" ON challenge_predictions
    FOR INSERT TO authenticated
    WITH CHECK (voter_type = 'site' AND voter_id = auth.uid()::TEXT);

-- Authenticated: update own vote (site)
DROP POLICY IF EXISTS "predictions_update_auth" ON challenge_predictions;
CREATE POLICY "predictions_update_auth" ON challenge_predictions
    FOR UPDATE TO authenticated
    USING (voter_type = 'site' AND voter_id = auth.uid()::TEXT)
    WITH CHECK (voter_type = 'site' AND voter_id = auth.uid()::TEXT);

-- Staff: full CRUD
DROP POLICY IF EXISTS "predictions_staff_all" ON challenge_predictions;
CREATE POLICY "predictions_staff_all" ON challenge_predictions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- Service role (Edge Functions for TG votes) bypasses RLS automatically

-- 4. RPC: get battle votes
CREATE OR REPLACE FUNCTION get_battle_votes(p_challenge_id UUID)
RETURNS TABLE(player_id TEXT, votes BIGINT) AS $$
    SELECT predicted_winner_id AS player_id, COUNT(*) AS votes
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
    GROUP BY predicted_winner_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. RPC: public battle data (no auth required)
CREATE OR REPLACE FUNCTION get_battle_public(p_challenge_id UUID)
RETURNS JSON AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.counter_date, c.counter_time, c.counter_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               p1.name AS challenger_name, p1.name_en AS challenger_name_en, p1.name_kg AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p2.name AS opponent_name, p2.name_en AS opponent_name_en, p2.name_kg AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points
        FROM challenges c
        JOIN players p1 ON p1.id = c.challenger_player_id
        JOIN players p2 ON p2.id = c.opponent_player_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Grant RPC access to anon
GRANT EXECUTE ON FUNCTION get_battle_public(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_battle_public(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_battle_votes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_battle_votes(UUID) TO authenticated;

-- 7. Match type: tournament (default) or duel (challenge battle)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'tournament';

-- 8. Score draft for interrupted matches
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS score_draft TEXT;
