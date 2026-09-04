-- ============================================================
-- Счёт вписывают сами игроки
-- ============================================================
--
-- Счёт матча сейчас попадает в базу одним путём: менеджер спрашивает его у
-- игроков и вбивает вручную. На корте из-за этого задержки — судья ищет,
-- кто с кем доиграл. А в турнире высшей категории, где играют три месяца
-- по своей договорённости, результаты уходят в чат и теряются там совсем.
--
-- Здесь появляется второй путь: счёт вписывает один из двоих, второй
-- подтверждает. Сутки без ответа — счёт принимается сам, иначе половина
-- матчей повиснет. Не согласен — матч уходит организатору.
--
-- Менеджер и админ правят любой счёт в любой момент, как и раньше. След
-- остаётся: видно, кто вписал, кто подтвердил и кто правил последним.
--
-- Счёт хранится в том же виде, что и был: «6/3 6/4», через дробь и пробел.
-- Ничего в остальном сайте переучивать не нужно.
--
-- Файл меняет базу. Читающие запросы — в match-score-by-players-check.sql.

BEGIN;

-- ---- 1. Состояние счёта у матча ----

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS score_status       text,
    ADD COLUMN IF NOT EXISTS score_submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS score_submitted_at timestamptz,
    ADD COLUMN IF NOT EXISTS score_confirmed_at timestamptz,
    ADD COLUMN IF NOT EXISTS score_edited_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS score_edited_at    timestamptz,
    ADD COLUMN IF NOT EXISTS score_dispute_note text;

COMMENT ON COLUMN public.matches.score_status IS
    'Как счёт попал в базу: pending — вписан игроком, ждёт второго; confirmed — подтверждён или принят по сроку; disputed — второй не согласен, ждёт организатора. Пусто — вписан менеджером, как раньше.';

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_score_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_score_status_check
    CHECK (score_status IS NULL OR score_status IN ('pending', 'confirmed', 'disputed'));

-- Ожидающие подтверждения ищутся при каждой ночной проверке
CREATE INDEX IF NOT EXISTS idx_matches_score_status
    ON public.matches (score_status) WHERE score_status IS NOT NULL;

-- ---- 2. Кто есть кто в матче ----
--
-- Игрок вписывает счёт от своего имени, а в матче стоят карточки игроков.
-- Связь через профиль: у вошедшего есть player_id.

CREATE OR REPLACE FUNCTION public.match_side_of(p_match_id uuid, p_user uuid)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
               WHEN m.player1_id = pr.player_id THEN 1::smallint
               WHEN m.player2_id = pr.player_id THEN 2::smallint
               ELSE NULL
           END
      FROM matches m
      JOIN profiles pr ON pr.id = p_user
     WHERE m.id = p_match_id;
$$;

COMMENT ON FUNCTION public.match_side_of(uuid, uuid) IS
    'Сторона игрока в матче: 1, 2 или пусто, если человек в этом матче не играет.';

-- ---- 3. Вписать счёт ----
--
-- Победителя не спрашиваем: он считается из сетов. Меньше полей — меньше
-- ошибок, и никто не поставит победителем проигравшего.

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

    RETURN jsonb_build_object('ok', true, 'winner_id', v_winner,
                              'awaiting_side', CASE WHEN v_side = 1 THEN 2 ELSE 1 END);
END;
$$;

-- ---- 4. Подтвердить ----

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

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---- 5. Не согласен ----
--
-- Счёт остаётся в записи, но помечен спорным: организатор видит, что
-- именно вписали, и с чем не согласны.

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

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---- 6. Сутки молчания — счёт принят ----
--
-- Без этого половина матчей повиснет: человек отыграл, ушёл и в приложение
-- не заглянул. Ждать бесконечно — вернуться к чату.

CREATE OR REPLACE FUNCTION public.accept_stale_match_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n integer := 0;
BEGIN
    UPDATE matches SET
        score_status       = 'confirmed',
        score_confirmed_at = now()
     WHERE score_status = 'pending'
       AND score_submitted_at < now() - interval '24 hours';
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$;

COMMENT ON FUNCTION public.accept_stale_match_scores() IS
    'Принимает счета, которые сутки ждут подтверждения второго игрока.';

REVOKE ALL ON FUNCTION public.accept_stale_match_scores() FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('accept-stale-match-scores')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'accept-stale-match-scores');

SELECT cron.schedule(
    'accept-stale-match-scores',
    '7 * * * *',                       -- каждый час, в семь минут
    $$SELECT public.accept_stale_match_scores()$$
);

-- ---- 7. Права ----
-- Функции проверяют участие сами, поэтому доступны вошедшим.

GRANT EXECUTE ON FUNCTION public.match_side_of(uuid, uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_match_score(uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_match_score(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_match_score(uuid, text)      TO authenticated;

COMMIT;
