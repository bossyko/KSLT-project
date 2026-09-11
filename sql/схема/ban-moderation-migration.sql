-- ============================================
-- KSLT — Ban & Moderation Migration
-- ============================================
-- Adds ban fields to profiles table.
-- banned_until = NULL → not banned
-- banned_until in future → temp ban
-- banned_until = '2099-12-31' → permanent ban

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;

-- RLS: admin already has update access via admin_update_all_profiles policy
-- No additional policies needed
