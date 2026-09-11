-- ============================================================
-- KSLT: Live Match + Live Score — Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Table: live_matches
CREATE TABLE IF NOT EXISTS live_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    player1_id TEXT REFERENCES players(id),
    player2_id TEXT REFERENCES players(id),
    player1_name TEXT,
    player2_name TEXT,
    best_of INT NOT NULL DEFAULT 3 CHECK (best_of IN (1, 3, 5)),
    youtube_url TEXT,
    umpire_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    serving_player INT DEFAULT 1 CHECK (serving_player IN (1, 2)),
    points_p1 TEXT DEFAULT '0',
    points_p2 TEXT DEFAULT '0',
    current_set INT DEFAULT 1,
    sets_data JSONB DEFAULT '[]'::jsonb,
    current_game_p1 INT DEFAULT 0,
    current_game_p2 INT DEFAULT 0,
    is_tiebreak BOOLEAN DEFAULT false,
    tiebreak_p1 INT DEFAULT 0,
    tiebreak_p2 INT DEFAULT 0,
    status TEXT DEFAULT 'warmup' CHECK (status IN ('warmup', 'live', 'paused', 'completed')),
    winner_player INT CHECK (winner_player IN (1, 2)),
    final_score TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    tournament_label TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Index for umpire key lookups
CREATE INDEX IF NOT EXISTS idx_live_matches_umpire_key ON live_matches(umpire_key);

-- Index for status filtering (active matches on main page)
CREATE INDEX IF NOT EXISTS idx_live_matches_status ON live_matches(status);

-- 2. RLS
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "live_matches_public_read"
    ON live_matches FOR SELECT
    TO public
    USING (true);

-- Staff (admin/manager) full CRUD
CREATE POLICY "live_matches_staff_insert"
    ON live_matches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "live_matches_staff_update"
    ON live_matches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY "live_matches_staff_delete"
    ON live_matches FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- 3. RPC: umpire_save_state (anon access via umpire_key)
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

    RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

-- Allow anon to call umpire_save_state
GRANT EXECUTE ON FUNCTION umpire_save_state(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION umpire_save_state(TEXT, JSONB) TO authenticated;

-- 4. RPC: get_live_by_umpire_key
CREATE OR REPLACE FUNCTION get_live_by_umpire_key(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match RECORD;
    v_p1 RECORD;
    v_p2 RECORD;
BEGIN
    SELECT * INTO v_match FROM live_matches WHERE umpire_key = p_key;
    IF v_match IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Not found');
    END IF;

    -- Get player info
    SELECT id, name, name_en, photo INTO v_p1 FROM players WHERE id = v_match.player1_id;
    SELECT id, name, name_en, photo INTO v_p2 FROM players WHERE id = v_match.player2_id;

    RETURN jsonb_build_object(
        'ok', true,
        'match', jsonb_build_object(
            'id', v_match.id,
            'match_id', v_match.match_id,
            'best_of', v_match.best_of,
            'youtube_url', v_match.youtube_url,
            'serving_player', v_match.serving_player,
            'points_p1', v_match.points_p1,
            'points_p2', v_match.points_p2,
            'current_set', v_match.current_set,
            'sets_data', v_match.sets_data,
            'current_game_p1', v_match.current_game_p1,
            'current_game_p2', v_match.current_game_p2,
            'is_tiebreak', v_match.is_tiebreak,
            'tiebreak_p1', v_match.tiebreak_p1,
            'tiebreak_p2', v_match.tiebreak_p2,
            'status', v_match.status,
            'winner_player', v_match.winner_player,
            'final_score', v_match.final_score,
            'history', v_match.history,
            'tournament_label', v_match.tournament_label,
            'player1_name', COALESCE(v_match.player1_name, v_p1.name),
            'player2_name', COALESCE(v_match.player2_name, v_p2.name),
            'player1_name_en', v_p1.name_en,
            'player2_name_en', v_p2.name_en,
            'player1_photo', v_p1.photo,
            'player2_photo', v_p2.photo
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_live_by_umpire_key(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_live_by_umpire_key(TEXT) TO authenticated;

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE live_matches;
