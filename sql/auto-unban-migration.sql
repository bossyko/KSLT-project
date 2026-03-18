-- ============================================
-- KSLT — Auto-Unban pg_cron Job
-- ============================================
-- Run in Supabase SQL Editor.
-- Requires pg_cron and pg_net extensions (enable in Dashboard → Database → Extensions).
--
-- Runs daily at 06:00 UTC — calls auto-unban Edge Function
-- to clear expired player bans and send Telegram notifications.

SELECT cron.schedule(
  'auto-unban-expired',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/auto-unban',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
