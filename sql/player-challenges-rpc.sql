-- ============================================
-- KSLT — Public Player Challenges RPC
-- SECURITY DEFINER bypasses RLS for public read
-- Only returns accepted/completed challenges
-- ============================================

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
            -- Challenger info
            c.challenger_player_id,
            cp.name AS challenger_name,
            cp.name_en AS challenger_name_en,
            cp.name_kg AS challenger_name_kg,
            cp.photo AS challenger_photo,
            -- Opponent info
            c.opponent_player_id,
            op.name AS opponent_name,
            op.name_en AS opponent_name_en,
            op.name_kg AS opponent_name_kg,
            op.photo AS opponent_photo,
            -- Court info
            ct.name AS court_name,
            cct.name AS counter_court_name,
            -- Match score (if completed)
            m.score AS match_score,
            m.winner_id AS match_winner_id
        FROM challenges c
        LEFT JOIN players cp ON cp.id = c.challenger_player_id
        LEFT JOIN players op ON op.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        LEFT JOIN courts cct ON cct.id = c.counter_court_id
        LEFT JOIN matches m ON m.id = c.match_id
        WHERE (c.challenger_player_id = p_player_id OR c.opponent_player_id = p_player_id)
          AND c.status IN ('accepted', 'completed')
        ORDER BY c.created_at DESC
        LIMIT 25
    ) t;

    RETURN COALESCE(result, '[]'::json);
END;
$$;
