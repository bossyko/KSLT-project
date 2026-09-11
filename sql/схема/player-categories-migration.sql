-- ============================================
-- KSLT — Игрок в нескольких категориях (#7)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- По правилам игрок может играть в своей категории и на одну ступень выше.
-- Очки начисляются в категорию ТУРНИРА, а не игрока: гость из Tour, сыгравший
-- Masters, получает очки Masters и появляется в рейтинге Masters отдельной
-- строкой со своей суммой.
--
-- players.points остаётся: там очки домашней категории (players.category_id).
-- По нему работают дашборд, списки и старые места в коде.
-- Полная картина — в player_categories.

-- 1. Категория, в которую пошли очки за результат.
--    Для турниров берётся из турнира, для ручных записей задаёт админ.
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id);

CREATE INDEX IF NOT EXISTS idx_rating_history_category
  ON rating_history(player_id, category_id);

-- 2. Очки игрока по категориям. Таблица производная: заполняется пересчётом
--    из rating_history, руками не редактируется. Поэтому разойтись с фактом
--    не может.
CREATE TABLE IF NOT EXISTS player_categories (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (player_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_player_categories_cat
  ON player_categories(category_id, points DESC);

ALTER TABLE player_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads player categories" ON player_categories;
CREATE POLICY "Anyone reads player categories" ON player_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff writes player categories" ON player_categories;
CREATE POLICY "Staff writes player categories" ON player_categories
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 3. Проставляем категорию задним числом там, где её можно вывести из турнира
UPDATE rating_history rh
SET category_id = t.category_id
FROM tournaments t
WHERE rh.tournament_id = t.id
  AND rh.category_id IS NULL
  AND t.category_id IS NOT NULL;

-- 4. Проверка
SELECT
  (SELECT count(*) FROM rating_history) AS всего_записей,
  (SELECT count(*) FROM rating_history WHERE category_id IS NOT NULL) AS с_категорией,
  (SELECT count(*) FROM rating_history WHERE category_id IS NULL) AS без_категории;

-- ============================================
-- 5. Точечный пересчёт категорий для конкретных игроков.
--    Вызывается после завершения турнира, чтобы новая категория и очки
--    появлялись сразу, а не после полного пересчёта.
-- ============================================
CREATE OR REPLACE FUNCTION recalc_player_categories(p_ids TEXT[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  oldest_date DATE;
  cur_year INT;
BEGIN
  cur_year := EXTRACT(YEAR FROM NOW());
  IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
    oldest_date := make_date(cur_year - 1, 9, 1);
  ELSE
    oldest_date := make_date(cur_year - 2, 9, 1);
  END IF;

  DELETE FROM player_categories WHERE player_id = ANY(p_ids);

  INSERT INTO player_categories (player_id, category_id, points, updated_at)
  SELECT rh.player_id, rh.category_id, SUM(rh.points_earned), now()
  FROM rating_history rh
  WHERE rh.player_id = ANY(p_ids)
    AND rh.category_id IS NOT NULL
    AND (rh.is_doubles IS NOT TRUE)
    AND rh.recorded_at >= oldest_date
  GROUP BY rh.player_id, rh.category_id
  HAVING SUM(rh.points_earned) > 0;
END;
$$;
