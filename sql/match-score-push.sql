-- ============================================================
-- Push о счёте матча
-- ============================================================
--
-- Строку в колокольчике мы уже пишем, но человек, закрывший приложение, о
-- ней не узнает. Push нужен именно здесь: счёт ждёт ответа сутки, и молчание
-- второго — самая частая причина, по которой матч зависает.
--
-- Отправляет облачная функция send-push. Из базы её зовут так же, как зовут
-- напоминания о матчах и членстве, — через net.http_post с тем же секретом.
--
-- В теле push едет номер матча: без него нажатие открывало бы просто раздел,
-- а не тот матч, о котором весть. Для этого в send-push добавлено поле
-- action_id — её надо переразвернуть вместе с этим файлом.
--
-- Строку в колокольчике мы уже завели сами, поэтому просим функцию не
-- заводить вторую: skip_log.
--
-- Файл меняет базу. Требует match-score-notify.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_match_score(p_match_id uuid, p_повод text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    m         RECORD;
    v_кому    uuid;
    v_чей     text;
    v_другой  text;
    v_имя     text;
    v_текст   text;
    v_загол   text;
BEGIN
    SELECT * INTO m FROM matches WHERE id = p_match_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- Кому писать, зависит от повода.
    --
    --   вписан     — второму: это ему подтверждать
    --   подтверждён и оспорен — тому, кто вписывал: это ответ на его счёт
    IF p_повод = 'submitted' THEN
        SELECT pr.id, pr.player_id INTO v_кому, v_чей
          FROM profiles pr
         WHERE pr.player_id IN (m.player1_id, m.player2_id)
           AND pr.id IS DISTINCT FROM m.score_submitted_by
         LIMIT 1;
    ELSE
        SELECT pr.id, pr.player_id INTO v_кому, v_чей
          FROM profiles pr
         WHERE pr.id = m.score_submitted_by
         LIMIT 1;
    END IF;

    IF v_кому IS NULL THEN RETURN; END IF;      -- у него нет учётной записи

    v_другой := CASE WHEN v_чей = m.player1_id THEN m.player2_id ELSE m.player1_id END;
    SELECT name INTO v_имя FROM players WHERE id = v_другой;

    IF p_повод = 'submitted' THEN
        v_загол := 'Подтвердите счёт';
        v_текст := COALESCE(v_имя, 'Соперник') || ' вписал счёт ' ||
                   replace(COALESCE(m.score, ''), '/', ':') ||
                   '. Подтвердите, если всё верно — иначе через сутки счёт примется как есть.';
    ELSIF p_повод = 'confirmed' THEN
        v_загол := 'Счёт подтверждён';
        v_текст := COALESCE(v_имя, 'Соперник') || ' подтвердил счёт ' ||
                   replace(COALESCE(m.score, ''), '/', ':') || '.';
    ELSE
        v_загол := 'Счёт оспорен';
        v_текст := COALESCE(v_имя, 'Соперник') || ' не согласен со счётом. Разберётся организатор.';
    END IF;

    INSERT INTO notification_log (profile_id, type, title, message, action_type, action_id)
    VALUES (v_кому, 'match', v_загол, v_текст, 'match_score', p_match_id);

    -- Push. Не ушёл — строка в колокольчике всё равно осталась, поэтому
    -- ошибку глушим: человек узнает при следующем заходе
    BEGIN
        PERFORM net.http_post(
            url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'title', v_загол,
                'message', v_текст,
                'type', 'match',
                'audience', 'user',
                'user_id', v_кому::text,
                'action_type', 'match_score',
                'action_id', p_match_id::text,
                'skip_log', true
            )
        );
    EXCEPTION WHEN others THEN
        RAISE WARNING 'push о счёте не отправлен: %', SQLERRM;
    END;
END;
$$;

COMMENT ON FUNCTION public.notify_match_score(uuid, text) IS
    'Сообщает о счёте: строка в колокольчике и push. Кому — зависит от повода.';

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================
-- 1. Заданы ли настройки, по которым база зовёт облачные функции.
--    Обе должны вернуть значение, а не ошибку.
--
-- SELECT current_setting('app.settings.supabase_url');
-- SELECT left(current_setting('app.settings.cron_secret'), 6) || '...';
--
-- 2. Последние обращения к облачным функциям — видно, ушёл ли push.
--
-- SELECT id, url, status_code, created
--   FROM net._http_response
--  ORDER BY created DESC
--  LIMIT 5;
