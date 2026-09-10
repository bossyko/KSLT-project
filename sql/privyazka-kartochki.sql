-- ============================================================
-- Игрок находит свою карточку — админ подтверждает
-- ============================================================
--
-- Карточки игроков клуб завёл заранее, при регистрации человек должен не
-- создавать новую, а забрать свою. Само по себе «это я» ничего не доказывает:
-- имя, разряд и матчи видны всем, и чужую карточку так же легко назвать своей.
--
-- Поэтому привязка идёт заявкой: игрок выбирает карточку, менеджер или админ
-- в админке подтверждает или отклоняет. До подтверждения аккаунт обычный —
-- вход есть, рейтинга и истории нет.
--
-- Здесь: таблица заявок, права и две функции — подать заявку и решить её.
--
-- Запускать можно повторно.

BEGIN;

CREATE TABLE IF NOT EXISTS public.player_link_requests (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id   text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
    note        text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    decided_at  timestamptz,
    decided_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.player_link_requests IS
    'Заявки игроков на привязку своей карточки к учётной записи. Решает менеджер или админ';

-- Одна открытая заявка на человека: вторая — это та же просьба, поданная
-- дважды, и в списке у менеджера она только мешает
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_requests_one_open
    ON public.player_link_requests (profile_id)
 WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_link_requests_pending
    ON public.player_link_requests (created_at DESC)
 WHERE status = 'pending';

-- ---- Права ----
--
-- Свою заявку человек видит, чужие — нет. Персонал видит все.

ALTER TABLE public.player_link_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS link_requests_read ON public.player_link_requests;
CREATE POLICY link_requests_read ON public.player_link_requests
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.profiles p
                       WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')));

DROP POLICY IF EXISTS link_requests_staff ON public.player_link_requests;
CREATE POLICY link_requests_staff ON public.player_link_requests
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                         WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')));

COMMIT;

-- ---- Подать заявку ----
--
-- Проверяем то, что игрок сам проверить не может: свободна ли карточка и не
-- привязан ли он уже к другой.

CREATE OR REPLACE FUNCTION public.запросить_привязку(p_player_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    я         profiles%ROWTYPE;
    карточка  players%ROWTYPE;
    новая     uuid;
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

    -- Повторная заявка на ту же карточку — это та же заявка
    SELECT id INTO новая FROM player_link_requests
     WHERE profile_id = я.id AND status = 'pending';
    IF новая IS NOT NULL THEN
        UPDATE player_link_requests SET player_id = p_player_id, created_at = now()
         WHERE id = новая;
        RETURN jsonb_build_object('ok', true, 'request_id', новая, 'updated', true);
    END IF;

    INSERT INTO player_link_requests (profile_id, player_id)
    VALUES (я.id, p_player_id)
    RETURNING id INTO новая;

    RETURN jsonb_build_object('ok', true, 'request_id', новая);
END $$;

GRANT EXECUTE ON FUNCTION public.запросить_привязку(text) TO authenticated;

-- ---- Решить заявку ----
--
-- Подтверждение и есть привязка: одной операцией, чтобы не осталось
-- подтверждённой заявки без привязанной карточки.

CREATE OR REPLACE FUNCTION public.решить_привязку(p_request_id uuid, p_approve boolean, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    заявка player_link_requests%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) THEN
        RETURN jsonb_build_object('error', 'not_staff');
    END IF;

    SELECT * INTO заявка FROM player_link_requests WHERE id = p_request_id;
    IF заявка.id IS NULL THEN
        RETURN jsonb_build_object('error', 'request_not_found');
    END IF;
    IF заявка.status <> 'pending' THEN
        RETURN jsonb_build_object('error', 'already_decided', 'status', заявка.status);
    END IF;

    IF p_approve THEN
        IF EXISTS (SELECT 1 FROM profiles
                    WHERE player_id = заявка.player_id AND deleted_at IS NULL) THEN
            RETURN jsonb_build_object('error', 'player_taken');
        END IF;

        UPDATE profiles SET player_id = заявка.player_id WHERE id = заявка.profile_id;

        -- Остальные заявки на эту же карточку теряют смысл
        UPDATE player_link_requests
           SET status = 'rejected', decided_at = now(), decided_by = auth.uid(),
               note = coalesce(note, 'карточку забрал другой')
         WHERE player_id = заявка.player_id AND status = 'pending' AND id <> заявка.id;
    END IF;

    UPDATE player_link_requests
       SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
           decided_at = now(), decided_by = auth.uid(),
           note = coalesce(p_note, note)
     WHERE id = p_request_id;

    RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.решить_привязку(uuid, boolean, text) TO authenticated;

-- ---- Проверка ----

SELECT count(*) AS заявок FROM public.player_link_requests;
