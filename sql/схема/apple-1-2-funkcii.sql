-- ============================================================================
-- КСЛТ · Apple 1.2 — ТРИ ФУНКЦИИ: пожаловаться, заблокировать, разблокировать
-- 04.11.2026. Прогонять ПОСЛЕ `apple-1-2-zhaloby-blokirovki.sql`.
-- Запускать можно повторно.
-- ============================================================================
--
-- ПОЧЕМУ ФУНКЦИИ, А НЕ ЗАПРОСЫ ИЗ ПРИЛОЖЕНИЯ. Три причины, и каждая
-- замерена, а не придумана:
--
--   1. `players.id` — ТЕКСТ (`schema-snapshot.sql:652`), а
--      `content_reports.target_id` и `user_blocks.*_profile_id` — uuid.
--      Связь живёт в `profiles.player_id` (`:717`). Чтобы приложение
--      связало их само, ему пришлось бы читать чужой `profiles` — право
--      на это я НЕ ПРОВЕРЯЛ ЧТЕНИЕМ БАЗЫ, и строить на нём не буду.
--
--   2. Блокировка обязана отменить живой баттл. Писать в `challenges`
--      из приложения нельзя: матч — общая запись двоих.
--
--   3. ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Правила «нельзя себя», «одна
--      жалоба на один объект», «отмена тихая» должны лежать в одном
--      месте, иначе сайт и приложение разойдутся на первой же правке.
--
-- ТИХАЯ ОТМЕНА — РЕШЕНИЕ КОСТИ 04.11, и вот чем она отличается от
-- админской `cancel_battle` (`schema-snapshot.sql:1855-1862`):
--   · админская шлёт push ВСЕМУ КЛУБУ («Баттл отменён … матч не
--     состоится») — здесь этого НЕТ;
--   · здесь уходит одно личное уведомление второй стороне, и текст его
--     неотличим от честного отказа: слова «заблокировал» в нём нет.
--     ЗАБЛОКИРОВАННЫЙ НЕ УЗНАЁТ О БЛОКИРОВКЕ — это записано политикой
--     `user_blocks_own_all` и должно держаться и здесь.
-- Админ при этом видит всё: `cancel_reason = 'blocked'` стоит в самой
-- записи баттла, а `user_blocks` открыта сотруднику той же политикой.

BEGIN;

