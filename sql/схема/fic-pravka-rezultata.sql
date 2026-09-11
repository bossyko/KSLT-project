-- ============================================================
-- Правка результата задним числом: список затронутого, сброс, откат
-- ============================================================
--
-- Судья ошибается и правит счёт. Сейчас при смене победителя новый человек
-- едет дальше по сетке, но счета матчей, которых он не играл, остаются на
-- месте — просто с другим именем. Так нельзя: результат встречи двух людей к
-- новой паре отношения не имеет.
--
-- Здесь три функции:
--   fic_затронутые   — только смотрит: какие матчи зависят от этого;
--   fic_правка       — меняет результат, стирает зависимые, запоминает,
--                      что было, для отката;
--   fic_откатить     — возвращает всё как было, на один шаг назад.
--
-- Зависимые матчи считаются по тому же адресу, что и весь остальной перенос
-- (fic_адрес): у матча два продолжения — клетка победителя и клетка
-- проигравшего в следующем круге, и дальше рекурсивно от них.
--
-- Звать может только админ или менеджер: функции написаны с правами
-- владельца, поэтому роль проверяется внутри.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Хранилище для отката ----

CREATE TABLE IF NOT EXISTS public.bracket_undo (
    tournament_id text PRIMARY KEY,
    saved_at      timestamptz NOT NULL DEFAULT now(),
    saved_by      uuid,
    payload       jsonb NOT NULL
);

COMMENT ON TABLE public.bracket_undo IS
    'Снимок затронутых матчей перед пересборкой. Один шаг назад на турнир: история не нужна.';

ALTER TABLE public.bracket_undo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bracket_undo_staff ON public.bracket_undo;
CREATE POLICY bracket_undo_staff ON public.bracket_undo
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')));

-- ---- Кто зовёт ----

CREATE OR REPLACE FUNCTION public.fic_это_персонал()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'));
$$;

COMMENT ON FUNCTION public.fic_это_персонал() IS
    'Правку сетки задним числом делает только админ или менеджер.';

-- ---- Что зависит от матча ----

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
      FROM matches m WHERE m.id = p_матч;
    IF v_турнир IS NULL THEN RETURN; END IF;

    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = v_турнир AND round_number = 1;
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
           AND (m.player1_id IS NOT NULL OR m.player2_id IS NOT NULL)
         ORDER BY m.round_number, m.match_order;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fic_затронутые(uuid) IS
    'Какие матчи зависят от этого: их и покажем судье до правки.';

-- ---- Правка ----

