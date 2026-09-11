-- ============================================================
-- У карточки игрока есть учётная запись — или нет
-- ============================================================
--
-- Кнопка «Вызвать» имеет смысл только тогда, когда по ту сторону есть живой
-- человек: карточка перенесена из списков клуба, а сам игрок на платформе не
-- регистрировался — вызов повиснет и никто его не увидит.
--
-- До сих пор эту роль играла отметка об оплаченном членстве. Пока платят —
-- совпадало; в бесплатный период платежей нет вовсе, и признак перестал
-- работать: кнопка появилась у всех подряд.
--
-- Поэтому заводим отдельный признак: связана ли карточка с учётной записью.
-- Он ничего не рассказывает о человеке — только «аккаунт есть», — и потому
-- открыт всем, как и остальная карточка. Держит его в порядке триггер: любая
-- привязка или отвязка профиля сразу отражается на карточке.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS has_account boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.players.has_account IS
    'Есть ли у карточки учётная запись на платформе. По нему решается, можно ли звать игрока на матч';

-- ---- Проставить по тому, что есть сейчас ----

UPDATE public.players p
   SET has_account = EXISTS (
        SELECT 1 FROM public.profiles pr
         WHERE pr.player_id = p.id
           AND pr.deleted_at IS NULL);

-- ---- Держать в порядке дальше ----

CREATE OR REPLACE FUNCTION public.обновить_признак_учётки()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Пересчитываем обе стороны: и ту карточку, к которой привязались,
    -- и ту, от которой отвязались
    IF TG_OP <> 'INSERT' AND OLD.player_id IS NOT NULL THEN
        UPDATE public.players p
           SET has_account = EXISTS (SELECT 1 FROM public.profiles pr
                                      WHERE pr.player_id = p.id AND pr.deleted_at IS NULL)
         WHERE p.id = OLD.player_id;
    END IF;

    IF TG_OP <> 'DELETE' AND NEW.player_id IS NOT NULL THEN
        UPDATE public.players p
           SET has_account = EXISTS (SELECT 1 FROM public.profiles pr
                                      WHERE pr.player_id = p.id AND pr.deleted_at IS NULL)
         WHERE p.id = NEW.player_id;
    END IF;

    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_признак_учётки ON public.profiles;
CREATE TRIGGER trg_признак_учётки
    AFTER INSERT OR DELETE OR UPDATE OF player_id, deleted_at ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.обновить_признак_учётки();

COMMIT;

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE has_account)     AS с_учётной_записью,
       count(*) FILTER (WHERE NOT has_account) AS без_неё,
       count(*)                                AS всего
  FROM public.players
 WHERE NOT is_guest;
