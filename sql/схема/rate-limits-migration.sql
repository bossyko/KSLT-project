-- ============================================
-- KSLT — Rate Limits (server-side rate limiting)
-- ============================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_key TEXT NOT NULL,
  action TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by key + time
CREATE INDEX idx_rate_limits_key_time ON rate_limits (limit_key, created_at DESC);

-- Auto-cleanup: delete records older than 24 hours (pg_cron)
-- SELECT cron.schedule('cleanup-rate-limits', '0 */6 * * *', $$DELETE FROM rate_limits WHERE created_at < now() - interval '24 hours'$$);

-- RLS: only service role can access (Edge Function uses service role)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies = no access from client, only service_role bypasses RLS
