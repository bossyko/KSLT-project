-- ============================================
-- Счёт парных игр: пары и микст порознь, и считает база
-- ============================================
--
-- Что не так сейчас.
--
-- Парный счёт у нас есть, но живёт он неудачно. Считает его браузер:
-- функция recalcDoublesPoints в админке, в разделе сетки. Она срабатывает,
-- когда менеджер сохраняет результаты парного турнира, — и только тогда.
-- Сыграли матч, результат записали судейским экраном — счёт не изменился.
--
-- Второе: она складывает парные и смешанные турниры в одну кучу. Разделить
-- их потом нельзя: из суммы два числа не достанешь.
--
-- Третье, и самое неприятное: она считает по player1_id и player2_id,
-- а в парном матче там записаны только капитаны пар. Напарник в матче не
-- упомянут вовсе — и своих парных побед не видел. У половины участников
-- парных турниров счёт был нулевым, хотя они играли.
--
-- Что делаем.
--
-- Переносим подсчёт в recalc_player_categories, к остальной статистике.
-- Её уже зовёт триггер после каждого матча — значит парный счёт будет
-- обновляться сам, как и одиночный.
--
-- Заодно чиним сам триггер: он срабатывал на добавление и правку матча,
-- но не на удаление. Админка стирает всю сетку при пересоздании и убирает
-- матч отменённого баттла — и победа оставалась в счёте игрока после того,
-- как сам матч исчезал.
--
-- Пары и микст считаем врозь: doubles_wins/losses и mixed_wins/losses.
-- Показывать их можно и вместе, и порознь — сумма всегда под рукой.
--
-- Состав пары берём из заявки на турнир: в зачёт идёт и капитан, и напарник.
--
-- Что удаляем.
--
-- doubles_points, doubles_rank_change и doubles_form. Рейтинг у нас
-- одиночный, очков за пары нет — эти колонки заполнялись и не читались
-- никем. Проверено: ни один запрос сайта, приложения или функции их не
-- показывает. Оставлять числа, которые никто не видит и никто не проверяет,
-- значит однажды на них сослаться.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM tournaments
         WHERE format = 'doubles')                            AS парных_турниров,
       (SELECT count(*) FROM tournaments
         WHERE format = 'mixed_doubles')                      AS микст_турниров,
       (SELECT count(*) FROM players WHERE doubles_wins > 0)  AS игроков_со_счётом;


-- ---- 2. Новые колонки ---------------------------------------------------
ALTER TABLE players ADD COLUMN IF NOT EXISTS mixed_wins   integer DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS mixed_losses integer DEFAULT 0;

COMMENT ON COLUMN players.doubles_wins  IS 'Победы в парных турнирах (без микста). Считает recalc_player_categories';
COMMENT ON COLUMN players.doubles_losses IS 'Поражения в парных турнирах (без микста)';
COMMENT ON COLUMN players.mixed_wins    IS 'Победы в смешанных турнирах';
COMMENT ON COLUMN players.mixed_losses  IS 'Поражения в смешанных турнирах';


-- ---- 3. Подсчёт парных и микст -----------------------------------------
-- Отдельной функцией, а не куском внутри recalc_player_categories: её
-- удобно позвать руками, и видно, что она делает.
--
-- Пара в матче представлена капитаном. Кто с ним играл, знает только заявка,
-- поэтому соединяем матч с заявкой того же турнира и берём обе половины:
-- и player_id (капитан), и partner_id (напарник).
--
-- Дружеские парные турниры считаем наравне с остальными. Дружеские мы
-- исключаем из рейтинговой статистики, потому что там разыгрывается место
-- в таблице. В парах таблицы нет — есть только «сколько сыграл».
CREATE OR REPLACE FUNCTION public.recalc_pair_stats(p_ids text[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE players p
    SET doubles_wins = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id = r.player_id),
        doubles_losses = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id IS NOT NULL
              AND m.winner_id <> r.player_id),
        mixed_wins = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'mixed_doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id = r.player_id),
        mixed_losses = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'mixed_doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND m.winner_id IS NOT NULL
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id <> r.player_id)
    WHERE p.id = ANY(p_ids);
