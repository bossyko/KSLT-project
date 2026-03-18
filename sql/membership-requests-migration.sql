-- ============================================
-- KSLT — Membership Requests (Telegram Bot Flow)
-- ============================================
-- Run in Supabase SQL Editor.
-- Table for membership application state machine:
-- select_period → select_category → pending_receipt → pending_approval → approved/rejected

-- 1. Table membership_requests
CREATE TABLE IF NOT EXISTS membership_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'select_period'
        CHECK (status IN ('select_period','select_category','pending_receipt','pending_approval','approved','rejected')),
    months INT,
    amount DECIMAL(10,2),
    category_id TEXT,
    receipt_file_id TEXT,
    manager_message_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_requests_profile ON membership_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);

-- 2. RLS
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- User sees own requests
CREATE POLICY "membership_requests_own_read" ON membership_requests
    FOR SELECT USING (profile_id = auth.uid());

-- User can insert own requests
CREATE POLICY "membership_requests_own_insert" ON membership_requests
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- User can update own requests (for status transitions via bot)
CREATE POLICY "membership_requests_own_update" ON membership_requests
    FOR UPDATE USING (profile_id = auth.uid());

-- Staff can read all
CREATE POLICY "membership_requests_staff_read" ON membership_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Staff can update all (approve/reject)
CREATE POLICY "membership_requests_staff_update" ON membership_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Service role bypass (Edge Functions use service role key)
-- No policy needed — service role bypasses RLS