CREATE OR REPLACE FUNCTION public.fic_правка(
    p_матч       uuid,
    p_победитель text,     -- NULL = снять результат, вернуть в «не сыгран»
    p_счёт       text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_турнир   text;
    v_старый   text;
    v_снимок   jsonb;
    v_затронуто integer;
    v_сетка    integer;
    v_кругов   integer;
    v_круг     integer;
    v_стар_прг text;
    v_круг_матча integer;
BEGIN
    IF NOT public.fic_это_персонал() THEN
        RAISE EXCEPTION 'Правку сетки делает админ или менеджер';
    END IF;

    SELECT tournament_id, winner_id, round_number
      INTO v_турнир, v_старый, v_круг_матча
      FROM matches WHERE id = p_матч;
    IF v_турнир IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'матч не найден');
    END IF;

    -- Победитель тот же, поменялся только счёт — дальше по сетке не трогаем
    IF p_победитель IS NOT NULL AND v_старый IS NOT DISTINCT FROM p_победитель THEN
        UPDATE matches SET score = p_счёт WHERE id = p_матч;
        RETURN jsonb_build_object('ok', true, 'затронуто', 0, 'только_счёт', true);
    END IF;

    -- Запоминаем, что было: сам матч и всё, что от него зависит
    SELECT jsonb_agg(to_jsonb(x)) INTO v_снимок
      FROM (
        SELECT m.id, m.player1_id, m.player2_id, m.seed1, m.seed2,
               m.winner_id, m.score, m.status, m.played_at
          FROM matches m
         WHERE m.id = p_матч
            OR m.id IN (SELECT z.id FROM public.fic_затронутые(p_матч) z)
      ) x;

    INSERT INTO public.bracket_undo (tournament_id, saved_by, payload)
    VALUES (v_турнир, auth.uid(), coalesce(v_снимок, '[]'::jsonb))
    ON CONFLICT (tournament_id)
    DO UPDATE SET payload = excluded.payload, saved_at = now(), saved_by = excluded.saved_by;

    -- Зависимым матчам снимаем счёт: он относился к другой паре. А вот людей
    -- не трогаем — в клетке рядом стоит соперник из совсем другого матча, и
    -- он к этой правке отношения не имеет. Подменится только тот, кто приехал
    -- из изменённого матча: это делает fic_заменить_дальше ниже.
    UPDATE matches
       SET winner_id = NULL, score = NULL, status = 'upcoming', played_at = NULL
     WHERE id IN (SELECT z.id FROM public.fic_затронутые(p_матч) z);
    GET DIAGNOSTICS v_затронуто = ROW_COUNT;

    -- Кто ехал дальше из этого матча
    SELECT CASE WHEN v_старый = m.player1_id THEN m.player2_id ELSE m.player1_id END
      INTO v_стар_прг
      FROM matches m WHERE m.id = p_матч;

    -- И ставим новый результат: триггер сам разведёт людей дальше
    IF p_победитель IS NULL THEN
        UPDATE matches
           SET winner_id = NULL, score = NULL, status = 'upcoming', played_at = NULL
         WHERE id = p_матч;

        -- Результата больше нет — значит и ехать дальше некому: убираем
        -- обоих из клеток следующих кругов, соседей оставляя на месте.
        UPDATE matches SET player1_id = NULL, seed1 = NULL
         WHERE tournament_id = v_турнир AND round_number > v_круг_матча
           AND player1_id IN (v_старый, v_стар_прг);
        UPDATE matches SET player2_id = NULL, seed2 = NULL
         WHERE tournament_id = v_турнир AND round_number > v_круг_матча
           AND player2_id IN (v_старый, v_стар_прг);
    ELSE
        UPDATE matches
           SET winner_id = p_победитель, score = p_счёт,
               status = 'completed', played_at = now()
         WHERE id = p_матч;
    END IF;

    -- Зависимые клетки мы чистили целиком, а в них мог стоять человек из
    -- другого матча — его тоже стёрло. Поэтому проводим заново всех, кто уже
    -- сыграл: идём кругами от первого, каждый победитель встаёт на своё
    -- место. Клетки, где счёт остался, его сохраняют.
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = v_турнир AND round_number = 1;
    v_кругов := CASE WHEN v_сетка > 1 THEN log(2, v_сетка::numeric)::int ELSE 0 END;

    FOR v_круг IN 1..greatest(v_кругов - 1, 1) LOOP
        UPDATE matches SET status = status
         WHERE tournament_id = v_турнир
           AND round_number = v_круг
           AND winner_id IS NOT NULL;
    END LOOP;

    PERFORM public.fic_закрыть_проходы(v_турнир);

    RETURN jsonb_build_object('ok', true, 'затронуто', v_затронуто,
                              'снято', p_победитель IS NULL);
END;
$$;

COMMENT ON FUNCTION public.fic_правка(uuid, text, text) IS
    'Меняет или снимает результат. Зависимые матчи очищаются, прежнее состояние сохраняется для отката.';

-- ---- Откат ----

CREATE OR REPLACE FUNCTION public.fic_откатить(p_турнир text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_снимок jsonb;
    v_вернули integer := 0;
BEGIN
    IF NOT public.fic_это_персонал() THEN
        RAISE EXCEPTION 'Откат делает админ или менеджер';
    END IF;

    SELECT payload INTO v_снимок FROM public.bracket_undo
     WHERE tournament_id = p_турнир;
    IF v_снимок IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'откатывать нечего');
    END IF;

    UPDATE matches m
       SET player1_id = (b->>'player1_id'),
           player2_id = (b->>'player2_id'),
           seed1      = (b->>'seed1')::integer,
           seed2      = (b->>'seed2')::integer,
           winner_id  = (b->>'winner_id'),
           score      = (b->>'score'),
           status     = (b->>'status'),
           played_at  = (b->>'played_at')::timestamptz
      FROM jsonb_array_elements(v_снимок) AS b
     WHERE m.id = (b->>'id')::uuid;
    GET DIAGNOSTICS v_вернули = ROW_COUNT;

    DELETE FROM public.bracket_undo WHERE tournament_id = p_турнир;

    RETURN jsonb_build_object('ok', true, 'возвращено', v_вернули);
END;
$$;

COMMENT ON FUNCTION public.fic_откатить(text) IS
    'Возвращает сетку в состояние до последней правки. Один шаг назад.';

-- ---- Права ----

REVOKE EXECUTE ON FUNCTION public.fic_правка(uuid, text, text)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fic_откатить(text)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fic_затронутые(uuid)          FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fic_правка(uuid, text, text)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fic_откатить(text)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fic_затронутые(uuid)          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fic_это_персонал()            TO authenticated, service_role;

COMMIT;
