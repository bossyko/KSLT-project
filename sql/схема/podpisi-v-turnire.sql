-- ============================================================
-- Директор турнира и главный судья
-- ============================================================
--
-- Протокол турнира подписывают двое: директор и главный судья. На бумаге
-- под подписью пишут фамилию от руки, но клуб чаще проводит турниры одним
-- и тем же составом — тогда имена проще ввести один раз и печатать вместе
-- с таблицей.
--
-- Поля необязательные: пусто — в файле останется линия для ручки.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS director_name text,
    ADD COLUMN IF NOT EXISTS referee_name  text;

COMMENT ON COLUMN public.tournaments.director_name IS
    'Директор турнира: печатается под подписью в выгрузке и на печати. Пусто — остаётся линия для руки.';
COMMENT ON COLUMN public.tournaments.referee_name IS
    'Главный судья: печатается под подписью в выгрузке и на печати.';

COMMIT;

-- ---- Проверка ----

SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'tournaments'
   AND column_name IN ('director_name', 'referee_name');
