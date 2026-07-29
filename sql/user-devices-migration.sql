-- ============================================
-- KSLT — User Devices (new device login detection)
-- ============================================

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_hash TEXT NOT NULL,
  user_agent TEXT,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, device_hash)
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own devices" ON user_devices FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users insert own devices" ON user_devices FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own devices" ON user_devices FOR UPDATE USING (auth.uid() = profile_id);
