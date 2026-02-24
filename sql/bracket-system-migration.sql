-- ============================================
-- KSLT Bracket System Migration
-- Турнирная сетка: регистрация, жеребьёвка, матчи
-- ============================================

-- 1. tournament_registrations — заявки игроков на турнир
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed_number INT,                -- номер посева (1-8), null = несеяный
  draw_position INT,              -- позиция в сетке (1-32), null = ещё не определена
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- 2. Новые колонки в tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draw_size INT;                -- 8, 16, 32
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_type TEXT;            -- 'single_elimination', 'round_robin'
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS court_count INT DEFAULT 2;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS match_duration INT DEFAULT 90; -- минуты
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_deadline DATE;

-- 3. Расширение CHECK constraint для status (добавляем registration_open, registration_closed, cancelled)
-- Удаляем старый constraint и создаём новый
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));

-- 4. Новые колонки в matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_order INT;        -- позиция в сетке (1-based)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_number INT;       -- 1=R1, 2=R2/QF, 3=SF, 4=F
ALTER TABLE matches ADD COLUMN IF NOT EXISTS court INT;              -- номер корта
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduled_time TEXT;    -- 'HH:MM'
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduled_day DATE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';  -- upcoming/live/completed
ALTER TABLE matches ADD COLUMN IF NOT EXISTS seed1 INT;              -- посев игрока 1
ALTER TABLE matches ADD COLUMN IF NOT EXISTS seed2 INT;              -- посев игрока 2

-- 5. RLS для tournament_registrations
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Чтение — всем
CREATE POLICY "registrations_read" ON tournament_registrations
  FOR SELECT USING (true);

-- Вставка — авторизованные пользователи (игрок регистрирует себя)
CREATE POLICY "registrations_insert" ON tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Обновление и удаление — только admin/manager
-- NOTE: Эти политики были заменены на безопасные в sql/rls-security-fix.sql
-- CREATE POLICY "registrations_update" ... → см. rls-security-fix.sql
-- CREATE POLICY "registrations_delete" ... → см. rls-security-fix.sql

-- 6. Индексы
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player ON tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON tournament_registrations(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_number);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
