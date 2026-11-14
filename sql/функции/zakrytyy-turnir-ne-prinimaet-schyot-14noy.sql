-- ============================================================
-- ЗАКРЫТЫЙ ТУРНИР СЧЁТ НЕ ПРИНИМАЕТ — замок в базе
-- 14 ноября, находка Кости: «и те турниры которые уже закрыты, как
-- получилось так».
--
-- ЗАМЕР ПЕРЕД ПРАВКОЙ (14.11): матчей без победителя или в ожидании
-- подтверждения — 207 в турнирах `completed` и 33 в `registration_closed`.
-- Первые висели и каждый день просили счёт у игроков; вторые — идущие
-- турниры с закрытой записью, их матчи счёт ждут по делу.
--
-- Закрытыми для счёта считаем `completed` и `cancelled`. Экран их теперь
-- прячет, но ЭКРАН — НЕ ЗАМОК: запрос уходит в базу напрямую, и держать
-- правило обязана она.
--
-- Одно определение на три зова: `turnir_zakryt_dlya_schyota`.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.turnir_zakryt_dlya_schyota(p_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(t.status IN ('completed', 'cancelled'), false)
      FROM matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
     WHERE m.id = p_match_id;
$$;

COMMENT ON FUNCTION public.turnir_zakryt_dlya_schyota(uuid) IS
    'Закрыт ли турнир этого матча для счёта игроками: completed или cancelled. Баттл без турнира — не закрыт.';

-- ---- Вписать ----

CREATE OR REPLACE FUNCTION public.submit_match_score(
    p_match_id uuid,
    p_score    text,
    p_played_at date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user     uuid := auth.uid();
    v_side     smallint;
    v_match    RECORD;
    v_sets     text[];
    v_set      text;
    v_parts    text[];
    v_g1       integer;
    v_g2       integer;
    v_won1     integer := 0;
    v_won2     integer := 0;
    v_winner   text;
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

    -- ЗАКРЫТЫЙ ТУРНИР: дальше только организатор
    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');
    END IF;

    -- Подтверждённый счёт игрок не переписывает: дальше только организатор
    IF v_match.score_status = 'confirmed' OR
       (v_match.score_status IS NULL AND v_match.winner_id IS NOT NULL) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'already_final');
    END IF;

    -- Разбор счёта. Ждём «6/3 6/4», допускаем тай-брейк в скобках: «7/6(9-7)»
    v_sets := string_to_array(btrim(p_score), ' ');
    IF v_sets IS NULL OR array_length(v_sets, 1) IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'empty_score');
    END IF;

    FOREACH v_set IN ARRAY v_sets LOOP
        v_parts := regexp_match(v_set, '^(\d{1,2})/(\d{1,2})(?:\(\d{1,2}-\d{1,2}\))?$');
        IF v_parts IS NULL THEN
            RETURN jsonb_build_object('ok', false, 'error', 'bad_score', 'set', v_set);
        END IF;
        v_g1 := v_parts[1]::int;
        v_g2 := v_parts[2]::int;
        IF v_g1 = v_g2 THEN
            RETURN jsonb_build_object('ok', false, 'error', 'tied_set', 'set', v_set);
        END IF;
        IF v_g1 > v_g2 THEN v_won1 := v_won1 + 1; ELSE v_won2 := v_won2 + 1; END IF;
    END LOOP;

    IF v_won1 = v_won2 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'no_winner');
    END IF;

    v_winner := CASE WHEN v_won1 > v_won2 THEN v_match.player1_id ELSE v_match.player2_id END;

    UPDATE matches SET
        score               = btrim(p_score),
        winner_id           = v_winner,
        score_status        = 'pending',
        score_submitted_by  = v_user,
        score_submitted_at  = now(),
        played_at           = COALESCE(p_played_at, played_at, CURRENT_DATE)
    WHERE id = p_match_id;

    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'submitted');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о счёте не отправлено: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true, 'winner_id', v_winner);
END;
$$;

-- ---- Подтвердить ----

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

    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');
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

COMMIT;
