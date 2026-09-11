-- Push Notifications Migration
-- FCM token field on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Drop old table if exists (from failed migration)
DROP TABLE IF EXISTS notification_log CASCADE;

-- Notification log table (for bell history)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_profile ON notification_log(profile_id, is_read, created_at DESC);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own notifications"
  ON notification_log FOR UPDATE
  USING (auth.uid() = profile_id);

-- Allow service_role / Edge Functions to insert
CREATE POLICY "Service can insert notifications"
  ON notification_log FOR INSERT
  WITH CHECK (true);
