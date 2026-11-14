-- ЖУРНАЛ ЗАЯВОК НА ТУРНИР. 13.11
--
-- ЗАЧЕМ. Рамиль Мифтахутдинов сказал, что подавал заявку на «Итоговый
-- TOP 8 MASTERS», а в составе его не было. Разрешить спор было НЕЧЕМ:
-- подача заявки не оставляла следа вовсе. В `registration_changes`
-- пусто (он про замены в сетке), в журнале уведомлений записи о подаче
-- нет ни у кого — система их туда не пишет.
--
-- ПОЧЕМУ ТРИГГЕР, А НЕ КОД. Мест, где заявки создаются и меняются,
-- больше сорока: `js/admin/sections/bracket.js` — 35 обращений,
-- серверная `tournament-register` — 12, плюс кабинет, страница турнира
-- и правки запросами. Веди журнал из кода — одно место рано или поздно
-- забудет записать, и спор снова будет нечем разрешить. База видит все
-- изменения разом, включая правки запросом мимо экрана.
--
-- `kto` ПУСТОЙ — ЭТО НЕ «НЕИЗВЕСТНО», А ЗАПРОС В БАЗУ. `auth.uid()`
-- возвращает NULL, когда правка идёт не от человека: под service_role
-- или из SQL-редактора. Экран так и пишет: «запросом в базу».
--
-- ЧЕМ ПЛАТИМ, НАЗВАНО ДО ПРАВКИ: журнал пишется на каждое изменение,
-- включая массовые — пересборку сетки и сброс турнира. На таких
-- операциях появятся десятки строк разом. Это и нужно, чтобы видеть,
-- что именно снесло заявки, но таблица будет расти; чистку заведём,
-- когда станет заметно.
--
-- ЗАДНИМ ЧИСЛОМ ВОССТАНОВИТЬ НЕЧЕГО: журнал пишет с момента создания.

BEGIN;

CREATE TABLE IF NOT EXISTS public.registration_log (
    id            bigserial PRIMARY KEY,
    tournament_id text        NOT NULL,
    player_id     text,
    partner_id    text,
    deystvie      text        NOT NULL,   -- podana | snyata | status | udalena
    bylo          text,
    stalo         text,
    kto           uuid,                   -- profiles.id, null = правка запросом
    kogda         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registration_log_turnir_idx
    ON public.registration_log (tournament_id, kogda DESC);

ALTER TABLE public.registration_log ENABLE ROW LEVEL SECURITY;

-- ЖУРНАЛ ВИДЯТ ТОЛЬКО СОТРУДНИКИ: в нём видно, кто что сделал с чужими
-- заявками, и игроку это знать незачем.
DROP POLICY IF EXISTS "Staff read registration log" ON public.registration_log;
CREATE POLICY "Staff read registration log" ON public.registration_log
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE OR REPLACE FUNCTION public.zapisat_zayavku()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.registration_log
               (tournament_id, player_id, partner_id, deystvie, stalo, kto)
        VALUES (NEW.tournament_id, NEW.player_id, NEW.partner_id,
                'podana', NEW.status, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.registration_log
               (tournament_id, player_id, partner_id, deystvie, bylo, kto)
        VALUES (OLD.tournament_id, OLD.player_id, OLD.partner_id,
                'udalena', OLD.status, auth.uid());
        RETURN OLD;
    ELSE
        -- ПИШЕМ ТОЛЬКО ЗНАЧИМОЕ. Заявку трогают и ради мелочей — место в
        -- сетке, номер посева, — и журнал от них зарос бы шумом.
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            INSERT INTO public.registration_log
                   (tournament_id, player_id, partner_id, deystvie, bylo, stalo, kto)
            VALUES (NEW.tournament_id, NEW.player_id, NEW.partner_id,
                    CASE WHEN NEW.withdrawn_at IS NOT NULL
                           AND OLD.withdrawn_at IS NULL THEN 'snyata'
                         ELSE 'status' END,
                    OLD.status, NEW.status, auth.uid());
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_zapisat_zayavku ON public.tournament_registrations;
CREATE TRIGGER trg_zapisat_zayavku
    AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
    FOR EACH ROW EXECUTE FUNCTION public.zapisat_zayavku();

COMMIT;

-- ПРОВЕРКА
SELECT deystvie, player_id, bylo, stalo, kto, kogda
  FROM public.registration_log ORDER BY kogda DESC LIMIT 5;
