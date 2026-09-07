-- ============================================================
-- Пересборка сетки «все места» по уже введённым счетам
-- ============================================================
--
-- Счета вносить заново не нужно. Здесь турнир раскладывается заново по тем
-- результатам, что уже есть: берём первый круг, ведём победителей и
-- проигравших по кругам новым правилом и ставим их по местам.
--
-- Зачем это нужно. Люди расставлены прежним правилом, где адрес проигравшего
-- не зависел от круга: все валились в нижний блок, а ветки 5-8, 9-12 и 13-16
-- стояли пустыми. Сами они не переедут — сидят там, куда их положили.
--
-- Счёт матча сохраняется, если в клетке остались те же двое. Если пара
-- поменялась, счёт снимается: он относился к другому матчу, и оставлять его
-- нельзя. Так же поступаем, когда победителя правили задним числом —
-- дальние круги пересобираются под нового.
--
-- Запускать можно повторно.
--
-- Использование:
--     SELECT public.fic_пересобрать('tbsh-promasters-2026');
--
-- Файл меняет базу. Читающие запросы — в fic-advance-by-round-check.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.fic_пересобрать(p_турнир text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_сетка   integer;
    v_кругов  integer;
    v_круг    integer;
    м         record;
    v_поб_н   integer;
    v_прг_н   integer;
    v_проиграл text;
    v_его_посев integer;
    v_посев   integer;
    v_сохранено integer := 0;
    v_снято     integer := 0;
BEGIN
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = p_турнир AND round_number = 1;
    IF v_сетка IS NULL OR v_сетка < 2 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'сетка не найдена');
    END IF;
    v_кругов := log(2, v_сетка::numeric)::int;

    -- Запоминаем, что было: пару, счёт и победителя каждой клетки
    CREATE TEMP TABLE было ON COMMIT DROP AS
    SELECT round_number, match_order, player1_id, player2_id,
           winner_id, score, status, played_at
      FROM matches
     WHERE tournament_id = p_турнир AND round_number > 1;

    -- Чистим всё, кроме первого круга: расставим заново
    UPDATE matches
       SET player1_id = NULL, player2_id = NULL, seed1 = NULL, seed2 = NULL,
           winner_id = NULL, score = NULL, status = 'upcoming', played_at = NULL
     WHERE tournament_id = p_турнир AND round_number > 1;

    -- Ведём людей по кругам
    FOR v_круг IN 1..(v_кругов - 1) LOOP
        FOR м IN
            SELECT * FROM matches
             WHERE tournament_id = p_турнир AND round_number = v_круг
               AND winner_id IS NOT NULL
             ORDER BY match_order
        LOOP
            v_поб_н := public.fic_адрес(v_сетка, v_круг, м.match_order, true);
            v_прг_н := public.fic_адрес(v_сетка, v_круг, м.match_order, false);

            v_посев := CASE WHEN м.winner_id = м.player1_id THEN м.seed1 ELSE м.seed2 END;
            v_проиграл := CASE WHEN м.winner_id = м.player1_id THEN м.player2_id ELSE м.player1_id END;
            v_его_посев := CASE WHEN м.winner_id = м.player1_id THEN м.seed2 ELSE м.seed1 END;

            -- Нечётный номер садится сверху, чётный снизу
            IF м.match_order % 2 <> 0 THEN
                UPDATE matches SET player1_id = м.winner_id, seed1 = v_посев
                 WHERE tournament_id = p_турнир AND round_number = v_круг + 1
                   AND match_order = v_поб_н;
                IF v_проиграл IS NOT NULL THEN
                    UPDATE matches SET player1_id = v_проиграл, seed1 = v_его_посев
                     WHERE tournament_id = p_турнир AND round_number = v_круг + 1
                       AND match_order = v_прг_н;
                END IF;
            ELSE
                UPDATE matches SET player2_id = м.winner_id, seed2 = v_посев
                 WHERE tournament_id = p_турнир AND round_number = v_круг + 1
                   AND match_order = v_поб_н;
                IF v_проиграл IS NOT NULL THEN
                    UPDATE matches SET player2_id = v_проиграл, seed2 = v_его_посев
                     WHERE tournament_id = p_турнир AND round_number = v_круг + 1
                       AND match_order = v_прг_н;
                END IF;
            END IF;
        END LOOP;

        -- Круг заполнен — возвращаем счета тем клеткам, где стоят те же двое
        UPDATE matches m
           SET winner_id = б.winner_id, score = б.score,
               status = б.status, played_at = б.played_at
          FROM было б
         WHERE m.tournament_id = p_турнир
           AND m.round_number = v_круг + 1
           AND б.round_number = m.round_number
           AND б.match_order  = m.match_order
           AND б.winner_id IS NOT NULL
           AND ((б.player1_id = m.player1_id AND б.player2_id = m.player2_id)
             OR (б.player1_id = m.player2_id AND б.player2_id = m.player1_id));

        -- Проход без игры ставим только там, где соперника не будет вовсе:
        -- то есть ни один несыгранный матч этого круга сюда уже не приведёт.
        -- Иначе клетка, ждущая второго участника, получала отметку BYE и
        -- кнопку счёта у неё отбирало.
        UPDATE matches t
           SET winner_id = COALESCE(t.player1_id, t.player2_id),
               score = 'BYE', status = 'completed', played_at = now()
         WHERE t.tournament_id = p_турнир AND t.round_number = v_круг + 1
           AND t.winner_id IS NULL
           AND (t.player1_id IS NULL) <> (t.player2_id IS NULL)
           AND NOT EXISTS (
               SELECT 1 FROM matches f
                WHERE f.tournament_id = p_турнир
                  AND f.round_number = v_круг
                  AND f.winner_id IS NULL
                  AND (f.player1_id IS NOT NULL OR f.player2_id IS NOT NULL)
                  AND (public.fic_адрес(v_сетка, v_круг, f.match_order, true) = t.match_order
                    OR public.fic_адрес(v_сетка, v_круг, f.match_order, false) = t.match_order)
           );
    END LOOP;

    SELECT count(*) INTO v_сохранено FROM matches
     WHERE tournament_id = p_турнир AND round_number > 1 AND winner_id IS NOT NULL;
    SELECT count(*) INTO v_снято FROM было б
     WHERE б.winner_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM matches m
                        WHERE m.tournament_id = p_турнир
                          AND m.round_number = б.round_number
                          AND m.match_order = б.match_order
                          AND m.winner_id IS NOT NULL);

    RETURN jsonb_build_object('ok', true, 'сетка', v_сетка, 'кругов', v_кругов,
                              'результатов_осталось', v_сохранено,
                              'счетов_снято', v_снято);
END;
$$;

COMMENT ON FUNCTION public.fic_пересобрать(text) IS
    'Раскладывает сетку «все места» заново по уже введённым счетам. Счёт сохраняется там, где пара не поменялась.';

COMMIT;
