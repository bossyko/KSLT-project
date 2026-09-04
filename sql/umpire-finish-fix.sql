-- ============================================================
-- Судья не мог завершить матч
-- ============================================================
--
-- Судейская страница показывала «Матч завершён» и победителя, а на Live
-- матч продолжал идти. В базе он и правда оставался живым: статус live,
-- победитель пуст, счёт не записан. Последний розыгрыш тоже пропадал.
--
-- Сохранение состояния идёт через umpire_save_state. При завершении матча
-- функция, кроме записи счёта, заводит запись о сыгранной встрече в
-- challenges. Вот эта вставка и падала — а раз она в той же транзакции,
-- вместе с ней откатывалось всё сохранение целиком.
--
-- Падала на проверке challenges_side_filled: сторона должна быть либо
-- игроком клуба, либо гостем по имени. Функцию писали в июне, проверку
-- добавили в августе, вместе с гостями в баттлах, — и никто не свёл их
-- вместе. У матча против «TBD» второго игрока нет ни в том, ни в другом
-- виде, и вставка нарушала правило.
--
-- Чиним двумя ходами.
--
-- Первый: имя гостя из живого матча переносим в запись о встрече — теперь
-- сторона заполнена, как того и требует проверка.
--
-- Второй, и он важнее: вставка больше не может уронить сохранение. Даже
-- если запись о встрече по какой-то причине не заведётся, счёт и статус
-- матча всё равно сохранятся. Судья на корте не должен зависеть от того,
-- сойдётся ли что-то в соседней таблице.
--
-- Файл меняет базу. Читающие запросы — в umpire-finish-fix-check.sql.

CREATE OR REPLACE FUNCTION public.umpire_save_state(p_key text, p_state jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id       uuid;
    v_live     RECORD;
    v_prof1_id uuid;
    v_prof2_id uuid;
    v_score    text;
    v_имя1     text;
    v_имя2     text;
    v_ошибка   text := NULL;
BEGIN
    SELECT id INTO v_id FROM live_matches WHERE umpire_key = p_key;
    IF v_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Invalid umpire key');
    END IF;

    UPDATE live_matches SET
        serving_player  = COALESCE((p_state->>'serving_player')::int, serving_player),
        points_p1       = COALESCE(p_state->>'points_p1', points_p1),
        points_p2       = COALESCE(p_state->>'points_p2', points_p2),
        current_set     = COALESCE((p_state->>'current_set')::int, current_set),
        sets_data       = COALESCE(p_state->'sets_data', sets_data),
        current_game_p1 = COALESCE((p_state->>'current_game_p1')::int, current_game_p1),
        current_game_p2 = COALESCE((p_state->>'current_game_p2')::int, current_game_p2),
        is_tiebreak     = COALESCE((p_state->>'is_tiebreak')::boolean, is_tiebreak),
        tiebreak_p1     = COALESCE((p_state->>'tiebreak_p1')::int, tiebreak_p1),
        tiebreak_p2     = COALESCE((p_state->>'tiebreak_p2')::int, tiebreak_p2),
        status          = COALESCE(p_state->>'status', status),
        winner_player   = (p_state->>'winner_player')::int,
        final_score     = p_state->>'final_score',
        history         = COALESCE(p_state->'history', history),
        started_at      = CASE
                              WHEN p_state->>'status' = 'live' AND started_at IS NULL THEN now()
                              ELSE started_at
                          END,
        completed_at    = CASE
                              WHEN p_state->>'status' = 'completed' THEN now()
                              ELSE completed_at
                          END
    WHERE id = v_id;

    IF p_state->>'status' = 'completed' THEN
        SELECT match_id, player1_id, player2_id, player1_name, player2_name, final_score
          INTO v_live
          FROM live_matches WHERE id = v_id;

        v_score := COALESCE(p_state->>'final_score', v_live.final_score);

        -- Имя нужно только тому, кого нет в базе клуба: проверка требует,
        -- чтобы сторона была заполнена хоть чем-то
        v_имя1 := CASE WHEN v_live.player1_id IS NULL
                       THEN NULLIF(trim(COALESCE(v_live.player1_name, '')), '') END;
        v_имя2 := CASE WHEN v_live.player2_id IS NULL
                       THEN NULLIF(trim(COALESCE(v_live.player2_name, '')), '') END;

        IF v_live.match_id IS NULL
           AND (v_live.player1_id IS NOT NULL OR v_имя1 IS NOT NULL)
           AND (v_live.player2_id IS NOT NULL OR v_имя2 IS NOT NULL)
           AND NOT EXISTS (SELECT 1 FROM challenges WHERE live_match_id = v_id)
        THEN
            SELECT p.id INTO v_prof1_id FROM profiles p WHERE p.player_id = v_live.player1_id LIMIT 1;
            SELECT p.id INTO v_prof2_id FROM profiles p WHERE p.player_id = v_live.player2_id LIMIT 1;

            -- Запись о встрече — дело полезное, но не обязательное. Если она
            -- не заведётся, счёт матча всё равно останется сохранённым
            BEGIN
                INSERT INTO challenges (
                    challenger_id, challenger_player_id, challenger_external_name,
                    opponent_player_id, opponent_external_name, opponent_profile_id,
                    proposed_date, proposed_time,
                    status, score_draft, live_match_id,
                    created_at, expires_at, accepted_at
                ) VALUES (
                    v_prof1_id, v_live.player1_id, v_имя1,
                    v_live.player2_id, v_имя2, v_prof2_id,
                    CURRENT_DATE,
                    to_char(now() AT TIME ZONE 'Asia/Bishkek', 'HH24:MI'),
                    'completed', v_score, v_id,
                    now(), now() + interval '72 hours', now()
                );
            EXCEPTION WHEN others THEN
                v_ошибка := SQLERRM;
                RAISE WARNING 'umpire_save_state: запись о встрече не заведена — %', v_ошибка;
            END;
        END IF;
    END IF;

    RETURN jsonb_build_object('ok', true, 'id', v_id,
                              'challenge_error', v_ошибка);
END;
$$;

ALTER FUNCTION public.umpire_save_state(text, jsonb) OWNER TO postgres;
GRANT ALL ON FUNCTION public.umpire_save_state(text, jsonb) TO anon;
GRANT ALL ON FUNCTION public.umpire_save_state(text, jsonb) TO authenticated;
