-- ============================================
-- Автор вызова не узнаёт, что ему ответили
-- ============================================
--
-- При принятии вызова всему клубу уходит анонс «Скоро баттл», но самих
-- участников он обходит намеренно: они и так знают. Проблема в том, что
-- знает только тот, кто нажал кнопку.
--
-- Автор вызова не получает ничего. Отправил — и дальше сам заглядывай в
-- кабинет: приняли, отклонили или всё ещё молчат. При отказе то же самое.
--
-- Добавляем ему личное уведомление. Оно адресное, поэтому переключателем
-- «Вызовы» в настройках не фильтруется: это ответ на его собственное
-- действие, а не новость про чужой матч.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Ответ на вызов уведомляет автора -------------------------------
CREATE OR REPLACE FUNCTION "public"."respond_to_challenge"(
    "p_id" "uuid", "p_accept" boolean)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    ch         challenges%ROWTYPE;
    chal_name  text;
    opp_name   text;
    note_title text;
    note_text  text;
    push_row   uuid;
    sent_count int;
BEGIN
    SELECT * INTO ch FROM challenges WHERE id = p_id;
    IF ch.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    -- Отвечает только тот, кого вызвали
    IF ch.opponent_profile_id IS DISTINCT FROM auth.uid() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    -- Уведомление — снимок момента: к нажатию на кнопку могли уже ответить
    -- или срок мог выйти. Молча перезаписывать чужой ответ нельзя
    IF ch.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'already_answered', 'status', ch.status);
    END IF;
    IF ch.expires_at <= now() THEN
        UPDATE challenges SET status = 'expired' WHERE id = p_id;
        RETURN jsonb_build_object('error', 'expired');
    END IF;

    UPDATE challenges
    SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
        accepted_at = CASE WHEN p_accept THEN now() ELSE NULL END
    WHERE id = p_id;

    SELECT full_name INTO chal_name FROM profiles WHERE id = ch.challenger_id;
    SELECT full_name INTO opp_name FROM profiles WHERE id = ch.opponent_profile_id;

    -- Автору — лично. Он отправил вызов и до сих пор узнавал об ответе,
    -- только сам заглянув в кабинет
    INSERT INTO notification_log (profile_id, type, title, message, is_read,
                                  action_type, action_id)
    VALUES (
        ch.challenger_id, 'challenge',
        CASE WHEN p_accept THEN 'Вызов принят' ELSE 'Вызов отклонён' END,
        COALESCE(opp_name, 'Соперник') ||
        CASE WHEN p_accept
             THEN ' принял ваш вызов.'
             ELSE ' отклонил ваш вызов.' END,
        false, 'challenge', p_id);

    -- Вызов приняли — об этом знает весь клуб. Публичной страницы у баттла
    -- ещё нет: дату и место назначит менеджер, а пока идёт анонс
    IF p_accept THEN
        note_title := '🔥 Скоро баттл';
        note_text  := COALESCE(chal_name, 'Игрок') || ' и ' || COALESCE(opp_name, 'игрок') ||
                      ' сыграют показательный матч. Дату и место объявим в ближайшее время.';

        INSERT INTO push_log (admin_id, title, message, type, audience, recipients_count, fcm_sent)
        VALUES (NULL, note_title, note_text, 'battle', 'all', 0, 0)
        RETURNING id INTO push_row;

        -- Участников не тревожим этим анонсом: им ушло личное
        INSERT INTO notification_log (profile_id, type, title, message, is_read, push_id)
        SELECT p.id, 'battle', note_title, note_text, false, push_row
        FROM profiles p
        WHERE p.id <> ch.challenger_id
          AND (ch.opponent_profile_id IS NULL OR p.id <> ch.opponent_profile_id)
          AND COALESCE(p.notify_preferences #>> '{site,challenges}', 'true') <> 'false';

        GET DIAGNOSTICS sent_count = ROW_COUNT;
        UPDATE push_log SET recipients_count = sent_count WHERE id = push_row;
    END IF;

    RETURN jsonb_build_object('ok', true,
        'status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
        'challenger_player_id', ch.challenger_player_id,
        'opponent_player_id', ch.opponent_player_id);
END;
$$;

ALTER FUNCTION "public"."respond_to_challenge"("uuid", boolean) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."respond_to_challenge"("uuid", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_challenge"("uuid", boolean) TO "service_role";


-- ---- 3. ПРОВЕРКА ------------------------------------------------------
SELECT
    (SELECT count(*) FROM pg_proc WHERE proname = 'respond_to_challenge') AS функция_есть,
    (SELECT count(*) FROM pg_proc
      WHERE proname = 'respond_to_challenge'
        AND prosrc LIKE '%Вызов принят%') AS уведомляет_автора;
