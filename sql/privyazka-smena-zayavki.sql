-- ============================================================
-- Смена карточки в заявке: старая закрывается, новая заводится
-- ============================================================
--
-- Игрок может передумать и выбрать другую карточку, пока заявку не рассмотрели.
-- Раньше это переписывало ту же строку — и получалась ловушка: менеджер видит
-- на экране «Роман Долгушин», жмёт «Привязать», а внутри заявки уже другой
-- игрок. Подтверждалось бы не то, что человек видел.
--
-- Теперь смена — это новая заявка: прежняя помечается «отозвана». Решение
-- менеджера всегда относится к тому, что было у него на экране; если заявка
-- успела устареть, привязка не сработает и скажет об этом.
--
-- Запускать можно повторно.

BEGIN;

-- Отозванная заявка — не отклонённая: её закрыл сам игрок
ALTER TABLE public.player_link_requests
    DROP CONSTRAINT IF EXISTS player_link_requests_status_check;

ALTER TABLE public.player_link_requests
    ADD CONSTRAINT player_link_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));

COMMIT;

CREATE OR REPLACE FUNCTION public.запросить_привязку(p_player_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    я        profiles%ROWTYPE;
    карточка players%ROWTYPE;
    новая    uuid;
    была     uuid;
BEGIN
    SELECT * INTO я FROM profiles WHERE id = auth.uid();
    IF я.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;
    IF я.player_id IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'already_linked');
    END IF;

    SELECT * INTO карточка FROM players WHERE id = p_player_id;
    IF карточка.id IS NULL THEN
        RETURN jsonb_build_object('error', 'player_not_found');
    END IF;
    IF карточка.is_guest THEN
        RETURN jsonb_build_object('error', 'player_is_guest');
    END IF;

    IF EXISTS (SELECT 1 FROM profiles WHERE player_id = p_player_id AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('error', 'player_taken');
    END IF;

    -- Уже просил эту же карточку — второй раз заводить нечего
    SELECT id INTO была FROM player_link_requests
     WHERE profile_id = я.id AND status = 'pending' AND player_id = p_player_id;
    IF была IS NOT NULL THEN
        RETURN jsonb_build_object('ok', true, 'request_id', была, 'same', true);
    END IF;

    -- Передумал: прежнюю закрываем как отозванную и заводим новую
    UPDATE player_link_requests
       SET status = 'withdrawn', decided_at = now(), note = 'игрок выбрал другую карточку'
     WHERE profile_id = я.id AND status = 'pending';

    INSERT INTO player_link_requests (profile_id, player_id)
    VALUES (я.id, p_player_id)
    RETURNING id INTO новая;

    RETURN jsonb_build_object('ok', true, 'request_id', новая);
END $$;

GRANT EXECUTE ON FUNCTION public.запросить_привязку(text) TO authenticated;

-- ---- Проверка ----

SELECT status AS состояние, count(*) AS заявок
  FROM public.player_link_requests
 GROUP BY status
 ORDER BY 1;
