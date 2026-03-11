-- ============================================
-- KSLT — Tournament Telegram Notification
-- ============================================
-- Run in Supabase SQL Editor.

-- 1. Add notified_at column
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ============================================
-- 2. pg_cron job (OPTIONAL — run separately)
-- ============================================
-- First enable pg_cron: Supabase Dashboard → Database → Extensions → search "pg_cron" → Enable
-- Then run the block below:
--
SELECT cron.schedule(
  'tournament-registration-notify',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/tournament-notify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
