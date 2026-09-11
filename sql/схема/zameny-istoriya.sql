-- ============================================================
-- История замен в заявках
-- ============================================================
--
-- Менеджер меняет участника на его месте в сетке: кто-то не смог играть,
-- вместо него выходит другой. След от этого нужен — иначе через неделю никто
-- не вспомнит, почему в группе играл человек, которого не было в заявках.
--
-- Пишем только замены: кого на кого, в какой заявке, кто менял и когда.
-- Видно это в админке, игрокам не показываем.
--
-- Запускать можно повторно.

CREATE TABLE IF NOT EXISTS public.registration_changes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   text NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    registration_id uuid NOT NULL REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
    -- 'player' — первый номер, 'partner' — напарник, 'pair' — пара целиком
    side            text NOT NULL,
    old_player_id   text REFERENCES public.players(id) ON DELETE SET NULL,
    new_player_id   text REFERENCES public.players(id) ON DELETE SET NULL,
    -- Имена гостей: карточки у них нет, а в истории они должны остаться
    old_name        text,
    new_name        text,
    changed_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.registration_changes IS 'Кого на кого меняли в заявках турнира. Только для админки';

CREATE INDEX IF NOT EXISTS registration_changes_turnir
    ON public.registration_changes (tournament_id, created_at DESC);

ALTER TABLE public.registration_changes ENABLE ROW LEVEL SECURITY;

-- Читают и пишут только сотрудники клуба
DROP POLICY IF EXISTS registration_changes_staff ON public.registration_changes;
CREATE POLICY registration_changes_staff ON public.registration_changes
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                         WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')));

NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT column_name AS поле, data_type AS тип
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'registration_changes'
 ORDER BY ordinal_position;
-- Ожидаем десять строк.
