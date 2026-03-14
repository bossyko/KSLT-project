-- ============================================
-- KSLT — Challenge Board Migration
-- Выставочные (нерейтинговые) матчи
-- ============================================

-- 0. Drop if re-running
DROP FUNCTION IF EXISTS get_my_challenges();
DO $$ BEGIN PERFORM cron.unschedule('expire-challenges'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP TABLE IF EXISTS challenges CASCADE;

-- 1. Create challenges table
CREATE TABLE challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID REFERENCES profiles(id) NOT NULL,
    challenger_player_id TEXT REFERENCES players(id) NOT NULL,
    opponent_player_id TEXT REFERENCES players(id) NOT NULL,
    opponent_profile_id UUID REFERENCES profiles(id),
    -- Proposal
    proposed_date DATE NOT NULL,
    proposed_time TEXT NOT NULL,
    proposed_venue TEXT,
    proposed_court_id TEXT REFERENCES courts(id),
    message TEXT CHECK (char_length(message) <= 150),
    -- Counter-proposal
    counter_date DATE,
    counter_time TEXT,
    counter_venue TEXT,
    counter_court_id TEXT REFERENCES courts(id),
    counter_step TEXT CHECK (counter_step IN ('date','time','venue',NULL)),
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active','negotiating','countered','accepted','declined','expired','completed'
    )),
    match_id UUID REFERENCES matches(id),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '72 hours'),
    accepted_at TIMESTAMPTZ,
    countered_at TIMESTAMPTZ
);

-- 2. Indexes
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_opponent ON challenges(opponent_profile_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_expires ON challenges(expires_at) WHERE status IN ('active','negotiating','countered');

-- 3. RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Challenger can read own challenges
CREATE POLICY challenges_challenger_read ON challenges
    FOR SELECT USING (challenger_id = auth.uid());

-- Opponent can read challenges addressed to them
CREATE POLICY challenges_opponent_read ON challenges
    FOR SELECT USING (opponent_profile_id = auth.uid());

-- Staff full access
CREATE POLICY challenges_staff_all ON challenges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','manager')
        )
    );

-- Authenticated users can insert (challenger = self)
CREATE POLICY challenges_insert ON challenges
    FOR INSERT WITH CHECK (challenger_id = auth.uid());

-- 4. RPC: get_my_challenges()
CREATE OR REPLACE FUNCTION get_my_challenges()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(row_to_json(t)) INTO result
    FROM (
        SELECT
            c.id,
            c.status,
            c.proposed_date,
            c.proposed_time,
            c.proposed_venue,
            c.counter_date,
            c.counter_time,
            c.counter_venue,
            c.message,
            c.created_at,
            c.expires_at,
            c.accepted_at,
            c.countered_at,
            c.match_id,
            -- Direction
            CASE
                WHEN c.challenger_id = auth.uid() THEN 'sent'
                ELSE 'received'
            END AS direction,
            -- Challenger info
            c.challenger_player_id,
            cp.full_name AS challenger_name,
            cp.avatar_url AS challenger_avatar,
            -- Opponent info
            c.opponent_player_id,
            op.full_name AS opponent_name,
            op.avatar_url AS opponent_avatar,
            -- Court info
            ct.name AS court_name,
            cct.name AS counter_court_name,
            -- Match score (if completed)
            m.score AS match_score,
            m.winner_id AS match_winner_id
        FROM challenges c
        LEFT JOIN profiles cp ON cp.id = c.challenger_id
        LEFT JOIN profiles op ON op.id = c.opponent_profile_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        LEFT JOIN courts cct ON cct.id = c.counter_court_id
        LEFT JOIN matches m ON m.id = c.match_id
        WHERE c.challenger_id = auth.uid()
           OR c.opponent_profile_id = auth.uid()
        ORDER BY c.created_at DESC
        LIMIT 50
    ) t;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. pg_cron: expire stale challenges every hour
-- Run in Supabase SQL Editor (requires pg_cron extension)
SELECT cron.schedule(
    'expire-challenges',
    '0 * * * *',
    $$UPDATE challenges SET status = 'expired' WHERE status IN ('active','negotiating','countered') AND expires_at < now()$$
);