END;
$$;

ALTER FUNCTION public.recalc_pair_stats(text[]) OWNER TO postgres;
GRANT ALL ON FUNCTION public.recalc_pair_stats(text[]) TO authenticated;
GRANT ALL ON FUNCTION public.recalc_pair_stats(text[]) TO service_role;


-- ---- 4. Зовём её оттуда, откуда идёт весь пересчёт -----------------------
-- Триггер после матча уже зовёт recalc_player_categories. Добавляем вызов
-- туда — и парный счёт начинает жить по тому же правилу, что одиночный:
-- сыграли, записали результат, числа обновились.
--
-- Напарник в матче не записан, поэтому триггер передаёт сюда только капитанов.
-- Их напарников достаём здесь же, из заявок: иначе у половины пары счёт
-- обновлялся бы через раз.
CREATE OR REPLACE FUNCTION public.recalc_after_match()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ids text[];
    tid  text;
BEGIN
    -- При удалении строки NEW пуста: игроков берём из OLD. Матчи удаляются
    -- не в теории — админка стирает всю сетку при пересоздании и убирает
    -- матч отменённого баттла. Без этой ветки победа оставалась в счёте
    -- игрока после того, как сам матч исчезал
    IF TG_OP = 'DELETE' THEN
        ids := ARRAY(
            SELECT DISTINCT x FROM unnest(ARRAY[OLD.player1_id, OLD.player2_id]) AS x
            WHERE x IS NOT NULL
        );
        tid := OLD.tournament_id;
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
    END IF;

    IF array_length(ids, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    -- Напарники капитанов из этого турнира: в парном матче их имён нет,
    -- а счёт менять надо и им
    IF tid IS NOT NULL THEN
        ids := ids || ARRAY(
            SELECT DISTINCT r.partner_id
            FROM tournament_registrations r
            WHERE r.tournament_id = tid
              AND r.player_id = ANY(ids)
              AND r.partner_id IS NOT NULL
        );
    END IF;

    PERFORM public.recalc_player_categories(ids);
    PERFORM public.recalc_pair_stats(ids);

    PERFORM public.check_and_award_badges(pid) FROM unnest(ids) AS pid;

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.recalc_after_match() OWNER TO postgres;

-- Триггер пересоздаём: в прежнем не было удаления
DROP TRIGGER IF EXISTS trg_recalc_after_match ON public.matches;

CREATE TRIGGER trg_recalc_after_match
    AFTER INSERT OR DELETE OR UPDATE OF winner_id, score, status, played_at
    ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_after_match();


-- ---- 5. Пересчёт по всем игрокам ---------------------------------------
SELECT public.recalc_pair_stats(ARRAY(SELECT id FROM players));


-- ---- 6. Убираем то, чего никто не читает --------------------------------
-- Очки за пары не начисляются: рейтинг одиночный. Форма парных матчей
-- грузилась страницей игрока и нигде не показывалась.
ALTER TABLE players DROP COLUMN IF EXISTS doubles_points;
ALTER TABLE players DROP COLUMN IF EXISTS doubles_rank_change;
ALTER TABLE players DROP COLUMN IF EXISTS doubles_form;


-- ---- 7. ПРОВЕРКА --------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'players'
        AND column_name IN ('doubles_wins','doubles_losses','mixed_wins','mixed_losses')) AS колонок_счёта,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'players'
        AND column_name IN ('doubles_points','doubles_rank_change','doubles_form'))       AS лишних_осталось,
    (SELECT count(*) FROM players WHERE doubles_wins + doubles_losses > 0)                AS игроков_с_парными,
    (SELECT count(*) FROM players WHERE mixed_wins + mixed_losses > 0)                    AS игроков_с_микстом,
    (SELECT count(*) FROM pg_proc WHERE proname = 'recalc_pair_stats')                    AS функция_на_месте;
