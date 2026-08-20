-- ============================================
-- Счёт матча не сохраняется: UUID в целочисленной переменной
-- ============================================
--
-- Симптом: при вводе счёта база отвечает
--   22P02: invalid input syntax for type integer: "<uuid>"
-- и матч не записывается. Ломается любой ввод: и баттлы, и турнирная сетка.
--
-- Причина: в recalc_after_match() переменная mid объявлена как integer,
-- а matches.id — UUID. Присваивание mid := NEW.id падает сразу, до всякой
-- полезной работы. Появилось это 18 августа, когда в функцию добавили
-- поиск напарников по парному баттлу — тип переменной взяли неверный,
-- а ввод счёта после миграции не проверяли.
--
-- Правка одна: mid становится uuid. Остальное тело не трогаем.
--
-- Проверка — вводом счёта на сайте. Отдельного блока с пробной вставкой
-- здесь нет намеренно: редактор Supabase выполняет скрипт одной
-- транзакцией, и откат пробной строки уносил бы с собой саму правку.

CREATE OR REPLACE FUNCTION public.recalc_after_match()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ids  text[];
    tid  text;
    mid  uuid;   -- было integer: matches.id — UUID, и присваивание падало
BEGIN
    IF TG_OP = 'DELETE' THEN
        ids := ARRAY(
            SELECT DISTINCT x FROM unnest(ARRAY[OLD.player1_id, OLD.player2_id]) AS x
            WHERE x IS NOT NULL
        );
        tid := OLD.tournament_id;
        mid := OLD.id;
    ELSE
        ids := ARRAY(
            SELECT DISTINCT x FROM unnest(ARRAY[
                NEW.player1_id, NEW.player2_id,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.player1_id END,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.player2_id END
            ]) AS x
            WHERE x IS NOT NULL
        );
        tid := NEW.tournament_id;
        mid := NEW.id;
    END IF;

    IF array_length(ids, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    -- Напарники капитанов из этого турнира
    IF tid IS NOT NULL THEN
        ids := ids || ARRAY(
            SELECT DISTINCT r.partner_id
            FROM tournament_registrations r
            WHERE r.tournament_id = tid
              AND r.player_id = ANY(ids)
              AND r.partner_id IS NOT NULL
        );
    END IF;

    -- Напарники из парного баттла
    ids := ids || ARRAY(
        SELECT DISTINCT x FROM (
            SELECT unnest(ARRAY[c.challenger_partner_id, c.opponent_partner_id]) AS x
            FROM challenges c WHERE c.match_id = mid
        ) q WHERE x IS NOT NULL
    );

    PERFORM public.recalc_player_categories(ids);
    PERFORM public.recalc_pair_stats(ids);

    PERFORM public.check_and_award_badges(pid) FROM unnest(ids) AS pid;

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.recalc_after_match() OWNER TO postgres;
