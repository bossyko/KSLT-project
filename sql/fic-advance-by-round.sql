-- ============================================================
-- Сетка «все места»: проигравший идёт по номеру круга
-- ============================================================
--
-- База двигала игроков постоянным шагом: проигравший опускался на четверть
-- сетки, в каком бы круге ни проиграл. Для сетки на 16 это случайно
-- совпадало с верным адресом, для 32 уже нет — все проигравшие валились в
-- блок 17-32, а блоки 5-8, 9-12 и 13-16 стояли пустыми.
--
-- Правильное правило зависит от круга. В круге r сетка поделена на 2^(r-1)
-- блоков по N/2^r матчей. Победитель идёт в верхнюю половину своего блока,
-- проигравший — в нижнюю:
--
--     размер блока  S  = N / 2^r
--     номер блока   b  = ceil(m / S)
--     место в блоке p  = m - (b-1)*S
--     победитель      = (2b-2) * S/2 + ceil(p/2)
--     проигравший     = (2b-1) * S/2 + ceil(p/2)
--
-- Отсюда и выходит то, что нужно: проигравший первого круга уходит в
-- нижнюю половину всех мест, второго — в нижнюю половину верхней половины,
-- и так далее.
--
--   сетка 32:  1-й круг → 17-32,  2-й → 9-16,  3-й → 5-8,  4-й → за 3 место
--   сетка 64:  1-й → 33-64, 2-й → 17-32, 3-й → 9-16, 4-й → 5-8, 5-й → за 3
--
-- По этому же правилу строится разметка блоков на страницах
-- (js/kslt-rules.js), поэтому база и отрисовка разойтись не могут.
--
-- Файл меняет базу. Читающие запросы — в fic-advance-by-round-check.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.fic_адрес(
    p_сетка   integer,   -- мест в сетке: 8, 16, 32, 64
    p_круг    integer,   -- номер круга, с единицы
    p_номер   integer,   -- номер матча в этом круге
    p_победил boolean
) RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    S  integer;
    b  integer;
    p  integer;
BEGIN
    S := p_сетка / (2 ^ p_круг);
    IF S < 1 THEN RETURN NULL; END IF;

    b := ceil(p_номер::numeric / S)::int;
    p := p_номер - (b - 1) * S;

    IF p_победил THEN
        RETURN (2 * b - 2) * (S / 2) + ceil(p::numeric / 2)::int;
    ELSE
        RETURN (2 * b - 1) * (S / 2) + ceil(p::numeric / 2)::int;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.fic_адрес(integer, integer, integer, boolean) IS
    'Куда идёт игрок в сетке «все места»: победитель в верхнюю половину своего блока, проигравший в нижнюю. Адрес зависит от круга.';

