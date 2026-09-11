-- ============================================================
-- Формат плей-офф выбирается при создании турнира
-- ============================================================
--
-- Раньше менеджер решал, что делать после групп, кнопкой в самом конце —
-- когда доиграна последняя группа. Из-за этого до последнего дня никто не
-- знал, кто с кем встретится в плей-офф и кому достанется проход без игры,
-- хотя расклад известен сразу после жеребьёвки: сколько групп и сколько из
-- них выходит.
--
-- Теперь выбор переезжает в настройки турнира, и сетка плей-офф рисуется
-- сразу, а по мере того как группы доигрывают, в неё встают имена.
--
--   ig     — с дополнительными матчами: свободные места разыгрывают те, кто
--            не прошёл напрямую
--   direct — прямой: свободные места закрываются проходом без игры
--
-- Пусто — турнир заведён до этой правки: формат спросят по-старому, кнопкой.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS playoff_format text;

COMMENT ON COLUMN public.tournaments.playoff_format IS
    'Что после групп: ig — с доп. матчами, direct — прямой. Только для групповых турниров';

-- Ограничение заводим отдельно: ADD CONSTRAINT не понимает IF NOT EXISTS,
-- а файл должен запускаться повторно
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_playoff_format_chk') THEN
        ALTER TABLE public.tournaments
            ADD CONSTRAINT tournaments_playoff_format_chk
            CHECK (playoff_format IS NULL OR playoff_format IN ('ig', 'direct'));
    END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT count(*) AS всего_турниров,
       count(*) FILTER (WHERE playoff_format = 'ig')     AS с_доп_матчами,
       count(*) FILTER (WHERE playoff_format = 'direct') AS прямой,
       count(*) FILTER (WHERE playoff_format IS NULL)    AS не_задан
  FROM public.tournaments;
-- Ожидаем: колонка появилась, у всех прежних турниров формат не задан.
