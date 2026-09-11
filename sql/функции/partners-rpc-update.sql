-- ============================================
-- KSLT — Updated Partners RPC
-- Source: players table (150 records)
-- If player has linked profile → show last_seen, avatar
-- Gender: profile.gender (male/female) → category.gender (men/women) → NULL
-- ============================================

CREATE OR REPLACE FUNCTION get_public_partners()
RETURNS TABLE (
    id TEXT,
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT,
    last_seen TIMESTAMPTZ,
    category_name TEXT,
    category_name_en TEXT
) AS $$
    SELECT
        pl.id,
        pl.name AS full_name,
        COALESCE(pr.avatar_url, pl.photo) AS avatar_url,
        COALESCE(
            pr.gender,
            CASE c.gender WHEN 'men' THEN 'male' WHEN 'women' THEN 'female' ELSE NULL END
        ) AS gender,
        pr.last_seen,
        c.name AS category_name,
        c.name_en AS category_name_en
    FROM players pl
    LEFT JOIN categories c ON pl.category_id = c.id
    LEFT JOIN profiles pr ON pr.player_id = pl.id
    WHERE pl.name IS NOT NULL AND pl.name != ''
    ORDER BY pr.last_seen DESC NULLS LAST;
$$ LANGUAGE sql SECURITY DEFINER;
