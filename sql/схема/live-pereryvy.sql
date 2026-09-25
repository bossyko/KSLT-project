-- ═════════════════════════════════════════════════════════════════════════
-- КСЛТ · ПЕРЕРЫВЫ МАТЧА: ПРИЧИНА ПАУЗЫ И ПЕРЕРЫВ ПО СЧЁТУ
-- Решение Кости 25.09. Запускать ПОСЛЕ live-auto-challenge-migration.sql.
--
-- ЧТО БЫЛО СЛОМАНО. Статус матча знал одно слово — paused, — и в базе дождь
-- не отличался от травмы. А перерывы, которые ставит САМ СЧЁТ (смена сторон
-- после нечётного гейма и перерыв между сетами), до базы не доходили вовсе:
-- они жили в памяти браузера судьи (js/umpire.js:290–292). Зритель на
-- странице матча видел обычный LIVE и не понимал, почему две минуты ничего
-- не происходит.
--
-- ТРИ РЯДА ВМЕСТО ОДНОГО:
--   status       — в каком состоянии матч: warmup · live · paused · completed
--   pause_reason — почему судья остановил: medical · toilet · weather · other
--   break_kind   — перерыв, который ставит СЧЁТ: changeover · set_break
--
-- ПРИЧИНА ХРАНИТСЯ КОДОМ, А НЕ СЛОВОМ. Судейский экран русский, а страница
-- матча и табло трёхъязычные: слово собирает та страница, которая
-- показывает. Одно определение на одно понятие — словарь один, js/live-texts.js.
--
-- ПЯТОЙ ПРИЧИНЫ НЕТ НАМЕРЕННО. «Технический» — сетка, мяч, свет — закрывает
-- other. Каждая лишняя кнопка это лишнее решение в тот момент, когда судье
-- надо действовать.
--
-- ВРЕМЯ ПЕРЕРЫВОВ: 120 секунд смена сторон, 180 между сетами. Решение Кости
-- 25.09 — на треть длиннее правил ITF (90 и 120) и вдвое короче прежних
-- 180 и 300. Само время в базе не хранится: хранится МОМЕНТ ОКОНЧАНИЯ
-- (break_until), чтобы зритель видел тот же отсчёт, что и судья, и чтобы
-- перезагрузка страницы его не сбрасывала.
-- ═════════════════════════════════════════════════════════════════════════

ALTER TABLE public.live_matches
    ADD COLUMN IF NOT EXISTS pause_reason text
    CHECK (pause_reason IN ('medical', 'toilet', 'weather', 'other'));

ALTER TABLE public.live_matches
    ADD COLUMN IF NOT EXISTS break_kind text
    CHECK (break_kind IN ('changeover', 'set_break'));

ALTER TABLE public.live_matches
    ADD COLUMN IF NOT EXISTS break_until timestamptz;

COMMENT ON COLUMN public.live_matches.pause_reason IS
    'Почему судья остановил матч: medical, toilet, weather, other. Только при status = paused. NULL значит «не пауза» или «причина не названа».';
COMMENT ON COLUMN public.live_matches.break_kind IS
    'Перерыв, который ставит счёт: changeover — смена сторон, set_break — перерыв между сетами. Ставится не судьёй, а правилами.';
COMMENT ON COLUMN public.live_matches.break_until IS
    'Момент окончания перерыва. Хранится время окончания, а не длительность: отсчёт у зрителя и у судьи обязан быть один, и перезагрузка его не сбрасывает.';

-- ── СОХРАНЕНИЕ СОСТОЯНИЯ ЗНАЕТ ПРО ПЕРЕРЫВЫ ─────────────────────────────
-- Функция переписана целиком (CREATE OR REPLACE иначе не умеет). Всё, что
-- было, сохранено дословно; добавлены три поля и одна уборка.
CREATE OR REPLACE FUNCTION umpire_save_state(p_key TEXT, p_state JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_id UUID; v_live RECORD; v_prof1_id UUID; v_prof2_id UUID; v_score TEXT;
BEGIN
    SELECT id INTO v_id FROM live_matches WHERE umpire_key = p_key;
    IF v_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid umpire key'); END IF;
    UPDATE live_matches SET
        serving_player = COALESCE((p_state->>'serving_player')::int, serving_player),
        points_p1 = COALESCE(p_state->>'points_p1', points_p1),
        points_p2 = COALESCE(p_state->>'points_p2', points_p2),
        current_set = COALESCE((p_state->>'current_set')::int, current_set),
        sets_data = COALESCE(p_state->'sets_data', sets_data),
        current_game_p1 = COALESCE((p_state->>'current_game_p1')::int, current_game_p1),
        current_game_p2 = COALESCE((p_state->>'current_game_p2')::int, current_game_p2),
        is_tiebreak = COALESCE((p_state->>'is_tiebreak')::boolean, is_tiebreak),
        tiebreak_p1 = COALESCE((p_state->>'tiebreak_p1')::int, tiebreak_p1),
        tiebreak_p2 = COALESCE((p_state->>'tiebreak_p2')::int, tiebreak_p2),
        status = COALESCE(p_state->>'status', status),
        winner_player = (p_state->>'winner_player')::int,
        final_score = p_state->>'final_score',
        history = COALESCE(p_state->'history', history),
        /* ПЕРЕРЫВЫ. Пишутся БЕЗ COALESCE: здесь NULL — это значение, а не
           «не прислали». Судья снял паузу — причина обязана исчезнуть, иначе
           зритель увидит «медицинский» посреди идущей игры. */
        pause_reason = CASE WHEN COALESCE(p_state->>'status', status) = 'paused'
                            THEN NULLIF(p_state->>'pause_reason', '') END,
        break_kind   = NULLIF(p_state->>'break_kind', ''),
        break_until  = NULLIF(p_state->>'break_until', '')::timestamptz,
        started_at = CASE WHEN p_state->>'status' = 'live' AND started_at IS NULL THEN now() ELSE started_at END,
        completed_at = CASE WHEN p_state->>'status' = 'completed' THEN now() ELSE completed_at END
    WHERE id = v_id;
    IF p_state->>'status' = 'completed' THEN
        SELECT match_id, player1_id, player2_id, final_score INTO v_live FROM live_matches WHERE id = v_id;
        v_score := COALESCE(p_state->>'final_score', v_live.final_score);
        IF v_live.match_id IS NULL
           AND (v_live.player1_id IS NOT NULL OR v_live.player2_id IS NOT NULL)
           AND NOT EXISTS (SELECT 1 FROM challenges WHERE live_match_id = v_id)
        THEN
            SELECT p.id INTO v_prof1_id FROM profiles p WHERE p.player_id = v_live.player1_id LIMIT 1;
            SELECT p.id INTO v_prof2_id FROM profiles p WHERE p.player_id = v_live.player2_id LIMIT 1;
            INSERT INTO challenges (challenger_id, challenger_player_id, opponent_player_id, opponent_profile_id, proposed_date, proposed_time, status, score_draft, live_match_id, created_at, expires_at, accepted_at)
            VALUES (v_prof1_id, v_live.player1_id, v_live.player2_id, v_prof2_id, CURRENT_DATE, to_char(now() AT TIME ZONE 'Asia/Bishkek', 'HH24:MI'), 'completed', v_score, v_id, now(), now() + interval '72 hours', now());
        END IF;
    END IF;
    RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

-- ── ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS» ────────────────────────────
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'live_matches'
   AND column_name IN ('pause_reason', 'break_kind', 'break_until')
 ORDER BY column_name;
