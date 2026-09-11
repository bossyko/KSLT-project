-- Обновить RPC get_public_partners — добавить play_level
DROP FUNCTION IF EXISTS get_public_partners();
CREATE OR REPLACE FUNCTION get_public_partners()
RETURNS TABLE (
    id TEXT, full_name TEXT, avatar_url TEXT, gender TEXT,
    last_seen TIMESTAMPTZ, category_name TEXT, category_name_en TEXT,
    has_telegram BOOLEAN, play_level TEXT
) AS $$
    SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
        CASE WHEN c.gender = 'men' THEN 'male' ELSE 'female' END,
        pr.last_seen, c.name, c.name_en,
        (pr.telegram_chat_id IS NOT NULL) AS has_telegram,
        pr.play_level
    FROM players pl
    LEFT JOIN categories c ON pl.category_id = c.id
    LEFT JOIN profiles pr ON pr.player_id = pl.id
    WHERE pl.name IS NOT NULL AND pl.name != ''
    ORDER BY pr.last_seen DESC NULLS LAST;
$$ LANGUAGE sql SECURITY DEFINER;
