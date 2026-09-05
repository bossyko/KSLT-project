-- ============================================================
-- Спорный счёт зовёт организатора
-- ============================================================
--
-- Почти всегда второй игрок счёт подтверждает, и матч идёт дальше сам. Но
-- если он нажал «Не согласен», матч встаёт: сетка не двигается, пока не
-- разберётся человек.
--
-- До сих пор об этом узнавал только тот, кто вписывал счёт. Организатор —
-- никак: он увидел бы спорный матч, только зайдя в админку. Сидеть там
-- сутками никто не будет, и матч висел бы днями.
--
-- Здесь база зовёт облачную функцию score-dispute-notify — она пишет всем
-- администраторам и менеджерам в Telegram и на почту. Строку в колокольчике
-- по-прежнему кладёт сама база.
--
-- Зову только при споре. Обычное подтверждение организатора не касается,
-- и дёргать его на каждый матч значит приучить не читать эти письма.
--
-- Файл меняет базу. Требует match-score-push.sql и развёрнутой функции
-- score-dispute-notify.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_score_dispute(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_кому   uuid;
    v_текст  text;
    m        RECORD;
BEGIN
    SELECT * INTO m FROM matches WHERE id = p_match_id;
    IF NOT FOUND THEN RETURN; END IF;

    v_текст := 'Счёт ' || replace(COALESCE(m.score, ''), '/', ':') ||
               ' оспорен. Матч не пойдёт дальше, пока счёт не подтвердят.';

    -- Строка в колокольчике каждому, кто может разобраться
    FOR v_кому IN
        SELECT id FROM profiles WHERE role IN ('admin', 'manager')
    LOOP
        INSERT INTO notification_log (profile_id, type, title, message, action_type, action_id)
        VALUES (v_кому, 'match', 'Спорный счёт', v_текст, 'match_score', p_match_id);
    END LOOP;

    -- Telegram и почта — через облачную функцию: до них база не дотягивается.
    -- Не ушло — строка в колокольчике всё равно осталась
    BEGIN
        PERFORM net.http_post(
            url := current_setting('app.settings.supabase_url') || '/functions/v1/score-dispute-notify',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object('match_id', p_match_id::text)
        );
    EXCEPTION WHEN others THEN
        RAISE WARNING 'организатор не позван: %', SQLERRM;
    END;
END;
$$;

COMMENT ON FUNCTION public.notify_score_dispute(uuid) IS
    'Зовёт администраторов и менеджеров на спорный счёт: колокольчик, Telegram, почта.';

-- ---- Зовём из отказа ----

CREATE OR REPLACE FUNCTION public.dispute_match_score(p_match_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user  uuid := auth.uid();
    v_side  smallint;
    v_match RECORD;
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

    IF v_match.score_submitted_by = v_user THEN
        RETURN jsonb_build_object('ok', false, 'error', 'own_score');
    END IF;

    UPDATE matches SET
        score_status       = 'disputed',
        score_dispute_note = NULLIF(btrim(COALESCE(p_note, '')), '')
    WHERE id = p_match_id;

    -- Автору счёта — что с ним не согласились
    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'disputed');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о споре не отправлено: %', SQLERRM;
    END;

    -- Организатору — что матч встал и ждёт его
    BEGIN
        PERFORM public.notify_score_dispute(p_match_id);
    EXCEPTION WHEN others THEN
        RAISE WARNING 'организатор не позван: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispute_match_score(uuid, text) TO authenticated;

COMMIT;
