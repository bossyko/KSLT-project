-- ============================================================
-- Уведомления о счёте матча
-- ============================================================
--
-- Счёт вписывать научились, а сообщить второму — нет. Он узнавал о том, что
-- надо подтвердить, только если сам зайдёт в кабинет. Половина матчей так и
-- висела бы до суточного срока.
--
-- Здесь функция подписывает соперника: строка в колокольчике на сайте и в
-- приложении. Строка ведёт прямо к матчу — это `action_type` и `action_id`,
-- по ним и сайт, и приложение открывают окно.
--
-- Push отдельной задачей: он идёт через облачную функцию, а её из базы зовут
-- через net.http_post, и класть это в тот же файл значит смешивать два
-- разных пути отказа. Колокольчик работает сам по себе.
--
-- Файл меняет базу. Требует match-score-by-players.sql.

BEGIN;

-- ---- Кому и о чём сказать ----

CREATE OR REPLACE FUNCTION public.notify_match_score(p_match_id uuid, p_повод text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    m         RECORD;
    v_кому    uuid;
    v_чей     text;      -- карточка того, кому пишем
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
END;
$$;

COMMENT ON FUNCTION public.notify_match_score(uuid, text) IS
    'Строка в колокольчике сопернику: вписан счёт, подтверждён или оспорен.';

-- ---- Те же три функции, теперь с оповещением ----
--
-- Переписываем целиком, а не оборачиваем: обёртка над обёрткой прячет,
-- где на самом деле делается работа.

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
        score              = btrim(p_score),
        winner_id          = v_winner,
        status             = 'completed',
        played_at          = COALESCE(p_played_at::timestamptz, played_at, now()),
        score_status       = 'pending',
        score_submitted_by = v_user,
        score_submitted_at = now(),
        score_confirmed_at = NULL,
        score_dispute_note = NULL
    WHERE id = p_match_id;

    -- Сопернику — строка в колокольчике. Не отправилось — счёт всё равно
    -- остаётся: уведомление не должно ронять сохранение
    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'submitted');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о счёте не отправлено: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true, 'winner_id', v_winner,
                              'awaiting_side', CASE WHEN v_side = 1 THEN 2 ELSE 1 END);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_match_score(p_match_id uuid)
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
        RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_confirm');
    END IF;

    -- Подтверждает второй, а не тот же самый человек
    IF v_match.score_submitted_by = v_user THEN
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

    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'disputed');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о споре не отправлено: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_match_score(uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_match_score(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_match_score(uuid, text)      TO authenticated;

COMMIT;
