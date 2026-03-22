-- ============================================================
-- KSLT: Auto-record completed free live matches as challenges
-- Run in Supabase SQL Editor AFTER live-match-migration.sql
-- ============================================================

-- 1. Add live_match_id to challenges for deduplication
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS live_match_id UUID REFERENCES live_matches(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_live_match ON challenges(live_match_id) WHERE live_match_id IS NOT NULL;

-- 2. Make challenger_id nullable (auto-created live challenges may not have profiles)
ALTER TABLE challenges ALTER COLUMN challenger_id DROP NOT NULL;

-- 3. Update umpire_save_state — auto-insert challenge on completion
CREATE OR REPLACE FUNCTION umpire_save_state(
    p_key TEXT,
    p_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_live RECORD;
    v_prof1_id UUID;
    v_prof2_id UUID;
    v_score TEXT;
BEGIN
    SELECT id INTO v_id FROM live_matches WHERE umpire_key = p_key;
    IF v_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Invalid umpire key');
    END IF;

    UPDATE live_matches SET
        serving_player = COALESCE((p_state->>'serving_player')::int, serving_player),
        points_p1 = COALESCE(p_state->>'points_p1', points_p1),
        points_p2 = COALESCE(p_state->>'points_p2', points_p2),
        current_set = COALESCE((p_state->>'current_set')::int, current_set),
        sets_data = COALESCE(p_state->'sets_data', sets_data),
        current_game_p1 = COALESCE((p_state->>'current_game_p1')::int, current_game_p1),
        current_game_p2 = COALESCE((p_state->>'current_game_p2')::int, current_game_p2),
        is_tiebreak = COALESCE((p_state->>'is_tiebreak')::boolean, is_tiebreak),
        tiebreak_p1 = COALESCE((p_state->>'tiebreak_p1')::int, tiebreak_p1),
        tiebreak_p2 = COALESCE((p_state->>'tiebreak_p2')::int, tiebreak_p2),
        status = COALESCE(p_state->>'status', status),
        winner_player = (p_state->>'winner_player')::int,
        final_score = p_state->>'final_score',
        history = COALESCE(p_state->'history', history),
        started_at = CASE
            WHEN p_state->>'status' = 'live' AND started_at IS NULL THEN now()
            ELSE started_at
        END,
        completed_at = CASE
            WHEN p_state->>'status' = 'completed' THEN now()
            ELSE completed_at
        END
    WHERE id = v_id;

    -- Auto-record free live matches as challenges
    IF p_state->>'status' = 'completed' THEN
        SELECT match_id, player1_id, player2_id, final_score
        INTO v_live
        FROM live_matches WHERE id = v_id;

        v_score := COALESCE(p_state->>'final_score', v_live.final_score);

        -- Only for free matches (no tournament link) with at least one known player
        IF v_live.match_id IS NULL
           AND (v_live.player1_id IS NOT NULL OR v_live.player2_id IS NOT NULL)
           AND NOT EXISTS (SELECT 1 FROM challenges WHERE live_match_id = v_id)
        THEN
            -- Look up profile IDs (may be NULL if player has no account)
            SELECT p.id INTO v_prof1_id FROM profiles p WHERE p.player_id = v_live.player1_id LIMIT 1;
            SELECT p.id INTO v_prof2_id FROM profiles p WHERE p.player_id = v_live.player2_id LIMIT 1;

            INSERT INTO challenges (
                challenger_id,
                challenger_player_id,
                opponent_player_id,
                opponent_profile_id,
                proposed_date,
                proposed_time,
                status,
                score_draft,
                live_match_id,
                created_at,
                expires_at,
                accepted_at
            ) VALUES (
                v_prof1_id,           -- nullable now
                v_live.player1_id,
                v_live.player2_id,
                v_prof2_id,           -- nullable
                CURRENT_DATE,
                to_char(now() AT TIME ZONE 'Asia/Bishkek', 'HH24:MI'),
                'completed',
                v_score,
                v_id,
                now(),
                now() + interval '72 hours',
                now()
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

-- 4. Update get_player_challenges — fallback to score_draft
CREATE OR REPLACE FUNCTION get_player_challenges(p_player_id TEXT)
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
            c.created_at,
            c.accepted_at,
            -- Challenger info (fallback to live_matches player1_name)
            c.challenger_player_id,
            COALESCE(cp.name, lm.player1_name) AS challenger_name,
            COALESCE(cp.name_en, lm.player1_name) AS challenger_name_en,
            COALESCE(cp.name_kg, lm.player1_name) AS challenger_name_kg,
            cp.photo AS challenger_photo,
            -- Opponent info (fallback to live_matches player2_name)
            c.opponent_player_id,
            COALESCE(op.name, lm.player2_name) AS opponent_name,
            COALESCE(op.name_en, lm.player2_name) AS opponent_name_en,
            COALESCE(op.name_kg, lm.player2_name) AS opponent_name_kg,
            op.photo AS opponent_photo,
            -- Court info
            ct.name AS court_name,
            cct.name AS counter_court_name,
            -- Match score: from matches table or score_draft (live matches)
            COALESCE(m.score, c.score_draft) AS match_score,
            m.winner_id AS match_winner_id
        FROM challenges c
        LEFT JOIN players cp ON cp.id = c.challenger_player_id
        LEFT JOIN players op ON op.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        LEFT JOIN courts cct ON cct.id = c.counter_court_id
        LEFT JOIN matches m ON m.id = c.match_id
        LEFT JOIN live_matches lm ON lm.id = c.live_match_id
        WHERE (c.challenger_player_id = p_player_id OR c.opponent_player_id = p_player_id)
          AND c.status IN ('accepted', 'completed')
        ORDER BY c.created_at DESC
        LIMIT 25
    ) t;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. Update get_my_challenges — fallback to score_draft
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
            -- Match score: from matches table or score_draft (live matches)
            COALESCE(m.score, c.score_draft) AS match_score,
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

-- 6. RLS: allow public read of completed challenges (for H2H)
DROP POLICY IF EXISTS challenges_completed_read ON challenges;
CREATE POLICY challenges_completed_read ON challenges
    FOR SELECT TO authenticated
    USING (status = 'completed');

-- 7. Backfill: create challenges for EXISTING completed free live matches
INSERT INTO challenges (
    challenger_id,
    challenger_player_id,
    opponent_player_id,
    opponent_profile_id,
    proposed_date,
    proposed_time,
    status,
    score_draft,
    live_match_id,
    created_at,
    expires_at,
    accepted_at
)
SELECT
    pr1.id,                                     -- challenger_id (nullable)
    lm.player1_id,                              -- challenger_player_id
    lm.player2_id,                              -- opponent_player_id
    pr2.id,                                     -- opponent_profile_id (nullable)
    COALESCE(lm.completed_at::date, CURRENT_DATE),
    COALESCE(to_char(lm.completed_at AT TIME ZONE 'Asia/Bishkek', 'HH24:MI'), '12:00'),
    'completed',
    lm.final_score,
    lm.id,                                      -- live_match_id
    COALESCE(lm.completed_at, now()),
    COALESCE(lm.completed_at, now()) + interval '72 hours',
    COALESCE(lm.completed_at, now())
FROM live_matches lm
LEFT JOIN profiles pr1 ON pr1.player_id = lm.player1_id
LEFT JOIN profiles pr2 ON pr2.player_id = lm.player2_id
WHERE lm.status = 'completed'
  AND lm.match_id IS NULL
  AND lm.player1_id IS NOT NULL
  AND lm.player2_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM challenges c WHERE c.live_match_id = lm.id);
