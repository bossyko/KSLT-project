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
    SELECT battle_published, voting_closed,
           COALESCE(counter_date, proposed_date) AS match_date,
           COALESCE(counter_time, proposed_time) AS match_time
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
