-- ============================================
-- KSLT — Loyalty Program Migration
-- Tables: loyalty_rules, loyalty_rewards, loyalty_transactions
-- RPC: get_loyalty_balance
-- RLS + pg_cron expiry
-- ============================================

-- 1. loyalty_rules — configurable earn rules
CREATE TABLE IF NOT EXISTS loyalty_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT UNIQUE NOT NULL,
    points INT NOT NULL DEFAULT 0,
    label TEXT,
    label_en TEXT,
    active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO loyalty_rules (action, points, label, label_en) VALUES
    ('tournament', 100, 'Участие в турнире', 'Tournament participation'),
    ('court', 20, 'Бронирование корта', 'Court booking'),
    ('coach', 50, 'Занятие с тренером', 'Coach session'),
    ('membership', 100, 'Оплата членства', 'Membership payment'),
    ('first_membership', 200, 'Приветственный бонус', 'Welcome bonus')
ON CONFLICT (action) DO NOTHING;

-- 2. loyalty_rewards — redeemable rewards
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT,
    cost INT NOT NULL,
    active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO loyalty_rewards (code, title, title_en, cost) VALUES
    ('free_tournament', 'Участие в турнире', 'Tournament entry', 500),
    ('free_membership_1m', 'Членство 1 месяц', '1 month membership', 300)
ON CONFLICT (code) DO NOTHING;

-- 3. loyalty_transactions — earn/redeem/expire/admin_adjust history
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'admin_adjust')),
    points INT NOT NULL,
    action TEXT,
    source_id TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_loyalty_profile ON loyalty_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_expires ON loyalty_transactions(expires_at) WHERE type = 'earn';

-- 4. RPC: get_loyalty_balance
CREATE OR REPLACE FUNCTION get_loyalty_balance(p_profile_id UUID)
RETURNS INT AS $$
    SELECT COALESCE(
        SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) -
        SUM(CASE WHEN type IN ('redeem', 'expire') THEN points ELSE 0 END) -
        SUM(CASE WHEN type = 'admin_adjust' AND points < 0 THEN ABS(points) ELSE 0 END) +
        SUM(CASE WHEN type = 'admin_adjust' AND points > 0 THEN points ELSE 0 END),
    0)
    FROM loyalty_transactions
    WHERE profile_id = p_profile_id;
$$ LANGUAGE sql STABLE;

-- 5. RLS

ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Staff: full CRUD on all 3 tables
CREATE POLICY loyalty_rules_staff_all ON loyalty_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY loyalty_rewards_staff_all ON loyalty_rewards
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

CREATE POLICY loyalty_transactions_staff_all ON loyalty_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- Users: SELECT active rules
CREATE POLICY loyalty_rules_user_read ON loyalty_rules
    FOR SELECT USING (active = true);

-- Users: SELECT active rewards
CREATE POLICY loyalty_rewards_user_read ON loyalty_rewards
    FOR SELECT USING (active = true);

-- Users: SELECT own transactions
CREATE POLICY loyalty_transactions_user_read ON loyalty_transactions
    FOR SELECT USING (profile_id = auth.uid());

-- Users: INSERT own redeem transactions
CREATE POLICY loyalty_transactions_user_redeem ON loyalty_transactions
    FOR INSERT WITH CHECK (
        profile_id = auth.uid() AND type = 'redeem'
    );

-- 6. pg_cron: auto-expire loyalty points older than 12 months (daily at 05:00 UTC)
SELECT cron.schedule('expire-loyalty-points', '0 5 * * *', $$
    INSERT INTO loyalty_transactions (profile_id, type, points, action, note, source_id)
    SELECT profile_id, 'expire', points, 'expiry',
           'Автосгорание баллов старше 12 мес',
           id::text
    FROM loyalty_transactions
    WHERE type = 'earn'
      AND expires_at <= NOW()
      AND NOT EXISTS (
          SELECT 1 FROM loyalty_transactions t2
          WHERE t2.source_id = loyalty_transactions.id::text
            AND t2.type = 'expire'
      );
$$);
