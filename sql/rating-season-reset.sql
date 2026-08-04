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
-- Обновляем игроков по одному в цикле, а не одним UPDATE на всю таблицу.
-- В базе включена защита от UPDATE без WHERE, а условие вида
-- «id IS NOT NULL» планировщик выбрасывает, потому что id — первичный ключ,
-- и защита снова видит запрос без условия. В цикле у каждого обновления
-- есть настоящее WHERE id = ..., и вопрос снимается.

CREATE OR REPLACE FUNCTION recalc_all_player_points()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  oldest_date DATE;
  cur_year INT;
  rec RECORD;
  singles INT;
  doubles INT;
BEGIN
  cur_year := EXTRACT(YEAR FROM NOW());
  IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
    oldest_date := make_date(cur_year - 1, 9, 1);
  ELSE
    oldest_date := make_date(cur_year - 2, 9, 1);
  END IF;

  FOR rec IN SELECT id FROM players LOOP
    SELECT COALESCE(SUM(points_earned), 0) INTO singles
    FROM rating_history
    WHERE player_id = rec.id
      AND (is_doubles IS NOT TRUE)
      AND recorded_at >= oldest_date;

    SELECT COALESCE(SUM(points_earned), 0) INTO doubles
    FROM rating_history
    WHERE player_id = rec.id
      AND is_doubles = TRUE
      AND recorded_at >= oldest_date;

    UPDATE players
    SET points = singles, doubles_points = doubles
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Автозапуск 1 сентября снят: смену сезона проводит Edge Function season-reset,
-- она снимает состояние до пересчёта, вызывает эту функцию, снимает после
-- и рассылает уведомления. См. sql/season-reset-migration.sql
