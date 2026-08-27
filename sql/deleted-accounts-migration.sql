-- ============================================
-- Deleted Accounts Tracking
-- ============================================

-- 1. Table to log deleted profiles
CREATE TABLE IF NOT EXISTS deleted_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    phone TEXT,
    telegram_chat_id TEXT,
    player_id TEXT,
    had_membership BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_date ON deleted_accounts(deleted_at);

-- 2. Trigger function: copy profile data before DELETE
CREATE OR REPLACE FUNCTION log_deleted_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_has_mem BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM memberships WHERE profile_id = OLD.id AND status = 'active'
    ) INTO v_has_mem;

    INSERT INTO deleted_accounts (profile_id, full_name, email, role, phone, telegram_chat_id, player_id, had_membership)
    VALUES (OLD.id, OLD.full_name, OLD.email, OLD.role, OLD.phone, OLD.telegram_chat_id, OLD.player_id, v_has_mem);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger on profiles BEFORE DELETE
DROP TRIGGER IF EXISTS trg_log_deleted_profile ON profiles;
CREATE TRIGGER trg_log_deleted_profile
    BEFORE DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_deleted_profile();

-- 4. RLS: staff can read
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deleted_accounts_staff_read" ON deleted_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );
