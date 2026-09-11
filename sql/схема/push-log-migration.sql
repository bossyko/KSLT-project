-- Push Log Migration
-- Stores history of admin push notifications sent via send-push Edge Function.

CREATE TABLE IF NOT EXISTS push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'system',
  audience TEXT,
  recipients_count INT DEFAULT 0,
  fcm_sent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all push logs
CREATE POLICY "Admins can read push_log"
  ON push_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert (Edge Functions)
CREATE POLICY "Service can insert push_log"
  ON push_log FOR INSERT
  WITH CHECK (true);
