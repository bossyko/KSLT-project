-- ============================================================
-- В паре счёт вписывает любой из двоих
-- ============================================================
--
-- В записи матча помещаются двое. В парном турнире это капитаны пар, а
-- напарники там не значатся вовсе — их знает только заявка.
--
-- Из-за этого вписать и подтвердить счёт мог только капитан. Напарник
-- кнопки не видел. Довод против нашёлся сразу: капитан бывает в возрасте
-- и с телефоном не в ладах, и тогда пара заперта на одном человеке.
--
-- Здесь право получают оба. Сторону теперь ищем не только по самой записи
-- матча, но и по заявке: если в матче стоит капитан, а ты его напарник —
-- ты на этой стороне.
--
-- Подтверждать при этом по-прежнему должна **другая** сторона. Раньше
-- хватало сравнить людей: «вписал не ты — значит подтверждай». С парами
-- этого мало: напарник — другой человек, но та же сторона, и он бы
-- подтвердил счёт сам себе. Сравниваем стороны, а не людей.
--
-- Файл меняет базу. Требует match-score-by-players.sql.

BEGIN;

-- ---- Сторона игрока: своя запись или заявка напарника ----

CREATE OR REPLACE FUNCTION public.match_side_of(p_match_id uuid, p_user uuid)
RETURNS smallint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    m       RECORD;
    v_карта text;
BEGIN
    SELECT * INTO m FROM matches WHERE id = p_match_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT player_id INTO v_карта FROM profiles WHERE id = p_user;
    IF v_карта IS NULL THEN RETURN NULL; END IF;

    -- Сам стоит в матче
    IF m.player1_id = v_карта THEN RETURN 1; END IF;
    IF m.player2_id = v_карта THEN RETURN 2; END IF;

    -- Или он напарник того, кто стоит. Пары знает заявка на турнир
    IF m.tournament_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM tournament_registrations r
             WHERE r.tournament_id = m.tournament_id
               AND r.player_id = m.player1_id
               AND r.partner_id = v_карта
        ) THEN RETURN 1; END IF;

        IF EXISTS (
            SELECT 1 FROM tournament_registrations r
             WHERE r.tournament_id = m.tournament_id
               AND r.player_id = m.player2_id
               AND r.partner_id = v_карта
        ) THEN RETURN 2; END IF;
    END IF;

    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.match_side_of(uuid, uuid) IS
    'Сторона игрока в матче: 1, 2 или пусто. В паре считается и напарник — его знает заявка на турнир.';

-- ---- Подтверждает другая сторона, а не другой человек ----

CREATE OR REPLACE FUNCTION public.confirm_match_score(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user     uuid := auth.uid();
    v_side     smallint;
    v_их_side  smallint;
    v_match    RECORD;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authorized');
    END IF;

    SELECT * INTO v_match FROM matches WHERE id = p_match_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'match_not_found');
    END IF;

    v_side := public.match_side_of(p_match_id, v_user);
    IF v_side IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_a_player');
    END IF;

    IF v_match.score_status IS DISTINCT FROM 'pending' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_confirm');
    END IF;

    -- Своя сторона свой же счёт не подтверждает: ни автор, ни его напарник
    v_их_side := public.match_side_of(p_match_id, v_match.score_submitted_by);
    IF v_их_side IS NOT NULL AND v_их_side = v_side THEN
        RETURN jsonb_build_object('ok', false, 'error', 'own_score');
    END IF;

    UPDATE matches SET
        score_status       = 'confirmed',
        score_confirmed_at = now()
    WHERE id = p_match_id;

    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'confirmed');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о подтверждении не отправлено: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---- То же правило для отказа ----

CREATE OR REPLACE FUNCTION public.dispute_match_score(p_match_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user    uuid := auth.uid();
    v_side    smallint;
    v_их_side smallint;
    v_match   RECORD;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authorized');
    END IF;

    SELECT * INTO v_match FROM matches WHERE id = p_match_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'match_not_found');
    END IF;

    v_side := public.match_side_of(p_match_id, v_user);
    IF v_side IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_a_player');
    END IF;

    IF v_match.score_status IS DISTINCT FROM 'pending' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_dispute');
    END IF;

    v_их_side := public.match_side_of(p_match_id, v_match.score_submitted_by);
    IF v_их_side IS NOT NULL AND v_их_side = v_side THEN
        RETURN jsonb_build_object('ok', false, 'error', 'own_score');
    END IF;

    UPDATE matches SET
        score_status       = 'disputed',
        score_dispute_note = NULLIF(btrim(COALESCE(p_note, '')), '')
    WHERE id = p_match_id;

    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'disputed');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о споре не отправлено: %', SQLERRM;
    END;

    BEGIN
        PERFORM public.notify_score_dispute(p_match_id);
    EXCEPTION WHEN others THEN
        RAISE WARNING 'организатор не позван: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_side_of(uuid, uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_match_score(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_match_score(uuid, text) TO authenticated;

COMMIT;
