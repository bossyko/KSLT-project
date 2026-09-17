-- ============================================================
-- Перестановки по сетке не трогают группы
-- ============================================================
--
-- Смена победителя в плей-офф переписывала состав групповых матчей.
--
-- `fic_заменить_дальше` убирает прежнего победителя из всех матчей позже
-- по сетке — отбирая их по `round_number > круг`. Но круги нумеруются с
-- единицы и у сетки, и у групп: в группе из четырёх пар это круги 1, 2, 3.
-- Поэтому правка победителя первого круга плей-оффа заходила во второй и
-- третий круги каждой группы и меняла там людей.
--
-- На микст-турнире это дало шесть матчей с чужим составом: в группе A
-- вместо Анвара встали пары из группы E, Нурсултан и Алина обменялись
-- матчами между C и D. В таблице группы это видно как лишние пары и
-- прочерки вместо счетов — состав группы собирается из матчей.
--
-- Та же дыра в `advance_bracket_winner`: в ветке FIC размер сетки считался
-- по всем матчам первого круга, вместе с групповыми и отборочными, и
-- следующая клетка искалась без отбора.
--
-- Лечим везде одинаково: матч сетки — это `group_number IS NULL` и не
-- отборочный круг.
--
-- Здесь же приведены `fic_итоги` и `fic_закрыть_проходы` — они уже
-- исправлены в базе отдельным файлом, но в репозитории оставались
-- старыми. Держим одно место правды.
--
-- Файл меняет базу. Проверка — в fic-zameny-tolko-setka-proverka.sql.
-- Запускать можно повторно.

BEGIN;

-- ---- Перестановка по сетке ----

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

    -- Только сетка. В группах свой круговой турнир со своими кругами, и
    -- перестановка по сетке там ничего не решает: кто с кем играет в
    -- группе, определила жеребьёвка.
    UPDATE matches SET player1_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг
       AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
       AND player1_id = p_старый;
    GET DIAGNOSTICS n = ROW_COUNT;

    UPDATE matches SET player2_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг
       AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
       AND player2_id = p_старый;

    UPDATE matches SET winner_id = p_новый
     WHERE tournament_id = p_турнир AND round_number > p_круг
       AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
       AND winner_id = p_старый;

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
       AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
       AND score = 'BYE'
       AND winner_id IS DISTINCT FROM COALESCE(player1_id, player2_id);

    RETURN n;
END;
$$;

COMMENT ON FUNCTION public.fic_заменить_дальше(text, integer, text, text) IS
    'При смене победителя переставляет игрока в матчах сетки позже по кругу. Группы и отборочные не трогает: у них свои круги с теми же номерами.';

-- ---- Продвижение победителя ----

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
        -- Размер сетки — только по её матчам. С групповыми в счёте сетка
        -- выходила втрое больше, и адрес следующей клетки уезжал.
        SELECT count(*) INTO v_r1 FROM matches
         WHERE tournament_id = m.tournament_id AND round_number = 1
           AND group_number IS NULL AND round IS DISTINCT FROM 'IG';
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
           AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
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
               AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
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

COMMENT ON FUNCTION public.advance_bracket_winner(uuid) IS
    'Куда уходит победитель сыгранного матча сетки. Группы и отборочные в расчёт не идут: у них свои круги с теми же номерами.';

COMMIT;
