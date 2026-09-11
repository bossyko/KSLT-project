-- ============================================
-- View Counters: Courts, Coaches, Players
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add view_count columns
ALTER TABLE courts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. RPC: increment court view count
CREATE OR REPLACE FUNCTION increment_court_view(p_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE courts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION increment_court_view(TEXT) TO anon, authenticated;

-- 3. RPC: increment coach view count
CREATE OR REPLACE FUNCTION increment_coach_view(p_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE coaches SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION increment_coach_view(TEXT) TO anon, authenticated;

-- 4. RPC: increment player view count
CREATE OR REPLACE FUNCTION increment_player_view(p_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE players SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION increment_player_view(TEXT) TO anon, authenticated;
