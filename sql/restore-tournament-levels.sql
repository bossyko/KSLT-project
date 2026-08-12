-- ============================================
-- Восстановление tournament_levels + points_rules
-- Запустить в Supabase SQL Editor
-- ============================================

-- 1. Вставляем уровни (ON CONFLICT пропускает если уже есть)
INSERT INTO tournament_levels (name, name_en, sort_order) VALUES
  ('Категория 1', 'Category 1', 1),
  ('Категория 2', 'Category 2', 2),
  ('Категория 3', 'Category 3', 3),
  ('Категория 4', 'Category 4', 4),
  ('Grand (ТБШ)', 'Grand Slam', 5);

-- 2. Заполняем очки по раундам

-- Кат.1
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 25), ('F', 15), ('SF', 8), ('QF', 4), ('R16', 2), ('R32', 0)
) AS r(round, points)
WHERE tl.sort_order = 1
ON CONFLICT (level_id, round) DO UPDATE SET points = EXCLUDED.points;

-- Кат.2
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 50), ('F', 30), ('SF', 18), ('QF', 9), ('R16', 4), ('R32', 2)
) AS r(round, points)
WHERE tl.sort_order = 2
ON CONFLICT (level_id, round) DO UPDATE SET points = EXCLUDED.points;

-- Кат.3
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 100), ('F', 65), ('SF', 36), ('QF', 18), ('R16', 9), ('R32', 4)
) AS r(round, points)
WHERE tl.sort_order = 3
ON CONFLICT (level_id, round) DO UPDATE SET points = EXCLUDED.points;

-- Кат.4
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 200), ('F', 130), ('SF', 70), ('QF', 35), ('R16', 18), ('R32', 9)
) AS r(round, points)
WHERE tl.sort_order = 4
ON CONFLICT (level_id, round) DO UPDATE SET points = EXCLUDED.points;

-- Grand (ТБШ)
INSERT INTO points_rules (level_id, round, points)
SELECT tl.id, r.round, r.points
FROM tournament_levels tl
CROSS JOIN (VALUES
  ('W', 400), ('F', 250), ('SF', 150), ('QF', 75), ('R16', 35), ('R32', 18)
) AS r(round, points)
WHERE tl.sort_order = 5
ON CONFLICT (level_id, round) DO UPDATE SET points = EXCLUDED.points;
