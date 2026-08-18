-- ============================================
-- Пересчёт после матча — сам, а не по кнопке
-- ============================================
--
-- Что не так сейчас.
--
-- Судья вводит счёт, матч записывается в базу — и всё. Очки, победы,
-- поражения, форма последних пяти матчей и достижения игрока остаются
-- прежними. Пересчёт живёт в функции recalc_player_categories, но зовут её
-- только руками, из админки, из раздела игроков.
--
-- То есть рейтинг обновляется не тогда, когда сыграли, а тогда, когда
-- кто-то вспомнил нажать кнопку. Между этими двумя моментами сайт показывает
-- вчерашнюю правду: игрок выиграл турнир, а в его карточке ничего.
--
-- Что делаем.
--
-- Вешаем триггер на таблицу матчей. Записался результат — пересчёт случился.
-- Неважно, кто записал: сетка турнира, судейский экран, админка или запрос
-- напрямую. Договорённость «не забудь нажать» заменяем на правило базы.
--
-- Заодно там же начисляем достижения: иначе «Первая победа» тоже будет
-- ждать, пока кто-нибудь зайдёт в админку.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM matches WHERE winner_id IS NOT NULL) AS матчей_с_результатом,
       (SELECT count(*) FROM players)                             AS игроков,
       (SELECT count(*) FROM pg_trigger
         WHERE tgrelid = 'public.matches'::regclass
           AND NOT tgisinternal)                                  AS триггеров_на_матчах;


-- ---- 2. Функция триггера ------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_after_match()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ids text[];
BEGIN
    -- Считаем обоих участников: и того, кто выиграл, и того, кто проиграл.
    -- При правке результата задеты и старые игроки строки, поэтому берём
    -- их тоже — иначе у прежнего победителя останется лишняя победа
    ids := ARRAY(
        SELECT DISTINCT x FROM unnest(ARRAY[
            NEW.player1_id, NEW.player2_id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.player1_id END,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.player2_id END
        ]) AS x
        WHERE x IS NOT NULL
    );

    IF array_length(ids, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    PERFORM public.recalc_player_categories(ids);

    -- Достижения начисляем здесь же: «Первая победа» должна прилетать
    -- сразу после матча, а не после чьего-то захода в админку
    PERFORM public.check_and_award_badges(pid) FROM unnest(ids) AS pid;

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.recalc_after_match() OWNER TO postgres;


-- ---- 3. Триггер ---------------------------------------------------------
-- AFTER, а не BEFORE: пересчёт должен видеть уже записанный результат.
-- STATEMENT-триггер тут не годится — нужны конкретные игроки строки.
DROP TRIGGER IF EXISTS trg_recalc_after_match ON public.matches;

CREATE TRIGGER trg_recalc_after_match
    AFTER INSERT OR UPDATE OF winner_id, score, status, played_at
    ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_after_match();


-- ---- 4. Разовый пересчёт по всем ---------------------------------------
-- Матчи, сыгранные до сегодня, в статистику могли не попасть: их результаты
-- записывались, когда пересчёта не было
SELECT public.recalc_player_categories(ARRAY(SELECT id FROM players));

DO $do$
DECLARE p record;
BEGIN
    FOR p IN SELECT id FROM players LOOP
        PERFORM public.check_and_award_badges(p.id);
    END LOOP;
END $do$;


-- ---- 5. ПРОВЕРКА --------------------------------------------------------
SELECT
    (SELECT count(*) FROM pg_trigger
      WHERE tgrelid = 'public.matches'::regclass
        AND tgname = 'trg_recalc_after_match')          AS триггер_стоит,
    (SELECT count(*) FROM players WHERE wins > 0)       AS игроков_с_победами,
    (SELECT count(*) FROM players
      WHERE form IS NOT NULL AND array_length(form, 1) > 0) AS игроков_с_формой,
    (SELECT count(*) FROM player_badges)                AS достижений_выдано;
