-- ============================================
-- Закрытие категории для игрока
-- ============================================
--
-- По правилам клуба игрок одновременно выступает не более чем в двух
-- категориях. Когда его переводят в новую, одну из прежних закрывают.
--
-- Что означает закрытие:
--   • заявки в эту категорию больше не принимаются;
--   • очки и история в ней остаются — они заработаны и никуда не деваются;
--   • турниры, куда игрок уже записан, он доигрывает: запрет действует
--     только на новые заявки;
--   • в новой категории он начинает с нуля — так считалось и раньше,
--     очки ведутся по каждой категории отдельно;
--   • открыть обратно может админ, руками.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Признак закрытия ----------------------------------------------
ALTER TABLE public.player_categories
    ADD COLUMN IF NOT EXISTS closed_at timestamptz,
    ADD COLUMN IF NOT EXISTS closed_by uuid,
    ADD COLUMN IF NOT EXISTS closed_reason text;

COMMENT ON COLUMN public.player_categories.closed_at IS
    'Когда категорию закрыли для заявок. Очки и история остаются.';


-- ---- 3. Пересчёт не должен стирать закрытие ----------------------------
-- recalc_player_categories раньше сносила все строки игрока и собирала их
-- заново из истории. Закрытие при этом слетало бы после каждого турнира.
--
-- Теперь строки не сносятся, а обновляются: пропадают только те, где очков
-- не осталось И которые не закрыты. Закрытая категория живёт и с нулём —
-- иначе запрет исчез бы вместе со строкой.
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
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id, t.category_id
      ) st
      WHERE pc.player_id = st.player_id AND pc.category_id = st.category_id;
    END;
    $$;

ALTER FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "service_role";


-- ---- 4. Закрывать и открывать может только сотрудник -------------------
-- Правило должно жить в базе: интерфейс можно обойти запросом напрямую.
CREATE OR REPLACE FUNCTION "public"."set_category_closed"(
    "p_player_id" "text", "p_category_id" "text",
    "p_closed" boolean, "p_reason" "text" DEFAULT NULL)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    open_count int;
BEGIN
    SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'manager') THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    IF p_closed THEN
        -- Строки может не быть вовсе: назначенная категория без очков её не
        -- заводит. Заводим сами, иначе запрет некуда записать
        INSERT INTO player_categories (player_id, category_id, points, updated_at,
                                       closed_at, closed_by, closed_reason)
        VALUES (p_player_id, p_category_id, 0, now(), now(), auth.uid(), p_reason)
        ON CONFLICT (player_id, category_id) DO UPDATE
          SET closed_at = now(), closed_by = auth.uid(), closed_reason = p_reason;

        RETURN jsonb_build_object('ok', true);
    ELSE
        -- Открытых больше двух быть не должно
        SELECT count(*) INTO open_count
        FROM player_categories
        WHERE player_id = p_player_id AND closed_at IS NULL
          AND category_id <> p_category_id;

        IF open_count >= 2 THEN
            RETURN jsonb_build_object('error', 'too_many_open', 'open', open_count);
        END IF;

        UPDATE player_categories
        SET closed_at = NULL, closed_by = NULL, closed_reason = NULL
        WHERE player_id = p_player_id AND category_id = p_category_id;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

ALTER FUNCTION "public"."set_category_closed"("text", "text", boolean, "text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."set_category_closed"("text", "text", boolean, "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_category_closed"("text", "text", boolean, "text") TO "service_role";


-- ---- 5. ПРОВЕРКА ------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'player_categories' AND column_name = 'closed_at') AS колонка_есть,
    (SELECT count(*) FROM pg_proc WHERE proname = 'set_category_closed') AS функция_есть,
    (SELECT count(*) FROM player_categories WHERE closed_at IS NOT NULL) AS закрытых_сейчас;
