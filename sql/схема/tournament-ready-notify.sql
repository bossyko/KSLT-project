-- ============================================================
-- «Все матчи сыграны» — зовём организатора закрывать турнир
-- ============================================================
--
-- Счёт теперь попадает в базу тремя путями: вписал игрок и подтвердил
-- соперник, вписал менеджер, поставил судья на корте. Все три равноправны.
--
-- А вот очки начисляются только когда организатор закроет турнир: они
-- считаются по итоговому месту, а не по матчу, и до закрытия мест ещё нет.
-- Раньше он и так вбивал счета сам и видел, когда всё сыграно. Теперь
-- счета появляются без него — и он может просто не заметить, что турнир
-- доигран.
--
-- Здесь база смотрит после каждого закрытого матча: не остался ли турнир
-- без незавершённых. Остался — молчим. Не остался — пишем организаторам,
-- что можно закрывать.
--
-- Закрывает по-прежнему человек. Начисление очков — его решение: бывает,
-- что после последнего матча ещё что-то правят, а разосланные очки назад
-- не соберёшь.
--
-- Пишем один раз на турнир: отметку держим в самой записи турнира.
--
-- Файл меняет базу. Требует match-score-notify-doubles.sql.

BEGIN;

ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS ready_notified_at timestamptz;

COMMENT ON COLUMN public.tournaments.ready_notified_at IS
    'Когда организаторам сказали, что все матчи сыграны и турнир можно закрывать. Чтобы не сказать дважды.';

CREATE OR REPLACE FUNCTION public.notify_tournament_ready(p_tournament_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    t         RECORD;
    v_кому    uuid;
    v_осталось integer;
    v_текст   text;
BEGIN
    SELECT * INTO t FROM tournaments WHERE id = p_tournament_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- Уже говорили или турнир и так закрыт
    IF t.ready_notified_at IS NOT NULL OR t.status = 'completed' THEN RETURN; END IF;

    -- Незакрытые матчи. Свободные проходы (BYE) считаются сыгранными,
    -- у них сразу стоит победитель
    SELECT count(*) INTO v_осталось
      FROM matches m
     WHERE m.tournament_id = p_tournament_id
       AND (m.winner_id IS NULL
            OR m.score_status IN ('pending', 'disputed'));

    IF v_осталось > 0 THEN RETURN; END IF;

    -- Турнир без матчей закрывать нечего
    IF NOT EXISTS (SELECT 1 FROM matches WHERE tournament_id = p_tournament_id) THEN
        RETURN;
    END IF;

    v_текст := 'Все матчи турнира «' || COALESCE(t.title, p_tournament_id) ||
               '» сыграны. Можно закрывать турнир — очки начислятся после этого.';

    FOR v_кому IN
        SELECT id FROM profiles WHERE role IN ('admin', 'manager')
    LOOP
        INSERT INTO notification_log (profile_id, type, title, message)
        VALUES (v_кому, 'tournament', 'Турнир сыгран', v_текст);
    END LOOP;

    UPDATE tournaments SET ready_notified_at = now() WHERE id = p_tournament_id;
END;
$$;

COMMENT ON FUNCTION public.notify_tournament_ready(text) IS
    'Говорит организаторам, что все матчи сыграны. Один раз на турнир.';

-- ---- Смотрим после каждого закрытого матча ----
--
-- Неважно, кто поставил счёт: игрок с подтверждением, менеджер или судья.

CREATE OR REPLACE FUNCTION public.trg_tournament_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.tournament_id IS NULL THEN RETURN NULL; END IF;
    IF NEW.winner_id IS NULL THEN RETURN NULL; END IF;
    IF NEW.score_status IN ('pending', 'disputed') THEN RETURN NULL; END IF;

    BEGIN
        PERFORM public.notify_tournament_ready(NEW.tournament_id);
    EXCEPTION WHEN others THEN
        RAISE WARNING 'не удалось позвать закрывать турнир: %', SQLERRM;
    END;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_tournament_ready ON public.matches;

CREATE TRIGGER trg_tournament_ready
    AFTER INSERT OR UPDATE OF winner_id, status, score_status ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_tournament_ready();

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================
-- Турниры, где всё сыграно, и сказали ли о них организаторам.
--
-- SELECT t.id, t.title, t.status, t.ready_notified_at AS сказали,
--        count(m.id) FILTER (WHERE m.winner_id IS NULL
--                              OR m.score_status IN ('pending','disputed')) AS незакрытых
--   FROM tournaments t
--   JOIN matches m ON m.tournament_id = t.id
--  GROUP BY t.id, t.title, t.status, t.ready_notified_at
--  ORDER BY t.date_start DESC;
