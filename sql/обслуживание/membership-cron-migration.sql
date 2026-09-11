-- ============================================
-- KSLT — Membership Cron Jobs (pg_cron)
-- ============================================
-- Run in Supabase SQL Editor.
-- 1. Auto-expire expired memberships (daily 03:30 UTC = 09:30 Bishkek)
-- 2. 7-day expiry reminder (daily 04:00 UTC = 10:00 Bishkek) — membership-notify (already deployed)

-- 1. Auto-expire cron
SELECT cron.schedule(
  'membership-auto-expire',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/membership-expire',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 2. 7-day reminder cron (if not already scheduled)
-- Check: SELECT * FROM cron.job WHERE jobname = 'membership-expiry-notify';
-- If not exists:
SELECT cron.schedule(
  'membership-expiry-notify',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/membership-notify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
