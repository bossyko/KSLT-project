-- ============================================================
-- ЗАМОК НА ТРЕТЬЕЙ ДВЕРИ: спор о счёте в закрытом турнире
-- 14 ноября. Вопрос Кости: «уведомления у других и новых игроков не
-- будут появляться на старые закрытые турниры?»
--
-- ЧЕСТНЫЙ ОТВЕТ БЫЛ «ПОЧТИ». Первым заходом я закрыла `submit` и
-- `confirm`, а `dispute` оставила — и осталась щель: матч завершённого
-- турнира, у которого счёт висит в `pending` ещё с тех пор, можно было
-- оспорить. А `dispute` зовёт ДВА уведомления: игроку и организатору.
--
-- ДВЕРЬ, ЗАПЕРТАЯ НА ДВУХ ЗАМКАХ ИЗ ТРЁХ, НЕ ЗАПЕРТА.
--
-- `nothing_to_dispute` эту щель не закрывает: он смотрит на статус
-- СЧЁТА, а не турнира, и в 207 висящих матчах как раз и бывает pending.
-- ============================================================

BEGIN;

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

    -- ЗАКРЫТЫЙ ТУРНИР: спорить не о чем, решает организатор
    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');
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

-- ---- Автоприём тоже не трогает закрытые ----
--
-- Он молча ставит `confirmed` по часам. В завершённом турнире это
-- меняет запись без ведома организатора, и в сетке вдруг появляется
-- победитель, которого никто не утверждал.

CREATE OR REPLACE FUNCTION public.accept_stale_match_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n integer := 0;
BEGIN
    UPDATE matches m SET
        score_status       = 'confirmed',
        score_confirmed_at = now()
     WHERE m.score_status = 'pending'
       AND m.score_submitted_at < now() - interval '24 hours'
       AND NOT public.turnir_zakryt_dlya_schyota(m.id);
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$;

COMMIT;
