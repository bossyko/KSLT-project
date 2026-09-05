-- ============================================================
-- Сетка двигается после подтверждения, а не сразу
-- ============================================================
--
-- Уговор был такой: игрок вписал счёт — сетка ждёт, пока второй подтвердит.
-- В олимпийке ошибка дорогая: следующий круг уже расписан, и если счёт
-- оспорят, оттуда придётся вынимать не того человека.
--
-- Сделано было иначе, и это моя недоработка. При вводе матч сразу получает
-- победителя и статус «завершён» — иначе счёт не показать в списках, — а
-- триггер продвижения срабатывает именно на это. Выходило, что сетка едет
-- вперёд ещё до ответа соперника.
--
-- Здесь триггер учится ждать. Правило простое: двигаем, когда счёт
-- окончательный.
--
--   вписан менеджером или судьёй   — состояние пусто, двигаем сразу,
--                                    как и было раньше
--   вписан игроком, ждёт ответа    — не двигаем
--   подтверждён или принят по сроку — двигаем
--   оспорен                        — не двигаем, ждём организатора
--
-- Заодно триггер начинает слушать само состояние счёта: подтверждение
-- меняет только его, и без этого продвижение не запустилось бы вовсе.
--
-- Файл меняет базу. Требует bracket-advance-on-server.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.trg_advance_bracket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Счёт ещё не окончательный: ждёт второго или оспорен
    IF NEW.score_status IN ('pending', 'disputed') THEN
        RETURN NULL;
    END IF;

    IF NEW.winner_id IS NOT NULL
       AND NEW.status = 'completed'
       AND (TG_OP = 'INSERT'
            OR OLD.winner_id IS DISTINCT FROM NEW.winner_id
            OR OLD.status IS DISTINCT FROM NEW.status
            OR OLD.score_status IS DISTINCT FROM NEW.score_status)
    THEN
        PERFORM public.advance_bracket_winner(NEW.id);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_bracket ON public.matches;

-- Слушаем и состояние счёта: подтверждение меняет только его
CREATE TRIGGER trg_advance_bracket
    AFTER INSERT OR UPDATE OF winner_id, status, score_status ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_advance_bracket();

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================
-- Матчи, чей счёт ещё не окончательный. Пока они в этом списке, следующий
-- круг за ними заполняться не должен.
--
-- SELECT m.id, m.round, m.score, m.score_status,
--        p1.name AS игрок1, p2.name AS игрок2
--   FROM matches m
--   LEFT JOIN players p1 ON p1.id = m.player1_id
--   LEFT JOIN players p2 ON p2.id = m.player2_id
--  WHERE m.score_status IN ('pending', 'disputed')
--  ORDER BY m.score_submitted_at DESC;
