-- ============================================
-- KSLT — Tournament Reminder (3 days + 1 day)
-- ============================================
-- Adds deduplication columns + pg_cron job for automatic reminders.
-- Run in Supabase SQL Editor.

-- 1. Deduplication columns
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reminded_3d_at TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reminded_1d_at TIMESTAMPTZ;

-- 2. pg_cron job: daily at 02:00 UTC (08:00 Bishkek)
SELECT cron.schedule(
  'tournament-reminder-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/tournament-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
