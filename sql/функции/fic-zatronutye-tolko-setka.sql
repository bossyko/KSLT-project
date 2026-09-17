-- ============================================================
-- Зависимые матчи — только по сетке плей-офф
-- ============================================================
--
-- `fic_затронутые` искала продолжения по номеру круга и номеру матча, не
-- глядя, что это за матч. Но круг и номер есть и у групповых встреч, и у
-- доп. матчей — и они попадали в список «что будет стёрто». Судья менял
-- счёт в плей-офф, а окно показывало ему семь матчей из групп, к которым
-- правка не имеет отношения.
--
-- По той же причине врал и размер сетки: он считался как «матчи первого
-- круга × 2», а в первый круг попадали и групповые, и доп. матчи.
--
-- Лечим отбором: смотрим только матчи сетки — без номера группы и не «IG».
--
-- Запускать можно повторно.

BEGIN;

CREATE OR REPLACE FUNCTION public.fic_затронутые(p_матч uuid)
RETURNS TABLE(
    id           uuid,
    круг         integer,
    номер        integer,
    игрок_1      text,
    игрок_2      text,
    счёт         text,
    победитель   text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_турнир  text;
    v_сетка   integer;
    v_кругов  integer;
    v_круг    integer;
    v_ном     integer;
    v_волна   integer[];
    v_след    integer[];
    v_куда    integer;
    v_текущий integer;
BEGIN
    SELECT m.tournament_id, m.round_number, m.match_order
      INTO v_турнир, v_круг, v_ном
      FROM matches m
     WHERE m.id = p_матч
       AND m.group_number IS NULL
       AND m.round IS DISTINCT FROM 'IG';
    -- Правка по сетке идёт только от матча сетки: у групповой встречи и у
    -- доп. матча продолжений в этом смысле нет
    IF v_турнир IS NULL THEN RETURN; END IF;

    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = v_турнир
       AND round_number = 1
       AND group_number IS NULL
       AND round IS DISTINCT FROM 'IG';
    IF v_сетка IS NULL OR v_сетка < 2 THEN RETURN; END IF;
    v_кругов := log(2, v_сетка::numeric)::int;

    -- Волна: от матча идём вперёд по кругам, собирая клетки-продолжения
    v_волна := ARRAY[v_ном];
    WHILE v_круг < v_кругов AND array_length(v_волна, 1) > 0 LOOP
        v_след := ARRAY[]::integer[];
        FOREACH v_текущий IN ARRAY v_волна LOOP
            v_куда := public.fic_адрес(v_сетка, v_круг, v_текущий, true);
            IF v_куда IS NOT NULL AND NOT (v_куда = ANY(v_след)) THEN
                v_след := v_след || v_куда;
            END IF;
            v_куда := public.fic_адрес(v_сетка, v_круг, v_текущий, false);
            IF v_куда IS NOT NULL AND NOT (v_куда = ANY(v_след)) THEN
                v_след := v_след || v_куда;
            END IF;
        END LOOP;
        v_круг := v_круг + 1;
        v_волна := v_след;

        RETURN QUERY
        SELECT m.id, m.round_number, m.match_order,
               coalesce(p1.name, '—'), coalesce(p2.name, '—'),
               m.score, pw.name
          FROM matches m
          LEFT JOIN players p1 ON p1.id = m.player1_id
          LEFT JOIN players p2 ON p2.id = m.player2_id
          LEFT JOIN players pw ON pw.id = m.winner_id
         WHERE m.tournament_id = v_турнир
           AND m.round_number = v_круг
           AND m.match_order = ANY(v_волна)
           AND m.group_number IS NULL
           AND m.round IS DISTINCT FROM 'IG'
           AND (m.player1_id IS NOT NULL OR m.player2_id IS NOT NULL)
         ORDER BY m.round_number, m.match_order;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fic_затронутые(uuid) IS
    'Какие матчи сетки зависят от этого: их и покажем судье до правки. Группы и доп. матчи не в счёт.';

COMMIT;
