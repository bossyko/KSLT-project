-- ============================================
-- KSLT Rating System Migration
-- Система рейтинга с подтверждением очков
-- ============================================

-- 1. Уровни турниров (Кат.1 — Grand/ТБШ)
CREATE TABLE IF NOT EXISTS tournament_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO tournament_levels (name, name_en, sort_order) VALUES
  ('Категория 1', 'Category 1', 1),
  ('Категория 2', 'Category 2', 2),
  ('Категория 3', 'Category 3', 3),
  ('Категория 4', 'Category 4', 4),
  ('Grand (ТБШ)', 'Grand Slam', 5);

-- 2. Правила начисления очков (по уровню турнира + раунд)
CREATE TABLE IF NOT EXISTS points_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID REFERENCES tournament_levels(id) ON DELETE CASCADE,
  round TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  UNIQUE(level_id, round)
);

-- Заполнение очков: Кат.1
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 25), ('F', 15), ('SF', 8), ('QF', 4), ('R16', 2), ('R32', 0)
) AS r(round, points)
WHERE tl.sort_order = 1;

-- Кат.2
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 50), ('F', 30), ('SF', 18), ('QF', 9), ('R16', 4), ('R32', 2)
) AS r(round, points)
WHERE tl.sort_order = 2;

-- Кат.3
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 100), ('F', 65), ('SF', 36), ('QF', 18), ('R16', 9), ('R32', 4)
) AS r(round, points)
WHERE tl.sort_order = 3;

-- Кат.4
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 200), ('F', 130), ('SF', 70), ('QF', 35), ('R16', 18), ('R32', 9)
) AS r(round, points)
WHERE tl.sort_order = 4;

-- Grand (ТБШ)
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 400), ('F', 250), ('SF', 150), ('QF', 75), ('R16', 35), ('R32', 18)
) AS r(round, points)
WHERE tl.sort_order = 5;

-- 3. Добавить уровень турнира в таблицу tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES tournament_levels(id);

-- 4. Результаты турниров (TEXT FK — existing tables use TEXT id)
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  round_reached TEXT NOT NULL,
  points_earned INT DEFAULT 0,
  season INT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  is_transition BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- 5. Промоушен игроков (TEXT FK)
CREATE TABLE IF NOT EXISTS player_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  from_category_id TEXT REFERENCES categories(id),
  to_category_id TEXT REFERENCES categories(id),
  season INT NOT NULL,
  status TEXT DEFAULT 'eligible',
  eligible_date TIMESTAMPTZ DEFAULT now(),
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RLS политики
ALTER TABLE tournament_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_promotions ENABLE ROW LEVEL SECURITY;

-- Чтение — всем
CREATE POLICY "tournament_levels_read" ON tournament_levels FOR SELECT USING (true);
CREATE POLICY "points_rules_read" ON points_rules FOR SELECT USING (true);
CREATE POLICY "tournament_results_read" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "player_promotions_read" ON player_promotions FOR SELECT USING (true);

-- Запись — только admin/manager
-- NOTE: Эти политики были заменены на безопасные в sql/rls-security-fix.sql
-- CREATE POLICY "tournament_levels_write" ... → см. rls-security-fix.sql
-- CREATE POLICY "points_rules_write" ... → см. rls-security-fix.sql
-- CREATE POLICY "tournament_results_write" ... → см. rls-security-fix.sql
-- CREATE POLICY "player_promotions_write" ... → см. rls-security-fix.sql

-- 7. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tournament_results_player ON tournament_results(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_season ON tournament_results(season);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category_id);
CREATE INDEX IF NOT EXISTS idx_player_promotions_player ON player_promotions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_promotions_season ON player_promotions(season);
