-- ============================================
-- KSLT — Автозапуск смены сезона 1 сентября (#9)
-- ============================================
--
-- Крон вызывает Edge Function season-reset, а не пересчёт напрямую.
-- Порядок важен: функция должна снять состояние ДО пересчёта, иначе
-- сравнивать будет не с чем и уведомления никому не уйдут.
--
-- Кнопка «Смена сезона» в админке при этом остаётся: запуски безопасны
-- повторно. Если крон уже отработал, второй прогон увидит нулевую разницу,
-- ничего не запишет и никому не напишет.
--
-- ⚠️ ПЕРЕД ЗАПУСКОМ подставьте service_role key вместо <SERVICE_ROLE_KEY>.
--    Найти: Supabase → Project Settings → API → service_role.
--    Ключ в репозиторий не коммитим — он остаётся только в базе.

-- Снимаем старое задание, если осталось
SELECT cron.unschedule('season-reset-yearly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'season-reset-yearly');

-- 1 сентября в 00:00
SELECT cron.schedule(
  'season-reset-yearly',
  '0 0 1 9 *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/season-reset',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Проверка
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
