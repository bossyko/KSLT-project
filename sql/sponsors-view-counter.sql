-- ============================================
-- Sponsor View Counter
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add view_count column to sponsors
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. RPC: increment sponsor view count
CREATE OR REPLACE FUNCTION increment_sponsor_view(p_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE sponsors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION increment_sponsor_view(UUID) TO anon, authenticated;
