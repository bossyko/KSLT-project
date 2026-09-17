-- ============================================================
-- Снятая заявка больше не держит человека в паре
-- ============================================================
--
-- Правило «один игрок — одна пара в турнире» смотрело на все заявки подряд,
-- не глядя на их состояние. Из-за этого снятая или отклонённая заявка
-- продолжала занимать человека: менеджер берёт игрока из листа ожидания в
-- пару, система честно снимает его прежнюю заявку — и тут же упирается в
-- «Partner already registered as captain in this tournament».
--
-- Тот же тупик был у игрока, который снялся сам и захотел вернуться
-- напарником к другому.
--
-- Считаем занятыми только живые заявки. Снятая и отклонённая — след в
-- истории, а не место в турнире.
--
-- Запускать можно повторно.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_doubles_unique()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Напарник с карточкой клуба
  IF NEW.partner_id IS NOT NULL THEN
    -- Он не должен подавать свою заявку в этом же турнире
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND player_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('withdrawn', 'rejected')
    ) THEN
      RAISE EXCEPTION 'Partner already registered as captain in this tournament';
    END IF;

    -- И не стоять напарником в другой паре
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('withdrawn', 'rejected')
    ) THEN
      RAISE EXCEPTION 'Partner already in another team in this tournament';
    END IF;
  END IF;

  -- Подавший заявку не должен быть напарником в чужой паре
  IF NEW.player_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.player_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('withdrawn', 'rejected')
    ) THEN
      RAISE EXCEPTION 'Player already registered as partner in another team';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_doubles_unique() IS
    'Один игрок — одна пара в турнире. Снятые и отклонённые заявки не считаются: они след в истории, а не место в турнире.';

COMMIT;

-- ---- Проверка ----
--
-- Сколько людей числятся дважды среди ЖИВЫХ заявок каждого турнира.
-- Должно быть пусто: правило это и стережёт.

WITH стороны AS (
    SELECT tournament_id, player_id AS человек FROM tournament_registrations
     WHERE player_id IS NOT NULL AND status NOT IN ('withdrawn', 'rejected')
    UNION ALL
    SELECT tournament_id, partner_id FROM tournament_registrations
     WHERE partner_id IS NOT NULL AND status NOT IN ('withdrawn', 'rejected')
)
SELECT t.title AS турнир, p.name AS игрок, count(*) AS заявок
  FROM стороны с
  JOIN public.tournaments t ON t.id = с.tournament_id
  JOIN public.players p ON p.id = с.человек
 GROUP BY 1, 2
HAVING count(*) > 1
 ORDER BY 3 DESC;
