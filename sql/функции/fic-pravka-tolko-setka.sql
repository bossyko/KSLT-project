-- ============================================================
-- Правка результата не трогает группы
-- ============================================================
--
-- `fic_правка` осталась последней функцией семейства, где матч сетки не
-- отделён от группового. Соседние четыре — `fic_заменить_дальше`,
-- `advance_bracket_winner`, `fic_итоги`, `fic_закрыть_проходы` — починены
-- файлом `fic-zameny-tolko-setka.sql`, а `fic_затронутые` — файлом
-- `fic-zatronutye-tolko-setka.sql`. Проверка чтением базы 01.10 показала у
-- них `true`, а у `fic_правка` — `false`: отбора в её теле нет вовсе.
--
-- ЧТО ИМЕННО СЛОМАНО. Круги нумеруются с единицы и у сетки, и у групп: в
-- группе из четырёх пар это круги 1, 2, 3. Поэтому:
--
--   1. Размер сетки считался как «матчи первого круга × 2». Замер 01.10 на
--      турнире c6883b98: `round_number = 1` держат 24 матча — 8 клеток R1,
--      14 ГРУППОВЫХ и 2 отборочных. Сетка выходила 48 вместо 16.
--
--   2. СНЯТИЕ РЕЗУЛЬТАТА зануляло игроков во всех матчах с
--      `round_number > круга`, то есть и во втором и третьем турах КАЖДОЙ
--      группы. Это та же беда, что описана в `fic-zameny-tolko-setka.sql`:
--      «в группе A вместо Анвара встали пары из группы E».
--
-- ПОЧЕМУ ЭТО НЕ ВЫСТРЕЛИЛО РАНЬШЕ. Опасна только ветка снятия
-- (`p_победитель IS NULL`), а в обычной сетке плей-офф кнопки «Снять» нет:
-- `data-match-clear` рисует лишь FIC-карточка. Смена победителя идёт другой
-- веткой и чистит зависимых через `fic_затронутые`, которая уже пропатчена.
-- Дыра лежала заряженной и ждала кнопки.
--
-- ЛЕЧИМ ТАК ЖЕ, КАК В СОСЕДНИХ ФУНКЦИЯХ, А НЕ ПО-СВОЕМУ: матч сетки — это
-- `group_number IS NULL` и не отборочный круг. Одно определение на одно
-- понятие; пятое написание того же условия здесь не заводится.
--
-- Файл меняет базу. Проверка — в `fic-pravka-tolko-setka-proverka.sql`.
-- Запускать можно повторно.

BEGIN;

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
        --
        -- ТОЛЬКО СЕТКА. Без этого отбора зануление уходило в групповые туры
        -- 2 и 3: у групп свои круги с теми же номерами.
        UPDATE matches SET player1_id = NULL, seed1 = NULL
         WHERE tournament_id = v_турнир AND round_number > v_круг_матча
           AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
           AND player1_id IN (v_старый, v_стар_прг);
        UPDATE matches SET player2_id = NULL, seed2 = NULL
         WHERE tournament_id = v_турнир AND round_number > v_круг_матча
           AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
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
    --
    -- РАЗМЕР СЕТКИ СЧИТАЕТСЯ ПО КЛЕТКАМ СЕТКИ. Раньше в первый круг шли и
    -- групповые, и отборочные: на c6883b98 выходило 48 вместо 16.
    SELECT count(*) * 2 INTO v_сетка FROM matches
     WHERE tournament_id = v_турнир AND round_number = 1
       AND group_number IS NULL AND round IS DISTINCT FROM 'IG';
    v_кругов := CASE WHEN v_сетка > 1 THEN log(2, v_сетка::numeric)::int ELSE 0 END;

    FOR v_круг IN 1..greatest(v_кругов - 1, 1) LOOP
        UPDATE matches SET status = status
         WHERE tournament_id = v_турнир
           AND round_number = v_круг
           AND group_number IS NULL AND round IS DISTINCT FROM 'IG'
           AND winner_id IS NOT NULL;
    END LOOP;

    PERFORM public.fic_закрыть_проходы(v_турнир);

    RETURN jsonb_build_object('ok', true, 'затронуто', v_затронуто,
                              'снято', p_победитель IS NULL);
END;
$$;

COMMENT ON FUNCTION public.fic_правка(uuid, text, text) IS
    'Меняет или снимает результат В СЕТКЕ. Зависимые клетки очищаются, прежнее состояние сохраняется для отката. Группы и отборочные не трогает: у них свои круги с теми же номерами.';

REVOKE EXECUTE ON FUNCTION public.fic_правка(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fic_правка(uuid, text, text) TO authenticated, service_role;

COMMIT;
