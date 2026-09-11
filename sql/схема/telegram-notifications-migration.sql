-- ============================================
-- KSLT — Telegram Notifications Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Column for Telegram chat_id in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- 2. Notification log (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'expiry_7d'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(membership_id, type)
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read notifications" ON notification_log
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Service insert notifications" ON notification_log
  FOR INSERT WITH CHECK (true);
