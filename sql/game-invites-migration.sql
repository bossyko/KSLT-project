-- ============================================
-- KSLT — Game Invites Migration
-- Этап 2: "Предложить игру"
-- ============================================

-- 1. Таблица приглашений на игру
CREATE TABLE IF NOT EXISTS game_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    receiver_player_id TEXT NOT NULL,
    receiver_profile_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ
);

-- Индексы
CREATE INDEX idx_game_invites_sender ON game_invites(sender_id);
CREATE INDEX idx_game_invites_receiver ON game_invites(receiver_profile_id);
CREATE INDEX idx_game_invites_status ON game_invites(status);

-- 2. RLS
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sender_read" ON game_invites
    FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "receiver_read" ON game_invites
    FOR SELECT USING (receiver_profile_id = auth.uid());

-- 3. Обновить RPC get_public_partners — добавить has_telegram
DROP FUNCTION IF EXISTS get_public_partners();
CREATE OR REPLACE FUNCTION get_public_partners()
RETURNS TABLE (
    id TEXT, full_name TEXT, avatar_url TEXT, gender TEXT,
    last_seen TIMESTAMPTZ, category_name TEXT, category_name_en TEXT,
    has_telegram BOOLEAN
) AS $$
    SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
        CASE WHEN c.gender = 'men' THEN 'male' ELSE 'female' END,
        pr.last_seen, c.name, c.name_en,
        (pr.telegram_chat_id IS NOT NULL) AS has_telegram
    FROM players pl
    LEFT JOIN categories c ON pl.category_id = c.id
    LEFT JOIN profiles pr ON pr.player_id = pl.id
    WHERE pl.name IS NOT NULL AND pl.name != ''
    ORDER BY pr.last_seen DESC NULLS LAST;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. RPC для истории приглашений (dashboard)
CREATE OR REPLACE FUNCTION get_my_game_invites()
RETURNS TABLE (
    id UUID, status TEXT, created_at TIMESTAMPTZ, responded_at TIMESTAMPTZ,
    direction TEXT,
    partner_name TEXT, partner_avatar TEXT
) AS $$
    -- Отправленные
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'sent'::TEXT, pl.name, COALESCE(pr2.avatar_url, pl.photo)
    FROM game_invites gi
    JOIN players pl ON pl.id = gi.receiver_player_id
    LEFT JOIN profiles pr2 ON pr2.player_id = pl.id
    WHERE gi.sender_id = auth.uid()
    UNION ALL
    -- Полученные
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'received'::TEXT, pr_s.full_name, pr_s.avatar_url
    FROM game_invites gi
    JOIN profiles pr_s ON pr_s.id = gi.sender_id
    WHERE gi.receiver_profile_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 20;
$$ LANGUAGE sql SECURITY DEFINER;