CREATE OR REPLACE FUNCTION public.advance_bracket_winner(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    m            RECORD;
    v_приставка  text;
    v_след_круг  integer;
    v_след_поряд integer;
    v_место      text;      -- player1_id или player2_id
    v_сеяный     text;      -- seed1 или seed2
    v_посев      integer;
    v_проиграл   text;
    v_его_посев  integer;
    v_след_id    uuid;
    v_третий_id  uuid;
    v_r1         integer;
    v_сетка      integer;
    v_кругов     integer;
    v_четверть   integer;
    v_ниже       integer;
    v_итог       jsonb := jsonb_build_object('moved', false);
BEGIN
    SELECT * INTO m FROM matches WHERE id = p_match_id;
    IF NOT FOUND OR m.winner_id IS NULL OR m.status <> 'completed' THEN
        RETURN v_итог;
    END IF;

    -- В группах сетки нет, двигать некуда
    IF m.group_number IS NOT NULL THEN
        RETURN v_итог;
    END IF;

    -- Отборочный круг оставляем менеджеру
    IF m.round = 'IG' THEN
        RETURN jsonb_build_object('moved', false, 'reason', 'отборочный круг заполняет менеджер');
    END IF;

    -- Приставка лиги, если это лига
    v_приставка := CASE
        WHEN m.round LIKE 'PL-%' THEN 'PL-'
        WHEN m.round LIKE 'CL-%' THEN 'CL-'
        ELSE ''
    END;

    -- Матч за третье место конечный
    IF m.round = v_приставка || '3RD' THEN
        RETURN jsonb_build_object('moved', false, 'reason', 'матч за третье место');
    END IF;

    -- Посев победителя переносим вместе с ним
    v_посев := CASE WHEN m.winner_id = m.player1_id THEN m.seed1 ELSE m.seed2 END;

    -- Нечётный порядок садится в верхнее место следующего матча, чётный в нижнее
    IF m.match_order % 2 <> 0 THEN
        v_место := 'player1_id'; v_сеяный := 'seed1';
    ELSE
        v_место := 'player2_id'; v_сеяный := 'seed2';
    END IF;

    v_след_круг  := m.round_number + 1;
    v_след_поряд := ceil(m.match_order::numeric / 2)::int;

    -- ---- FIC: двигаются оба ----
    IF m.round LIKE 'FIC-%' THEN
        SELECT count(*) INTO v_r1 FROM matches
         WHERE tournament_id = m.tournament_id AND round_number = 1;
        v_сетка    := v_r1 * 2;
        v_кругов   := CASE WHEN v_сетка > 1 THEN log(2, v_сетка::numeric)::int ELSE 0 END;
        v_четверть := v_сетка / 4;

        -- Последний круг разыгрывает места, дальше идти некуда
        IF m.round_number >= v_кругов THEN
            RETURN jsonb_build_object('moved', false, 'reason', 'последний круг');
        END IF;

        -- Адрес зависит от круга, а не от постоянного шага: раньше здесь
        -- была четверть сетки, и все проигравшие валились в нижний блок.
        v_след_поряд := public.fic_адрес(v_сетка, m.round_number, m.match_order, true);

        SELECT id INTO v_след_id FROM matches
         WHERE tournament_id = m.tournament_id
           AND round_number = v_след_круг AND match_order = v_след_поряд
         LIMIT 1;

        IF v_след_id IS NOT NULL THEN
            EXECUTE format('UPDATE matches SET %I = $1, %I = $2 WHERE id = $3', v_место, v_сеяный)
              USING m.winner_id, v_посев, v_след_id;
            v_итог := jsonb_build_object('moved', true, 'winner_to', v_след_id);
        END IF;

        -- Проигравший — в тот же круг, но на четверть сетки ниже, в то же место
        v_проиграл  := CASE WHEN m.winner_id = m.player1_id THEN m.player2_id ELSE m.player1_id END;
        v_его_посев := CASE WHEN m.winner_id = m.player1_id THEN m.seed2 ELSE m.seed1 END;

        IF v_проиграл IS NOT NULL THEN
            v_ниже := public.fic_адрес(v_сетка, m.round_number, m.match_order, false);
            SELECT id INTO v_след_id FROM matches
             WHERE tournament_id = m.tournament_id
               AND round_number = v_след_круг AND match_order = v_ниже
             LIMIT 1;
            IF v_след_id IS NOT NULL THEN
                EXECUTE format('UPDATE matches SET %I = $1, %I = $2 WHERE id = $3', v_место, v_сеяный)
                  USING v_проиграл, v_его_посев, v_след_id;
                v_итог := v_итог || jsonb_build_object('loser_to', v_след_id);
            END IF;
        END IF;

        RETURN v_итог;
    END IF;

    -- ---- Олимпийка и лига ----
    SELECT id INTO v_след_id FROM matches
     WHERE tournament_id = m.tournament_id
       AND round_number = v_след_круг
       AND match_order  = v_след_поряд
       AND group_number IS NULL
       AND round IS DISTINCT FROM 'IG'
       AND round IS DISTINCT FROM (v_приставка || '3RD')
       AND (v_приставка = '' OR round LIKE v_приставка || '%')
     LIMIT 1;

    IF v_след_id IS NOT NULL THEN
        EXECUTE format('UPDATE matches SET %I = $1, %I = $2 WHERE id = $3', v_место, v_сеяный)
          USING m.winner_id, v_посев, v_след_id;
        v_итог := jsonb_build_object('moved', true, 'winner_to', v_след_id);
    END IF;

    -- ---- Проигравший полуфинала — в матч за третье место ----
    IF m.round = v_приставка || 'SF' THEN
        v_проиграл  := CASE WHEN m.winner_id = m.player1_id THEN m.player2_id ELSE m.player1_id END;
        v_его_посев := CASE WHEN m.winner_id = m.player1_id THEN m.seed2 ELSE m.seed1 END;

        SELECT id INTO v_третий_id FROM matches
         WHERE tournament_id = m.tournament_id AND round = v_приставка || '3RD'
         LIMIT 1;

        IF v_третий_id IS NOT NULL AND v_проиграл IS NOT NULL THEN
            -- Проигравший первого полуфинала встаёт сверху, второго — снизу
            IF m.match_order = 1 THEN
                v_место := 'player1_id'; v_сеяный := 'seed1';
            ELSE
                v_место := 'player2_id'; v_сеяный := 'seed2';
            END IF;
            EXECUTE format('UPDATE matches SET %I = $1, %I = $2 WHERE id = $3', v_место, v_сеяный)
              USING v_проиграл, v_его_посев, v_третий_id;
            v_итог := v_итог || jsonb_build_object('third_place', v_третий_id);
        END IF;
    END IF;

    RETURN v_итог;
END;
$$;

-- ---- Смена победителя переставляет людей по всей цепочке ----
--
-- Перевод двигал игроков только в следующий круг. Если счёт уже сыгранного
-- матча меняли, новый победитель вставал в следующий круг, а дальше по
-- сетке оставался прежний: в четвертьфинале уже Кирилл, а в полуфинале
-- всё ещё Рашид.
--
-- Теперь при смене победителя прежний игрок заменяется новым во всех
-- матчах позже по сетке — и как участник, и как победитель, если он там
-- успел выиграть. Счета этих матчей остаются: их правит менеджер, если
-- нужно, а сетка при этом не рассыпается.

CREATE OR REPLACE FUNCTION public.fic_заменить_дальше(
    p_турнир text,
    p_круг   integer,
    p_старый text,
    p_новый  text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    n integer := 0;
BEGIN
    IF p_старый IS NULL OR p_новый IS NULL OR p_старый = p_новый THEN
        RETURN 0;
    END IF;

    UPDATE matches SET player1_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг AND player1_id = p_старый;
    GET DIAGNOSTICS n = ROW_COUNT;

    UPDATE matches SET player2_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг AND player2_id = p_старый;

    UPDATE matches SET winner_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг AND winner_id = p_старый;

    -- Клетки с проходом: победитель в них — тот, кто в клетке стоит. Пока
    -- этого не было, при правке результата задним числом игрока подменяли,
    -- а победитель оставался от прежнего: места считались по человеку,
    -- которого в клетке нет, и он попадал в итоговый список дважды.
    -- Если клетка опустела вовсе, снимаем и победителя, и отметку прохода.
    UPDATE matches
       SET winner_id = COALESCE(player1_id, player2_id),
           score  = CASE WHEN COALESCE(player1_id, player2_id) IS NULL
                         THEN NULL ELSE score END,
           status = CASE WHEN COALESCE(player1_id, player2_id) IS NULL
                         THEN 'upcoming' ELSE status END
     WHERE tournament_id = p_турнир
       AND round_number > p_круг
       AND score = 'BYE'
       AND winner_id IS DISTINCT FROM COALESCE(player1_id, player2_id);

    RETURN n;
END;
$$;

COMMENT ON FUNCTION public.fic_заменить_дальше(text, integer, text, text) IS
    'При смене победителя переставляет игрока во всех матчах позже по сетке: иначе в дальних кругах остаётся прежний.';

CREATE OR REPLACE FUNCTION public.fic_закрыть_проходы(p_турнир text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_сетка integer;
    v_круг  integer;
    n       integer;
    всего   integer := 0;
BEGIN
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = p_турнир AND round_number = 1;
    IF v_сетка IS NULL OR v_сетка < 2 THEN RETURN 0; END IF;

    -- Идём кругами: закрытие одного прохода может открыть следующий
    LOOP
        UPDATE matches t
           SET winner_id = COALESCE(t.player1_id, t.player2_id),
               score = 'BYE', status = 'completed', played_at = now()
         WHERE t.tournament_id = p_турнир
           AND t.winner_id IS NULL
           AND (t.player1_id IS NULL) <> (t.player2_id IS NULL)
           -- Только там, где второму взяться неоткуда: ни один несыгранный
           -- матч предыдущего круга сюда уже не приведёт
           AND NOT EXISTS (
               SELECT 1 FROM matches f
                WHERE f.tournament_id = p_турнир
                  AND f.round_number = t.round_number - 1
                  AND f.winner_id IS NULL
                  AND (f.player1_id IS NOT NULL OR f.player2_id IS NOT NULL)
                  AND (public.fic_адрес(v_сетка, f.round_number, f.match_order, true) = t.match_order
                    OR public.fic_адрес(v_сетка, f.round_number, f.match_order, false) = t.match_order)
           );
        GET DIAGNOSTICS n = ROW_COUNT;
        всего := всего + n;
        EXIT WHEN n = 0;
    END LOOP;

    RETURN всего;
END;
$$;

COMMENT ON FUNCTION public.fic_закрыть_проходы(text) IS
    'Закрывает матчи, где соперника не будет: победитель определяется сам, иначе турнир нельзя завершить.';

CREATE OR REPLACE FUNCTION public.trg_advance_bracket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_стар_поб text;
    v_стар_прг text;
    v_нов_прг  text;
BEGIN
    -- Счёт ещё не окончательный: ждёт второго или оспорен
    IF NEW.score_status IN ('pending', 'disputed') THEN
        RETURN NULL;
    END IF;

    IF NEW.winner_id IS NOT NULL
       AND NEW.status = 'completed'
       AND (TG_OP = 'INSERT'
            OR OLD.winner_id IS DISTINCT FROM NEW.winner_id
            OR OLD.status IS DISTINCT FROM NEW.status
            OR OLD.score_status IS DISTINCT FROM NEW.score_status)
    THEN
        -- Победителя переиграли: убираем прежнего из дальнейших кругов
        IF TG_OP = 'UPDATE' AND OLD.winner_id IS NOT NULL
           AND OLD.winner_id IS DISTINCT FROM NEW.winner_id THEN
            v_стар_поб := OLD.winner_id;
            v_стар_прг := CASE WHEN OLD.winner_id = NEW.player1_id
                               THEN NEW.player2_id ELSE NEW.player1_id END;
            v_нов_прг  := CASE WHEN NEW.winner_id = NEW.player1_id
                               THEN NEW.player2_id ELSE NEW.player1_id END;

            PERFORM public.fic_заменить_дальше(
                NEW.tournament_id, NEW.round_number, v_стар_поб, NEW.winner_id);
            PERFORM public.fic_заменить_дальше(
                NEW.tournament_id, NEW.round_number, v_стар_прг, v_нов_прг);
        END IF;

        PERFORM public.advance_bracket_winner(NEW.id);

        -- Закрываем проходы без игры: если в клетке остался один человек и
        -- второму взяться неоткуда, победитель определяется сам. Иначе такие
        -- матчи висят несыгранными и турнир нельзя завершить.
        PERFORM public.fic_закрыть_проходы(NEW.tournament_id);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_bracket ON public.matches;

CREATE TRIGGER trg_advance_bracket
    AFTER INSERT OR UPDATE OF winner_id, status, score_status ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_advance_bracket();

COMMIT;
