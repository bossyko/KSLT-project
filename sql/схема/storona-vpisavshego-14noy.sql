-- ============================================================
-- ПОДТВЕРЖДАЕТ ДРУГАЯ СТОРОНА, А НЕ ДРУГОЙ ЧЕЛОВЕК
-- 14 ноября, слово Кости: «для пары тоже — если один из игроков пары
-- вводит счёт, то у других закрывается сразу тоже».
--
-- ЧТО БЫЛО. Экран сравнивал ЧЕЛОВЕКА: счёт вписал не ты — значит тебе
-- показываем «Подтвердить». В паре это значило, что напарник вписавшего
-- видел кнопку подтверждения на СВОЁМ ЖЕ счёте. База такое отбивала
-- (`own_score` в `confirm_match_score`, она сравнивает стороны), но
-- КНОПКА ОБЕЩАЕТ РОВНО ТО, ЧТО СДЕЛАЕТ — а она обещала лишнее.
--
-- ЧТО ДЕЛАЕМ. Записываем вместе со счётом КАРТОЧКУ вписавшего. Из неё
-- экран выводит сторону тем же способом, что и свою, и сравнивает
-- сторону со стороной. Отдельного запроса это не стоит: поле едет в
-- той же выборке.
--
-- Почему карточку, а не число стороны: карточка — данные, сторона —
-- вывод из них. УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ: у старых записей поле
-- пустое, и правило честно откатывается на сравнение по человеку.
-- ============================================================

BEGIN;

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS score_submitted_player text;

COMMENT ON COLUMN public.matches.score_submitted_player IS
    'Карточка игрока, вписавшего счёт. Из неё считается сторона: в паре в матче стоит капитан, а вписать может напарник.';

-- Старые ожидающие: сторону знает профиль вписавшего
UPDATE public.matches m SET score_submitted_player = pr.player_id
  FROM public.profiles pr
 WHERE pr.id = m.score_submitted_by
   AND m.score_submitted_by IS NOT NULL
   AND m.score_submitted_player IS NULL;

-- ---- Запись счёта кладёт и карточку ----

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
    v_karta    text;
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

    -- ЗАКРЫТЫЙ ТУРНИР: дальше только организатор
    IF public.turnir_zakryt_dlya_schyota(p_match_id) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'tournament_closed');
    END IF;

    -- Подтверждённый счёт игрок не переписывает: дальше только организатор
    IF v_match.score_status = 'confirmed' OR
       (v_match.score_status IS NULL AND v_match.winner_id IS NOT NULL) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'already_final');
    END IF;

    SELECT player_id INTO v_karta FROM profiles WHERE id = v_user;

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
        score                   = btrim(p_score),
        winner_id               = v_winner,
        score_status            = 'pending',
        score_submitted_by      = v_user,
        score_submitted_player  = v_karta,
        score_submitted_at      = now(),
        played_at               = COALESCE(p_played_at, played_at, CURRENT_DATE)
    WHERE id = p_match_id;

    BEGIN
        PERFORM public.notify_match_score(p_match_id, 'submitted');
    EXCEPTION WHEN others THEN
        RAISE WARNING 'уведомление о счёте не отправлено: %', SQLERRM;
    END;

    RETURN jsonb_build_object('ok', true, 'winner_id', v_winner);
END;
$$;

COMMIT;
