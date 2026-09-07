-- ============================================================
-- Возврат прежнего правила расстановки в сетке «все места»
-- ============================================================
--
-- Вчера я заменил расстановку «блоками», решив, что постоянный шаг вниз —
-- упрощение, верное лишь для маленькой сетки. Проверял тем, что все клетки
-- заполнены, — а это ничего не доказывает: любая перестановка заполняет
-- все клетки. Сегодня проверил по смыслу и вижу: прежнее правило верно, а
-- моё уводило победителя из его же ветки на всех размерах.
--
-- Правило простое и одно для 8, 16, 32 и 64: победитель идёт в верхнюю
-- половину следующего круга, проигравший — в нижнюю, на N/4 ниже.
--
-- Разметка веток на странице теперь строится из этого же правила
-- (js/kslt-rules.js), поэтому разойтись они больше не могут.
--
-- Файл возвращает функцию к исходному виду из bracket-advance-on-server.sql.

BEGIN;

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
            v_ниже := v_след_поряд + v_четверть;
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

DROP FUNCTION IF EXISTS public.fic_следующий_номер(integer, integer, integer, boolean);

COMMIT;
