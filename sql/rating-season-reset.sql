-- Rating Season Reset: recalculate all player points with a 2 tournament-year window
-- Tournament year: September 1 → August 31
--
-- В рейтинге живут ровно два теннисных года: текущий и предыдущий.
-- 1 сентября года Y сгорает год, закончившийся в августе Y-1.
-- Пример: 01.09.2026 сгорают очки за сезон сен.2024 — авг.2025,
--         остаются сен.2025 — авг.2026 и начавшийся сен.2026 — авг.2027.
--
-- После 1 сентября: отсечка = (Y-1)-09-01
-- До  1 сентября:   отсечка = (Y-2)-09-01
--
-- Очки начисляются в категорию ТУРНИРА. Игрок Tour, сыгравший Masters,
-- получает очки Masters и попадает в рейтинг Masters отдельной строкой.
-- Полная раскладка — в player_categories, а в players.points остаются
-- очки домашней категории (players.category_id) для посева и совместимости.
--
-- Обновляем игроков по одному в цикле, а не одним UPDATE на всю таблицу.
-- В базе включена защита от UPDATE без WHERE, а условие вида
-- «id IS NOT NULL» планировщик выбрасывает, потому что id — первичный ключ,
-- и защита снова видит запрос без условия.

CREATE OR REPLACE FUNCTION recalc_all_player_points()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  oldest_date DATE;
  cur_year INT;
  rec RECORD;
  home_points INT;
  doubles INT;
BEGIN
  cur_year := EXTRACT(YEAR FROM NOW());
  IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
    oldest_date := make_date(cur_year - 1, 9, 1);
  ELSE
    oldest_date := make_date(cur_year - 2, 9, 1);
  END IF;

  -- Раскладка по категориям: пересобираем целиком, чтобы исчезнувшие
  -- категории не оставались висеть со старыми суммами
  -- Условие настоящее, а не «IS NOT NULL»: player_id входит в первичный ключ,
  -- такое условие планировщик выбрасывает, и защита от DELETE без WHERE
  -- блокирует запрос.
  DELETE FROM player_categories WHERE player_id IN (SELECT id FROM players);

  INSERT INTO player_categories (player_id, category_id, points, updated_at)
  SELECT rh.player_id, rh.category_id, SUM(rh.points_earned), now()
  FROM rating_history rh
  WHERE rh.category_id IS NOT NULL
    AND (rh.is_doubles IS NOT TRUE)
    AND rh.recorded_at >= oldest_date
  GROUP BY rh.player_id, rh.category_id
  HAVING SUM(rh.points_earned) > 0;

  -- players.points — очки домашней категории
  FOR rec IN SELECT id, category_id FROM players LOOP
    IF rec.category_id IS NULL THEN
      home_points := 0;
    ELSE
      SELECT COALESCE(points, 0) INTO home_points
      FROM player_categories
      WHERE player_id = rec.id AND category_id = rec.category_id;
      home_points := COALESCE(home_points, 0);
    END IF;

    -- Парные и микст очков не дают, поле держим в нуле
    SELECT COALESCE(SUM(points_earned), 0) INTO doubles
    FROM rating_history
    WHERE player_id = rec.id
      AND is_doubles = TRUE
      AND recorded_at >= oldest_date;

    UPDATE players
    SET points = home_points, doubles_points = doubles
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Автозапуск 1 сентября снят: смену сезона проводит Edge Function season-reset,
-- она снимает состояние до пересчёта, вызывает эту функцию, снимает после
-- и рассылает уведомления. См. sql/season-reset-cron.sql
