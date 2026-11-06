-- ============================================================
-- ЗАПРЕТ ГОЛОСА ЗА ОТМЕНЁННЫЙ БАТТЛ · 06.11.2026
-- ============================================================
--
-- ЧТО БЫЛО. `cast_battle_vote` проверяла `battle_published`,
-- `voting_closed` и время матча. Статуса `cancelled` она не проверяла:
-- голос за отменённый баттл принимался и ложился в
-- `challenge_predictions` навсегда.
--
-- ЭКРАН — НЕ ЗАПРЕТ. Сегодня оба продукта такой баттл помечают и в
-- «активные» не кладут, но запрос можно послать и мимо экрана.
--
-- ПРОГОНЯТЬ ЦЕЛИКОМ, ОДНИМ ЗАПРОСОМ. Редактор Supabase показывает
-- только последний ответ, поэтому проверка ниже сведена в один SELECT.
-- ============================================================

-- ============================================
-- Battle Vote RPC (SECURITY DEFINER)
-- One vote per user — no changes allowed
-- Cross-check: site ↔ telegram (same person can't vote twice)
-- Auto-close: voting ends when match time arrives
-- ============================================

CREATE OR REPLACE FUNCTION cast_battle_vote(
    p_challenge_id UUID,
    p_player_id TEXT
) RETURNS JSON AS $$
DECLARE
    v_challenge RECORD;
    v_existing TEXT;
    v_tg_chat_id TEXT;
    v_tg_vote TEXT;
    v_match_dt TIMESTAMPTZ;
BEGIN
    -- Get challenge
    SELECT battle_published, voting_closed, status,
           COALESCE(counter_date, proposed_date) AS match_date,
           COALESCE(counter_time, proposed_time) AS match_time
    INTO v_challenge
    FROM challenges WHERE id = p_challenge_id;

    IF v_challenge IS NULL OR v_challenge.battle_published = false THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;

    -- ОТМЕНЁННЫЙ БАТТЛ ГОЛОСОВ НЕ ПРИНИМАЕТ (06.11).
    -- Экраны обоих продуктов такой баттл теперь помечают и в «активные»
    -- не кладут, но ЭКРАН — НЕ ЗАПРЕТ: запрос можно послать и мимо
    -- экрана, а голос ложится в challenge_predictions навсегда.
    IF v_challenge.status = 'cancelled' THEN
        RETURN json_build_object('ok', false, 'error', 'cancelled');
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================
-- Три числа в одной строке:
--   1. стоит ли проверка статуса в теле функции (ждём true);
--   2. сколько баттлов отменено сейчас;
--   3. сколько голосов уже лежит за отменённые баттлы — их этот
--      запрет не убирает, он только закрывает дверь на будущее.
SELECT
    (SELECT position('cancelled' in pg_get_functiondef(p.oid)) > 0
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'cast_battle_vote' AND n.nspname = 'public'
      LIMIT 1)                                        AS zapret_stoit,
    (SELECT count(*) FROM challenges
      WHERE status = 'cancelled')                     AS otmenyonnyh_battlov,
    (SELECT count(*) FROM challenge_predictions cp
       JOIN challenges c ON c.id = cp.challenge_id
      WHERE c.status = 'cancelled')                   AS golosov_za_otmenyonnye;
