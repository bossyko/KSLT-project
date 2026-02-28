-- ============================================
-- KSLT — Partners Feature Migration
-- Adds columns to profiles + RPC function
-- ============================================

-- 1. Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_level TEXT CHECK (play_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'weekend'));

-- 2. RPC function for public partner list (bypasses RLS)
CREATE OR REPLACE FUNCTION get_public_partners()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT,
    last_seen TIMESTAMPTZ,
    play_level TEXT,
    preferred_time TEXT,
    category_name TEXT,
    category_name_en TEXT
) AS $$
    SELECT
        p.id, p.full_name, p.avatar_url, p.gender, p.last_seen,
        p.play_level, p.preferred_time,
        c.name AS category_name, c.name_en AS category_name_en
    FROM profiles p
    LEFT JOIN players pl ON p.player_id = pl.id
    LEFT JOIN categories c ON pl.category_id = c.id
    WHERE p.full_name IS NOT NULL AND p.full_name != ''
    ORDER BY p.last_seen DESC NULLS LAST;
$$ LANGUAGE sql SECURITY DEFINER;
