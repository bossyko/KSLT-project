    -- ============================================================
    -- Уведомление о счёте доходит до обоих в паре
    -- ============================================================
    --
    -- Права напарникам мы выдали, а уведомление осталось слепым: получателя
    -- оно искало среди тех, кто стоит в записи матча. В парном турнире там
    -- капитаны, и если у капитана нет учётной записи, а есть у напарника —
    -- сообщать оказывалось некому. Вторая пара узнавала о вписанном счёте
    -- только сама, заглянув в кабинет.
    --
    -- Здесь получателей ищем по стороне, а не по записи: берём всех, у кого
    -- есть учётная запись и кто играет за нужную сторону — и капитана, и
    -- напарника. Пишем обоим: подтвердить может любой, и пусть увидят оба.
    --
    -- Кому именно:
    --
    --   вписан      — всей другой стороне: им подтверждать
    --   подтверждён — тому, кто вписывал
    --   оспорен     — ему же
    --
    -- Файл меняет базу. Требует match-score-push.sql и match-score-doubles.sql.

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
        v_моя     smallint;   -- сторона того, кто вписал
        v_другая  smallint;
        v_имя     text;
        v_текст   text;
        v_загол   text;
    BEGIN
        SELECT * INTO m FROM matches WHERE id = p_match_id;
        IF NOT FOUND THEN RETURN; END IF;

        v_моя := public.match_side_of(p_match_id, m.score_submitted_by);
        IF v_моя IS NULL THEN v_моя := 1; END IF;
        v_другая := CASE WHEN v_моя = 1 THEN 2 ELSE 1 END;

        -- Имя того, о ком речь: кто вписал или кто ответил
        SELECT p.name INTO v_имя
          FROM profiles pr JOIN players p ON p.id = pr.player_id
         WHERE pr.id = m.score_submitted_by;

        IF p_повод = 'submitted' THEN
            v_загол := 'Подтвердите счёт';
            v_текст := COALESCE(v_имя, 'Соперник') || ' вписал счёт ' ||
                       replace(COALESCE(m.score, ''), '/', ':') ||
                       '. Подтвердите, если всё верно — иначе через сутки счёт примется как есть.';
        ELSIF p_повод = 'confirmed' THEN
            v_загол := 'Счёт подтверждён';
            v_текст := 'Соперник подтвердил счёт ' ||
                       replace(COALESCE(m.score, ''), '/', ':') || '.';
        ELSE
            v_загол := 'Счёт оспорен';
            v_текст := 'Соперник не согласен со счётом. Разберётся организатор.';
        END IF;

        -- ---- Кому ----
        IF p_повод = 'submitted' THEN
            -- Всей другой стороне: и капитану, и напарнику, у кого есть аккаунт
            FOR v_кому IN
                SELECT pr.id
                  FROM profiles pr
                 WHERE pr.player_id IS NOT NULL
                   AND public.match_side_of(p_match_id, pr.id) = v_другая
            LOOP
                PERFORM public.отправить_о_счёте(v_кому, p_match_id, v_загол, v_текст);
            END LOOP;
        ELSE
            -- Ответ на счёт — тому, кто его вписывал
            IF m.score_submitted_by IS NOT NULL THEN
                PERFORM public.отправить_о_счёте(m.score_submitted_by, p_match_id, v_загол, v_текст);
            END IF;
        END IF;
    END;
    $$;

    -- ---- Одна отправка: колокольчик и push ----
    --
    -- Вынесено отдельно, чтобы не повторять два раза в теле выше.

    CREATE OR REPLACE FUNCTION public.отправить_о_счёте(
        p_кому uuid, p_match_id uuid, p_загол text, p_текст text
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
        INSERT INTO notification_log (profile_id, type, title, message, action_type, action_id)
        VALUES (p_кому, 'match', p_загол, p_текст, 'match_score', p_match_id);

        -- Push. Не ушёл — строка в колокольчике всё равно осталась
        BEGIN
            PERFORM net.http_post(
                url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push',
                headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
                    'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                    'title', p_загол,
                    'message', p_текст,
                    'type', 'match',
                    'audience', 'user',
                    'user_id', p_кому::text,
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

    COMMENT ON FUNCTION public.отправить_о_счёте(uuid, uuid, text, text) IS
        'Одно сообщение о счёте: строка в колокольчике и push.';

    COMMIT;
