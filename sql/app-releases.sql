-- ============================================================
-- Приложение говорит, что вышла новая сборка
-- ============================================================
--
-- Приложение ставится файлом и обновляется вручную. Узнать, что вышла новая
-- сборка, человеку неоткуда: тестировщица месяц работала на августовской и
-- жаловалась на давно исправленное, а мы гадали, наша это ошибка или её
-- сборки. На выяснение ушёл вечер.
--
-- Теперь так: последняя сборка записана здесь, приложение сверяет со своей
-- и, если своя старее, показывает полоску со ссылкой.
--
-- Номер сборки — целое число (versionCode из Android), по нему и сравниваем.
-- Название вида «1.2» — только для показа человеку: сравнивать строки с
-- точками неудобно и легко ошибиться.
--
-- Файл меняет базу. Читающие запросы — в app-releases-check.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_releases (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform     text NOT NULL DEFAULT 'android',
    version_code integer NOT NULL,
    version_name text NOT NULL,
    url          text,
    notes        text,
    published_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT app_releases_platform_check CHECK (platform IN ('android', 'ios'))
);

COMMENT ON TABLE public.app_releases IS
    'Выпущенные сборки приложения. Приложение сверяет свой номер с последним и предлагает обновиться.';

COMMENT ON COLUMN public.app_releases.url IS
    'Куда идти за новой сборкой: ссылка на файл или на страницу магазина.';

CREATE INDEX IF NOT EXISTS idx_app_releases_platform
    ON public.app_releases (platform, version_code DESC);

-- ---- Права ----
-- Читают все, включая гостей: полоску надо показать и тому, кто не вошёл.
-- Пишет только персонал.

ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_releases_read ON public.app_releases;
CREATE POLICY app_releases_read ON public.app_releases
    FOR SELECT USING (true);

DROP POLICY IF EXISTS app_releases_staff ON public.app_releases;
CREATE POLICY app_releases_staff ON public.app_releases
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---- Нынешняя сборка ----
-- Та, что сейчас у людей на руках: 1.1, номер 2.

INSERT INTO public.app_releases (platform, version_code, version_name, notes)
SELECT 'android', 2, '1.1', 'Сборка, с которой начали считать'
 WHERE NOT EXISTS (SELECT 1 FROM public.app_releases WHERE platform = 'android');

COMMIT;
