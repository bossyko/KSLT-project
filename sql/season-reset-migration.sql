-- ============================================
-- KSLT — Смена сезона 1 сентября (#9)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Журнал смены сезона: что было и что стало у каждого игрока.
-- Нужен, чтобы через полгода можно было ответить игроку, почему
-- у него изменились очки, и не гадать по логам.

CREATE TABLE IF NOT EXISTS season_reset_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at TIMESTAMPTZ DEFAULT now(),
  season TEXT NOT NULL,              -- «2026/27» — сезон, который начался
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  category_id TEXT,
  gender TEXT,
  points_before INT,
  points_after INT,
  rank_before INT,
  rank_after INT,
  notified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_season_reset_run ON season_reset_log(run_at DESC);
CREATE INDEX IF NOT EXISTS idx_season_reset_player ON season_reset_log(player_id);

ALTER TABLE season_reset_log ENABLE ROW LEVEL SECURITY;

-- Игрок видит свои строки, staff — все
DROP POLICY IF EXISTS "Users read own season reset" ON season_reset_log;
CREATE POLICY "Users read own season reset" ON season_reset_log
  FOR SELECT USING (
    player_id = (SELECT player_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff full access season reset" ON season_reset_log;
CREATE POLICY "Staff full access season reset" ON season_reset_log
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================
-- Снимаем автозапуск пересчёта.
-- Теперь смену сезона проводит Edge Function season-reset: она снимает
-- состояние до, пересчитывает, снимает после и рассылает уведомления.
-- Если оставить крон, он пересчитает раньше и сравнивать будет нечего.
-- ============================================
SELECT cron.unschedule('yearly-rating-reset')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'yearly-rating-reset');

-- Проверка
SELECT jobname, schedule, command FROM cron.job;
