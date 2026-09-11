    -- ============================================
    -- KSLT — победы и поражения по категориям (#7)
    -- Запустить в Supabase SQL Editor целиком.
    -- ============================================
    --
    -- Очки уже считаются по категориям. Теперь так же считаем сыгранное:
    -- в какой категории сколько побед и поражений. Категория берётся из турнира,
    -- к которому относится матч. Парные и микст не учитываем — рейтинг только
    -- одиночный.

    ALTER TABLE player_categories ADD COLUMN IF NOT EXISTS wins INT NOT NULL DEFAULT 0;
    ALTER TABLE player_categories ADD COLUMN IF NOT EXISTS losses INT NOT NULL DEFAULT 0;

    -- Точечный пересчёт: очки + сыгранное
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

      -- Победы и поражения в одиночных турнирах этой категории
      UPDATE player_categories pc
      SET wins = COALESCE(st.w, 0), losses = COALESCE(st.l, 0)
      FROM (
        SELECT pl.id AS player_id, t.category_id,
               count(*) FILTER (WHERE m.winner_id = pl.id) AS w,
               count(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> pl.id) AS l
        FROM players pl
        JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
        JOIN tournaments t ON t.id = m.tournament_id
        WHERE pl.id = ANY(p_ids)
          AND t.category_id IS NOT NULL
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id, t.category_id
      ) st
      WHERE pc.player_id = st.player_id AND pc.category_id = st.category_id;
    END;
    $$;

    -- Полный пересчёт вызывает точечный по всем игрокам сразу
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

      PERFORM recalc_player_categories(ARRAY(SELECT id FROM players));

      FOR rec IN SELECT id, category_id FROM players LOOP
        IF rec.category_id IS NULL THEN
          home_points := 0;
        ELSE
          SELECT COALESCE(points, 0) INTO home_points
          FROM player_categories
          WHERE player_id = rec.id AND category_id = rec.category_id;
          home_points := COALESCE(home_points, 0);
        END IF;

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

    -- Пересчитываем всех и смотрим результат
    SELECT recalc_all_player_points();

    SELECT pl.name, pc.category_id, pc.points, pc.wins, pc.losses
    FROM player_categories pc
    JOIN players pl ON pl.id = pc.player_id
    ORDER BY pl.name, pc.points DESC
    LIMIT 30;