-- ── 1. ПОЖАЛОВАТЬСЯ ──────────────────────────────────────────────────────
-- p_target: для 'player' / 'avatar' / 'bio' — это `players.id` (текст),
--           для 'battle' — это `challenges.id` (uuid строкой).
CREATE OR REPLACE FUNCTION public.kslt_pozhalovatsya(
    p_target_kind text,
    p_target      text,
    p_reason      text,
    p_note        text DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_me     uuid := auth.uid();
    v_target uuid;
    v_note   text;
BEGIN
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;

    IF p_target_kind NOT IN ('player', 'battle', 'avatar', 'bio') THEN
        RETURN jsonb_build_object('error', 'bad_kind');
    END IF;
    IF p_reason NOT IN ('offensive', 'spam', 'fake', 'foreign_photo', 'other') THEN
        RETURN jsonb_build_object('error', 'bad_reason');
    END IF;

    IF p_target_kind = 'battle' THEN
        -- Чужая строка вместо uuid — это «не найдено», а не падение базы.
        BEGIN
            SELECT id INTO v_target FROM challenges WHERE id = p_target::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RETURN jsonb_build_object('error', 'not_found');
        END;
    ELSE
        -- Жалоба всегда на ЧЕЛОВЕКА, даже когда повод — фотография или
        -- «о себе»: убирать придётся у профиля, а не у карточки.
        SELECT id INTO v_target FROM profiles WHERE player_id = p_target;
    END IF;

    IF v_target IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;
    IF p_target_kind <> 'battle' AND v_target = v_me THEN
        RETURN jsonb_build_object('error', 'self');
    END IF;

    -- Пустая заметка — это NULL, а не пустая строка: иначе в разборе
    -- появится столбец, полный кавычек ни о чём.
    v_note := nullif(btrim(coalesce(p_note, '')), '');
    IF v_note IS NOT NULL AND length(v_note) > 1000 THEN
        v_note := left(v_note, 1000);
    END IF;

    BEGIN
        INSERT INTO content_reports (reporter_profile_id, target_kind, target_id, reason, note)
        VALUES (v_me, p_target_kind, v_target, p_reason, v_note);
    EXCEPTION WHEN unique_violation THEN
        -- ОДИН ЧЕЛОВЕК — ОДНА ЖАЛОБА НА ОДИН ОБЪЕКТ. Повтор не ошибка
        -- человека, а наше правило: говорим о нём словами.
        RETURN jsonb_build_object('error', 'already');
    END;

    RETURN jsonb_build_object('ok', true);
END;
$function$;

-- ── 2. ЗАБЛОКИРОВАТЬ ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.kslt_zablokirovat(p_player_id text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_me        uuid := auth.uid();
    v_him       uuid;
    v_my_player text;
    v_otmeneno  int  := 0;
    v_par       int  := 0;
    r           record;
BEGIN
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;

    SELECT id INTO v_him FROM profiles WHERE player_id = p_player_id;
    IF v_him IS NULL THEN
        -- Карточки без учётной записи блокировать не от кого: вызовов и
        -- контактов оттуда прийти не может.
        RETURN jsonb_build_object('error', 'no_account');
    END IF;
    IF v_him = v_me THEN
        RETURN jsonb_build_object('error', 'self');
    END IF;

    SELECT player_id INTO v_my_player FROM profiles WHERE id = v_me;

    INSERT INTO user_blocks (blocker_profile_id, blocked_profile_id)
    VALUES (v_me, v_him)
    ON CONFLICT (blocker_profile_id, blocked_profile_id) DO NOTHING;

    -- ---- тихая отмена живых баттлов между нами ----
    -- ПАРНЫЕ НЕ ТРОГАЕМ, И ЭТО РЕШЕНИЕ: парный матч — договорённость
    -- ЧЕТВЕРЫХ. Ссора двоих не вправе снять игру с остальных двух.
    -- Считаем их отдельно, чтобы приложение могло сказать об этом вслух.
    SELECT count(*) INTO v_par
      FROM challenges
     WHERE status IN ('active', 'accepted')
       AND coalesce(format, 'singles') <> 'singles'
       AND ( (challenger_id = v_me AND opponent_profile_id = v_him)
          OR (challenger_id = v_him AND opponent_profile_id = v_me) );

    -- UPDATE ЖИВЁТ В CTE, А НЕ В ЗАГОЛОВКЕ ЦИКЛА: `FOR … IN UPDATE`
    -- в PL/pgSQL не бывает, цикл принимает только SELECT.
    FOR r IN
        WITH снято AS (
            UPDATE challenges
               SET status           = 'cancelled',
                   cancelled_at     = now(),
                   cancelled_by     = v_me,
                   cancel_reason    = 'blocked',
                   battle_published = false
             WHERE status IN ('active', 'accepted')
               AND coalesce(format, 'singles') = 'singles'
               AND ( (challenger_id = v_me AND opponent_profile_id = v_him)
                  OR (challenger_id = v_him AND opponent_profile_id = v_me) )
            RETURNING id, challenger_id, opponent_profile_id,
                      accepted_at, battle_title
        )
        SELECT * FROM снято
    LOOP
        v_otmeneno := v_otmeneno + 1;

        -- Второй стороне — ОДНО личное уведомление, и текст его
        -- неотличим от обычного. Push всему клубу не уходит: в
        -- `push_log` эта функция не пишет вовсе.
        INSERT INTO notification_log (profile_id, type, title, message, is_read)
        VALUES (
            CASE WHEN r.challenger_id = v_me THEN r.opponent_profile_id
                 ELSE r.challenger_id END,
            'challenge',
            CASE WHEN r.accepted_at IS NOT NULL THEN 'Матч отменён'
                 ELSE 'Вызов отклонён' END,
            CASE WHEN r.accepted_at IS NOT NULL
                 THEN coalesce(r.battle_title || ': матч не состоится.',
                               'Матч не состоится.')
                 ELSE 'Вызов отклонён.' END,
            false
        );
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'otmeneno', v_otmeneno, 'parnyh', v_par);
END;
$function$;

-- ── 3. РАЗБЛОКИРОВАТЬ ────────────────────────────────────────────────────
-- ОТМЕНЁННЫЙ БАТТЛ НЕ ВОСКРЕСАЕТ: матч, который отменили, назначают
-- заново, а не достают обратно. Снятие блокировки возвращает только
-- возможность позвать.
CREATE OR REPLACE FUNCTION public.kslt_razblokirovat(p_player_id text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_me  uuid := auth.uid();
    v_him uuid;
BEGIN
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;

    SELECT id INTO v_him FROM profiles WHERE player_id = p_player_id;
    IF v_him IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    DELETE FROM user_blocks
     WHERE blocker_profile_id = v_me AND blocked_profile_id = v_him;

    RETURN jsonb_build_object('ok', true);
END;
$function$;

-- ── 4. ПРАВА ─────────────────────────────────────────────────────────────
-- Звать может только вошедший: `authenticated`, не `anon`.
REVOKE ALL ON FUNCTION public.kslt_pozhalovatsya(text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.kslt_zablokirovat(text) FROM public;
REVOKE ALL ON FUNCTION public.kslt_razblokirovat(text) FROM public;
GRANT EXECUTE ON FUNCTION public.kslt_pozhalovatsya(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_zablokirovat(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_razblokirovat(text) TO authenticated;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS». Выполнить ПОСЛЕ прогона и
-- сверить глазами — три запроса, три ожидаемых ответа.
-- ============================================================================

-- 1) Три функции на месте, и все три SECURITY DEFINER.
--    Ждём ТРИ строки, у каждой `definer = true`.
-- SELECT p.proname, p.prosecdef AS definer
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname LIKE 'kslt_%'
--    AND p.proname IN ('kslt_pozhalovatsya','kslt_zablokirovat','kslt_razblokirovat')
--  ORDER BY 1;

-- 2) Звать может `authenticated` и НЕ может `anon`.
--    Ждём: anon = false, authenticated = true, по каждой из трёх.
-- SELECT p.proname,
--        has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public'
--    AND p.proname IN ('kslt_pozhalovatsya','kslt_zablokirovat','kslt_razblokirovat')
--  ORDER BY 1;

-- 3) ГЛАВНОЕ: блокировка НЕ ШЛЁТ ПУШ КЛУБУ.
--
--    ЗДЕСЬ БЫЛА ДЫРА, И ОНА СРАБОТАЛА 04.11 НА КОСТЕ. Запрос искал
--    подстроку `push_log` во всём определении функции и вернул `true` —
--    но нашёл он её В КОММЕНТАРИИ, который сам же и объясняет, что
--    записи туда нет. ПРАВИЛО, СЧИТАЮЩЕЕ ПОДСТРОКУ, НЕ СЧИТАЕТ
--    ОБЪЯВЛЕНИЙ: то же самое ловило `@font-face-ВЫКИНУТ` и зов,
--    неотличимый от объявления функции.
--
--    Чинится двумя способами сразу, и оба ниже: вырезать комментарии
--    перед поиском И искать не слово, а ЗАПИСЬ.
--    Ждём: bez_kommentariev = false, est_zapis = false.
--
-- SELECT position('push_log' in
--          regexp_replace(pg_get_functiondef(p.oid), '--[^\n]*', '', 'g')) > 0
--            AS bez_kommentariev,
--        pg_get_functiondef(p.oid) ~* 'INSERT\s+INTO\s+push_log'
--            AS est_zapis
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname = 'kslt_zablokirovat';
