-- ============================================
-- Отмена баттла: со следом и с объяснением
-- ============================================
--
-- Что было не так.
--
-- При принятии вызова анонс «Скоро баттл» уходит всему клубу. А убрать
-- баттл после этого можно было только одним способом — удалить запись. Она
-- исчезала бесследно, и люди, которым только что объявили о матче,
-- оставались ждать игру, которой не будет. Ни отмены, ни причины, ни
-- сообщения.
--
-- Игроки при этом отменить не могли вовсе: cancel_challenge работает, пока
-- вызов ждёт ответа, а после принятия кнопка пропадает.
--
-- Что делаем.
--
--   cancel_battle(id, причина) — отменяет менеджер или админ. Запись не
--   удаляется: остаётся со статусом cancelled и причиной, видна и игрокам,
--   и в админке во вкладке «Завершённые».
--
--   Рассылка идёт той же дорогой, что и анонс о принятии: строка в журнале
--   плюс по строке каждому, связанные push_id. Значит её можно отозвать, и
--   она уважает переключатель «Вызовы» в настройках. Участникам приходит
--   отдельно и без фильтра: их это касается лично.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Причина отмены -------------------------------------------------
ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS cancel_reason text;

COMMENT ON COLUMN public.challenges.cancel_reason IS
    'Почему баттл отменён. Уходит в рассылку и остаётся в записи.';


-- ---- 3. Отмена ---------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."cancel_battle"(
    "p_id" "uuid", "p_reason" "text" DEFAULT NULL)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    ch          challenges%ROWTYPE;
    chal_name   text;
    opp_name    text;
    note_title  text;
    note_text   text;
    push_row    uuid;
    sent_count  int;
    reason      text;
BEGIN
    SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'manager') THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    SELECT * INTO ch FROM challenges WHERE id = p_id;
    IF ch.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    -- Отменять есть что только у принятого или опубликованного: остальное
    -- либо ещё не состоялось, либо уже сыграно
    IF ch.status NOT IN ('accepted') THEN
        RETURN jsonb_build_object('error', 'not_cancellable', 'status', ch.status);
    END IF;

    reason := nullif(btrim(coalesce(p_reason, '')), '');

    UPDATE challenges
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = auth.uid(),
        cancel_reason = reason,
        battle_published = false
    WHERE id = p_id;

    SELECT full_name INTO chal_name FROM profiles WHERE id = ch.challenger_id;
    SELECT full_name INTO opp_name FROM profiles WHERE id = ch.opponent_profile_id;

    note_title := 'Баттл отменён';
    note_text  := COALESCE(ch.battle_title, COALESCE(chal_name, 'Игрок') || ' — ' || COALESCE(opp_name, 'игрок')) ||
                  ': матч не состоится.' || COALESCE(' ' || reason, '');

    -- Клубу — той же дорогой, что и анонс о принятии
    INSERT INTO push_log (admin_id, title, message, type, audience, recipients_count, fcm_sent)
    VALUES (auth.uid(), note_title, note_text, 'battle', 'all', 0, 0)
    RETURNING id INTO push_row;

    INSERT INTO notification_log (profile_id, type, title, message, is_read, push_id)
    SELECT p.id, 'battle', note_title, note_text, false, push_row
    FROM profiles p
    WHERE p.id <> ch.challenger_id
      AND (ch.opponent_profile_id IS NULL OR p.id <> ch.opponent_profile_id)
      AND COALESCE(p.notify_preferences #>> '{site,challenges}', 'true') <> 'false';

    GET DIAGNOSTICS sent_count = ROW_COUNT;
    UPDATE push_log SET recipients_count = sent_count WHERE id = push_row;

    -- Участникам — лично и без фильтра: их это касается напрямую
    INSERT INTO notification_log (profile_id, type, title, message, is_read, push_id)
    SELECT p.id, 'battle', note_title, note_text, false, push_row
    FROM profiles p
    WHERE p.id IN (ch.challenger_id, ch.opponent_profile_id);

    RETURN jsonb_build_object('ok', true, 'notified', sent_count);
END;
$$;

ALTER FUNCTION "public"."cancel_battle"("uuid", "text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."cancel_battle"("uuid", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_battle"("uuid", "text") TO "service_role";


-- ---- 4. ПРОВЕРКА -------------------------------------------------------
SELECT
    (SELECT count(*) FROM pg_proc WHERE proname = 'cancel_battle') AS функция_есть,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges' AND column_name = 'cancel_reason') AS причина_есть,
    (SELECT count(*) FROM challenges WHERE status = 'cancelled') AS отменённых_сейчас;
