-- ============================================
-- KSLT — Match Start Notification
-- ============================================
-- Run in Supabase SQL Editor.

-- 1. Add notified_at column to matches (deduplication)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ============================================
-- 2. pg_cron job: every 5 minutes
-- ============================================
-- First enable pg_cron: Supabase Dashboard → Database → Extensions → search "pg_cron" → Enable
-- Then run the block below:
--
SELECT cron.schedule(
  'match-start-notify',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/match-notify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
