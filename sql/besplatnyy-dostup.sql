-- ============================================================
-- Бесплатный доступ до даты
-- ============================================================
--
-- До нового года платформа открыта всем, кто зарегистрировался: членство
-- КСЛТ не спрашиваем. Потом дату убираем, и всё возвращается как было.
--
-- Настройка лежит в базе, а не в коде, по одной причине: приложение у людей
-- установлено, и правка в коде дойдёт до них только с новой сборкой. Дата в
-- базе действует сразу и на сайте, и в приложении.
--
-- Ставит и меняет её администратор в админке: Настройки → Доступ. Здесь
-- только таблица и права.
--
-- Запускать можно повторно.

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_settings (
    key        text PRIMARY KEY,
    value      jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.app_settings IS
    'Настройки, которые меняются без выкладки: их читают и сайт, и приложение.';

-- Дата, до которой доступ открыт всем зарегистрированным. Пустое значение —
-- обычный порядок, доступ по членству.
INSERT INTO public.app_settings (key, value)
VALUES ('free_access_until', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---- Права ----
--
-- Читать нужно всем: настройка решает, что показывать человеку ещё до входа.
-- Менять — только администратору.

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_read ON public.app_settings;
CREATE POLICY app_settings_read ON public.app_settings
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS app_settings_write ON public.app_settings;
CREATE POLICY app_settings_write ON public.app_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                         WHERE p.id = auth.uid() AND p.role = 'admin'));

COMMIT;

-- Что лежит сейчас
SELECT key, value, updated_at FROM public.app_settings ORDER BY key;
