-- ============================================
-- Баттлы не должны попадать в статистику игрока
-- ============================================
--
-- Баттл — игра показательная, в рейтинг она не идёт. Но победы, поражения
-- и форма игрока считались иначе.
--
-- players.wins / players.losses / players.form турнирами не пополняются
-- вовсе: единственное место, которое их вело, — завершение баттла в
-- админке (js/admin/sections/challenges.js). То есть колонка, по которой
-- публичная страница игрока рисует «Всего матчей» и «% побед», состояла
-- из баттлов и ручных правок, а сыгранные турниры в неё не попадали.
--
-- В коде начисление за баттл убрано. Здесь колонки начинают считаться там
-- же, где и остальное, — в recalc_player_categories, которая и так
-- вызывается после каждого турнира и при пересчёте из админки.
--
-- Считаем ТОЛЬКО одиночные турнирные встречи, как и очки по категориям.
-- Парные не берём намеренно: в matches у парного матча стоят капитаны пар,
-- напарник в строке не упомянут — засчитав такие матчи, мы дали бы победу
-- одному игроку из двух и обделили второго.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Что сейчас насчитано ------------------------------------------
-- Для сравнения «до и после». Столбец «расхождение» — сколько игроков
-- сейчас показывают не то, что следует из их турнирных матчей.
SELECT count(*) AS расхождение_до
FROM players p
LEFT JOIN (
    SELECT pl.id,
           count(*) FILTER (WHERE m.winner_id = pl.id) AS w,
           count(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> pl.id) AS l
    FROM players pl
    JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.winner_id IS NOT NULL
      AND COALESCE(m.score, '') <> 'BYE'
      AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
    GROUP BY pl.id
) st ON st.id = p.id
WHERE COALESCE(p.wins, 0) <> COALESCE(st.w, 0)
   OR COALESCE(p.losses, 0) <> COALESCE(st.l, 0);


-- ---- 3. Пересчёт ведёт те же колонки -----------------------------------
CREATE OR REPLACE FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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

      -- Убираем то, чего в истории больше нет. Закрытые не трогаем: строка
      -- нужна, чтобы запрет на заявки не исчез вместе с ней
      DELETE FROM player_categories pc
      WHERE pc.player_id = ANY(p_ids)
        AND pc.closed_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM rating_history rh
            WHERE rh.player_id = pc.player_id AND rh.category_id = pc.category_id
              AND rh.category_id <> 'friendly'
              AND (rh.is_doubles IS NOT TRUE) AND rh.recorded_at >= oldest_date
            GROUP BY rh.player_id, rh.category_id
            HAVING SUM(rh.points_earned) > 0);

      -- Заводим новые и обновляем очки у существующих. Признак закрытия
      -- лежит в других колонках и остаётся нетронутым
      INSERT INTO player_categories (player_id, category_id, points, updated_at)
      SELECT rh.player_id, rh.category_id, SUM(rh.points_earned), now()
      FROM rating_history rh
      WHERE rh.player_id = ANY(p_ids)
        AND rh.category_id IS NOT NULL
        AND rh.category_id <> 'friendly'
        AND (rh.is_doubles IS NOT TRUE)
        AND rh.recorded_at >= oldest_date
      GROUP BY rh.player_id, rh.category_id
      HAVING SUM(rh.points_earned) > 0
      ON CONFLICT (player_id, category_id) DO UPDATE
        SET points = EXCLUDED.points, updated_at = now();

      -- Очки закрытой категории, выпавшей из сезона, обнуляем: в зачёт они
      -- больше не идут, но сама строка остаётся
      UPDATE player_categories pc
      SET points = 0, updated_at = now()
      WHERE pc.player_id = ANY(p_ids)
        AND pc.closed_at IS NOT NULL
        AND pc.points <> 0
        AND NOT EXISTS (
            SELECT 1 FROM rating_history rh
            WHERE rh.player_id = pc.player_id AND rh.category_id = pc.category_id
              AND rh.category_id <> 'friendly'
              AND (rh.is_doubles IS NOT TRUE) AND rh.recorded_at >= oldest_date
            GROUP BY rh.player_id, rh.category_id
            HAVING SUM(rh.points_earned) > 0);

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
          AND t.category_id <> 'friendly'
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id, t.category_id
      ) st
      WHERE pc.player_id = st.player_id AND pc.category_id = st.category_id;

      -- Общий счёт игрока по всем турнирам. Это то, что видно на публичной
      -- странице: «Всего матчей» и «% побед». Баттлы сюда не входят —
      -- у них нет tournament_id.
      --
      -- Считаем подзапросом на каждого игрока, а не соединением: при
      -- соединении игрок, у которого ВСЕ матчи нетурнирные, выпадал из
      -- выборки целиком и оставался со старыми, накрученными числами
      -- вместо нуля.
      UPDATE players p
      SET wins = (
            SELECT count(*) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.winner_id = p.id
              AND (m.player1_id = p.id OR m.player2_id = p.id)
              AND COALESCE(m.score, '') <> 'BYE'
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')),
          losses = (
            SELECT count(*) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.winner_id IS NOT NULL AND m.winner_id <> p.id
              AND (m.player1_id = p.id OR m.player2_id = p.id)
              AND COALESCE(m.score, '') <> 'BYE'
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles'))
      WHERE p.id = ANY(p_ids);

      -- Форма — последние пять турнирных встреч, свежая первой
      UPDATE players p
      SET form = COALESCE(f.form, '{}'::text[])
      FROM (
        SELECT pl.id AS player_id,
               ARRAY(
                 SELECT CASE WHEN m.winner_id = pl.id THEN 'W' ELSE 'L' END
                 FROM matches m
                 JOIN tournaments t ON t.id = m.tournament_id
                 WHERE (m.player1_id = pl.id OR m.player2_id = pl.id)
                   AND m.winner_id IS NOT NULL
                   AND COALESCE(m.score, '') <> 'BYE'
                   AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
                 ORDER BY COALESCE(m.played_at, m.created_at) DESC
                 LIMIT 5
               ) AS form
        FROM players pl
        WHERE pl.id = ANY(p_ids)
      ) f
      WHERE p.id = f.player_id;
    END;
    $$;

ALTER FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "service_role";


-- ---- 4. Пересчитать всех ----------------------------------------------
SELECT recalc_all_player_points();


-- ---- 5. ПРОВЕРКА ------------------------------------------------------
-- «расхождение_после» должно стать 0, «с_баттлами_в_зачёте» — тоже:
-- ни одного игрока, чьи победы включали бы нетурнирную встречу.
SELECT
    (SELECT count(*) FROM players p
     LEFT JOIN (
        SELECT pl.id,
               count(*) FILTER (WHERE m.winner_id = pl.id) AS w,
               count(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> pl.id) AS l
        FROM players pl
        JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
        JOIN tournaments t ON t.id = m.tournament_id
        WHERE m.winner_id IS NOT NULL
          AND COALESCE(m.score, '') <> 'BYE'
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id
     ) st ON st.id = p.id
     WHERE COALESCE(p.wins, 0) <> COALESCE(st.w, 0)
        OR COALESCE(p.losses, 0) <> COALESCE(st.l, 0)) AS расхождение_после,
    (SELECT count(*) FROM matches WHERE tournament_id IS NULL AND winner_id IS NOT NULL) AS нетурнирных_встреч,
    (SELECT count(*) FROM players WHERE wins > 0 OR losses > 0) AS игроков_со_счётом;
