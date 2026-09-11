-- ============================================
-- Функции базы всё ещё читают удалённые колонки
-- ============================================
--
-- Миграция вызовов удалила поля встречного предложения — counter_date,
-- counter_time, counter_venue, counter_court_id. Три функции продолжали их
-- запрашивать, и каждая падала с ошибкой:
--
--   get_battle_public      — страница баттла. Ошибка выглядела как
--                            «Баттл не найден»: страница честно сообщала,
--                            что данных нет, хотя баттл опубликован.
--   get_player_challenges  — список вызовов игрока.
--   cast_battle_vote       — голосование за баттл.
--
-- Тела взяты из снимка схемы и отличаются от прежних только отсутствием
-- этих колонок.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Функции без удалённых колонок ---------------------------------
CREATE OR REPLACE FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               -- Challenge-level overrides
               c.challenger_ntrp, c.opponent_ntrp,
               c.challenger_country, c.opponent_country,
               c.challenger_category, c.opponent_category,
               c.set_format,
               -- Player data
               p1.name AS challenger_name, p1.name_en AS challenger_name_en, p1.name_kg AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               p2.name AS opponent_name, p2.name_en AS opponent_name_en, p2.name_kg AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               -- Court map links
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        JOIN players p1 ON p1.id = c.challenger_player_id
        JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$;

CREATE OR REPLACE FUNCTION "public"."get_player_challenges"("p_player_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      result JSON;
  BEGIN
      SELECT json_agg(row_to_json(t)) INTO result
      FROM (
          SELECT
              c.id, c.status, c.proposed_date, c.proposed_time,
              c.proposed_venue,
              c.created_at, c.accepted_at,
              c.challenger_player_id,
              COALESCE(cp.name, lm.player1_name) AS challenger_name,
              COALESCE(cp.name_en, lm.player1_name) AS challenger_name_en,
              COALESCE(cp.name_kg, lm.player1_name) AS challenger_name_kg,
              cp.photo AS challenger_photo,
              c.opponent_player_id,
              COALESCE(op.name, lm.player2_name) AS opponent_name,
              COALESCE(op.name_en, lm.player2_name) AS opponent_name_en,
              COALESCE(op.name_kg, lm.player2_name) AS opponent_name_kg,
              op.photo AS opponent_photo,
              ct.name AS court_name,
              COALESCE(m.score, c.score_draft) AS match_score,
              m.winner_id AS match_winner_id
          FROM challenges c
          LEFT JOIN players cp ON cp.id = c.challenger_player_id
          LEFT JOIN players op ON op.id = c.opponent_player_id
          LEFT JOIN courts ct ON ct.id = c.proposed_court_id
          LEFT JOIN matches m ON m.id = c.match_id
          LEFT JOIN live_matches lm ON lm.id = c.live_match_id
          WHERE (c.challenger_player_id = p_player_id OR c.opponent_player_id = p_player_id)
            AND c.status IN ('accepted', 'completed')
          ORDER BY c.created_at DESC
          LIMIT 25
      ) t;
      RETURN COALESCE(result, '[]'::json);
  END;
  $$;

CREATE OR REPLACE FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_challenge RECORD;
    v_existing TEXT;
    v_tg_chat_id TEXT;
    v_tg_vote TEXT;
    v_match_dt TIMESTAMPTZ;
BEGIN
    -- Get challenge
    SELECT battle_published, voting_closed,
           proposed_date AS match_date,
           proposed_time AS match_time
    INTO v_challenge
    FROM challenges WHERE id = p_challenge_id;

    IF v_challenge IS NULL OR v_challenge.battle_published = false THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;

    IF v_challenge.voting_closed THEN
        RETURN json_build_object('ok', false, 'error', 'voting_closed');
    END IF;

    -- Auto-close: check if match time has passed (Asia/Bishkek timezone)
    IF v_challenge.match_date IS NOT NULL AND v_challenge.match_time IS NOT NULL THEN
        v_match_dt := (v_challenge.match_date::text || ' ' || v_challenge.match_time)::timestamp AT TIME ZONE 'Asia/Bishkek';
        IF NOW() >= v_match_dt THEN
            -- Auto-close voting
            UPDATE challenges SET voting_closed = true WHERE id = p_challenge_id;
            RETURN json_build_object('ok', false, 'error', 'voting_closed');
        END IF;
    END IF;

    -- Check if already voted on site (one vote only!)
    SELECT predicted_winner_id INTO v_existing
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
      AND voter_type = 'site'
      AND voter_id = auth.uid()::text;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('ok', false, 'error', 'already_voted');
    END IF;

    -- Cross-check: did this user already vote via Telegram?
    SELECT telegram_chat_id INTO v_tg_chat_id
    FROM profiles WHERE id = auth.uid();

    IF v_tg_chat_id IS NOT NULL THEN
        SELECT predicted_winner_id INTO v_tg_vote
        FROM challenge_predictions
        WHERE challenge_id = p_challenge_id
          AND voter_type = 'telegram'
          AND voter_id = v_tg_chat_id;

        IF v_tg_vote IS NOT NULL THEN
            RETURN json_build_object('ok', false, 'error', 'already_voted_tg');
        END IF;
    END IF;

    -- Insert vote
    INSERT INTO challenge_predictions (challenge_id, voter_type, voter_id, predicted_winner_id)
    VALUES (p_challenge_id, 'site', auth.uid()::text, p_player_id);

    RETURN json_build_object('ok', true);
END;
$$;

-- ---- 3. ПРОВЕРКА ------------------------------------------------------
-- Должен быть 0: ни одна функция базы больше не просит того, чего нет.
SELECT count(*) AS упоминаний_удалённых_колонок
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.prosrc LIKE '%counter_date%'
    OR p.prosrc LIKE '%counter_time%'
    OR p.prosrc LIKE '%counter_venue%'
    OR p.prosrc LIKE '%counter_court%');
