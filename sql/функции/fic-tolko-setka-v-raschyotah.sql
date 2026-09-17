-- ============================================================
-- Проходы без игры считаются только по сетке
-- ============================================================
--
-- `fic_итоги` и `fic_закрыть_проходы` берут размер сетки как «матчей
-- первого круга × 2». Но круг с номером 1 есть и у групповых встреч, и у
-- доп. матчей — они попадают в тот же счёт.
--
-- В турнире с шестью группами это 24 групповых + 2 доп. + 8 матчей сетки:
-- размер выходит «на 68» вместо 16, раскладка едет, и клетка, где соперника
-- уже не будет, не находится. Отменили доп. матч — а соперник так и стоит,
-- не проходя дальше.
--
-- В олимпийке групп нет, поэтому там всё считалось верно — оттого и
-- казалось, что правило работает.
--
-- Лечим отбором: смотрим только матчи сетки — без номера группы и не «IG».
--
-- Запускать можно повторно.

BEGIN;

CREATE OR REPLACE FUNCTION public.fic_итоги(p_турнир text)
RETURNS TABLE(круг integer, номер integer, итог integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_сетка  integer;
    v_кругов integer;
    v_вкруге integer;
    v_итог   integer[];
    v_круг   integer;
    v_ном    integer;
    v_куда   integer;
    м        record;
BEGIN
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = p_турнир
       AND round_number = 1
       AND group_number IS NULL
       AND round IS DISTINCT FROM 'IG';
    IF v_сетка IS NULL OR v_сетка < 2 THEN RETURN; END IF;

    v_кругов := log(2, v_сетка::numeric)::int;
    v_вкруге := v_сетка / 2;

    v_итог := array_fill(0, ARRAY[v_кругов, v_вкруге]);

    FOR м IN SELECT match_order, player1_id, player2_id, slot1_label, slot2_label
               FROM matches
              WHERE tournament_id = p_турнир
                AND round_number = 1
                AND group_number IS NULL
                AND round IS DISTINCT FROM 'IG'
    LOOP
        -- Метка — обещание человека: он приедет, когда доиграет его группа
        -- или доп. матч. Такая клетка ждёт, а не закрывается проходом
        v_итог[1][м.match_order] :=
            (CASE WHEN м.player1_id IS NOT NULL OR м.slot1_label IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN м.player2_id IS NOT NULL OR м.slot2_label IS NOT NULL THEN 1 ELSE 0 END);
    END LOOP;

    FOR v_круг IN 2..v_кругов LOOP
        FOR v_ном IN 1..v_вкруге LOOP
            IF v_итог[v_круг - 1][v_ном] >= 1 THEN
                v_куда := public.fic_адрес(v_сетка, v_круг - 1, v_ном, true);
                IF v_куда IS NOT NULL THEN
                    v_итог[v_круг][v_куда] := v_итог[v_круг][v_куда] + 1;
                END IF;
            END IF;
            IF v_итог[v_круг - 1][v_ном] >= 2 THEN
                v_куда := public.fic_адрес(v_сетка, v_круг - 1, v_ном, false);
                IF v_куда IS NOT NULL THEN
                    v_итог[v_круг][v_куда] := v_итог[v_круг][v_куда] + 1;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    FOR v_круг IN 1..v_кругов LOOP
        FOR v_ном IN 1..v_вкруге LOOP
            круг := v_круг;
            номер := v_ном;
            итог := v_итог[v_круг][v_ном];
            RETURN NEXT;
        END LOOP;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fic_итоги(text) IS
    'Сколько человек в итоге окажется в каждой клетке сетки. Группы и доп. матчи в счёт не идут: у них свой круг с тем же номером.';

CREATE OR REPLACE FUNCTION public.fic_закрыть_проходы(p_турнир text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_сетка integer;
    n       integer;
    всего   integer := 0;
BEGIN
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = p_турнир
       AND round_number = 1
       AND group_number IS NULL
       AND round IS DISTINCT FROM 'IG';
    IF v_сетка IS NULL OR v_сетка < 2 THEN RETURN 0; END IF;

    -- Проход — это клетка, в которой в итоге окажется ровно один человек.
    -- Больше здесь ничего не решается: счёт берём готовый, из fic_итоги.
    --
    -- Идём кругами: закрытие одного прохода может открыть следующий.
    LOOP
        WITH itg AS (SELECT * FROM public.fic_итоги(p_турнир))
        UPDATE matches t
           SET winner_id = COALESCE(t.player1_id, t.player2_id),
               score = 'BYE', status = 'completed', played_at = now()
          FROM itg
         WHERE t.tournament_id = p_турнир
           AND t.group_number IS NULL
           AND t.round IS DISTINCT FROM 'IG'
           AND t.winner_id IS NULL
           AND (t.player1_id IS NULL) <> (t.player2_id IS NULL)
           AND itg.круг = t.round_number
           AND itg.номер = t.match_order
           AND itg.итог = 1;
        GET DIAGNOSTICS n = ROW_COUNT;
        всего := всего + n;
        EXIT WHEN n = 0;
    END LOOP;

    RETURN всего;
END;
$$;

COMMENT ON FUNCTION public.fic_закрыть_проходы(text) IS
    'Закрывает матчи сетки, где соперника не будет: победитель определяется сам, иначе турнир нельзя завершить.';

COMMIT;

-- ---- Проверка ----
--
-- Размер сетки турнира и что насчитала fic_итоги для первого круга.
-- Ожидаем: сетка равна числу матчей первого круга × 2 (для микста — 16),
-- а клетка с одним человеком помечена итогом 1 — она и закроется проходом.

SELECT t.title                                          AS турнир,
       count(*) FILTER (WHERE m.round_number = 1
                          AND m.group_number IS NULL
                          AND m.round <> 'IG') * 2      AS размер_сетки,
       count(*) FILTER (WHERE m.group_number IS NOT NULL) AS групповых,
       count(*) FILTER (WHERE m.round = 'IG')           AS доп_матчей
  FROM public.matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
 GROUP BY t.title;

-- Клетки первого круга: сколько человек в каждой окажется
SELECT и.круг, и.номер, и.итог,
       COALESCE(p1.name, m.slot1_label, '—') || '  vs  ' ||
       COALESCE(p2.name, m.slot2_label, '—')            AS клетка,
       COALESCE(m.score, m.status)                      AS состояние
  FROM public.fic_итоги('c0a30bae-30ee-4a38-a26a-4c6b339bd695') и
  LEFT JOIN public.matches m
         ON m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
        AND m.group_number IS NULL AND m.round <> 'IG'
        AND m.round_number = и.круг AND m.match_order = и.номер
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE и.круг = 1
 ORDER BY и.номер;
