-- ============================================
-- Статистика — только по рейтинговым одиночным
-- ============================================
--
-- Что не так сейчас.
--
-- Победы, поражения и форма считались по всем одиночным турнирам подряд —
-- и рейтинговым, и дружеским. Отбор шёл по формату (одиночка или пара), а
-- про категорию турнира не спрашивал.
--
-- Из-за этого статистику двух игроков нельзя сравнить: один играет только
-- рейтинговые и у него 12 побед, другой каждую неделю дружеские и у него 40.
-- Числа выглядят одинаково, а означают разное.
--
-- Что делаем.
--
-- Добавляем к трём подсчётам условие «категория не friendly»: общий счёт
-- побед, общий счёт поражений и форма последних пяти. В победах по
-- категориям это условие уже стояло — там расхождения и не было.
--
-- Баттлы и раньше не считались: у них нет турнира, а соединение идёт через
-- него. Парные и смешанные тоже, по формату.
--
-- ВНИМАНИЕ: после запуска у части игроков числа уменьшатся — из статистики
-- уйдут победы в дружеских турнирах. Это наведение порядка, а не поломка,
-- но людей стоит предупредить.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM players)                        AS игроков,
       (SELECT count(*) FROM tournaments
         WHERE category_id = 'friendly')                     AS дружеских_турниров,
       (SELECT sum(wins) FROM players)                       AS побед_сейчас;


-- ---- 2. Пересчёт с новым правилом --------------------------------------
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
              AND COALESCE(t.category_id, '') <> 'friendly'
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')),
          losses = (
            SELECT count(*) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.winner_id IS NOT NULL AND m.winner_id <> p.id
              AND (m.player1_id = p.id OR m.player2_id = p.id)
              AND COALESCE(m.score, '') <> 'BYE'
              AND COALESCE(t.category_id, '') <> 'friendly'
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles'))
      WHERE p.id = ANY(p_ids);

      -- Форма — последние пять рейтинговых одиночных встреч, свежая первой
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
                   AND COALESCE(t.category_id, '') <> 'friendly'
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
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "service_role";



-- ---- 3. Дата у сыгранных баттлов ---------------------------------------
-- Баттлы теперь показываются в общей истории матчей, а история строится по
-- played_at. У прежних баттлов эта колонка пустая, и в сортировке DESC
-- Postgres ставит пустое значение впереди всего: показательная игра
-- полугодовой давности встала бы первой строкой, ещё и с прочерком вместо
-- даты. Берём день, на который баттл был назначен
-- proposed_time хранится строкой «18:30», а не временем: приводим явно.
-- Пустую строку COALESCE не поймает — её отсекает NULLIF
UPDATE matches m
SET played_at = c.proposed_date::timestamp
                + COALESCE(NULLIF(c.proposed_time::text, '')::time, '12:00'::time)
FROM challenges c
WHERE c.match_id = m.id
  AND m.played_at IS NULL
  AND c.proposed_date IS NOT NULL;

-- Если назначенного дня нет, ориентируемся на день записи
UPDATE matches SET played_at = created_at
WHERE played_at IS NULL AND created_at IS NOT NULL;


-- ---- 4. Пересчёт по всем игрокам ---------------------------------------
SELECT public.recalc_player_categories(ARRAY(SELECT id FROM players));


-- ---- 5. ПРОВЕРКА -------------------------------------------------------
SELECT
    (SELECT count(*) FROM pg_proc
      WHERE proname = 'recalc_player_categories'
        AND prosrc LIKE '%COALESCE(t.category_id%')      AS правило_на_месте,
    (SELECT sum(wins) FROM players)                           AS побед_после,
    (SELECT sum(losses) FROM players)                         AS поражений_после,
    (SELECT count(*) FROM players
      WHERE form IS NOT NULL AND array_length(form, 1) > 0)   AS игроков_с_формой,
    (SELECT count(*) FROM matches WHERE played_at IS NULL)    AS матчей_без_даты;
