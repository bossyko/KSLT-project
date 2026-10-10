-- ============================================================
-- ЧТО СТОЯЛО В РАСПИСАНИИ ДО НЫНЕШНЕЙ ЖЕРЕБЬЁВКИ — ТОЛЬКО ЧТЕНИЕ
-- ============================================================
--
-- Вопрос Кости 10.10: какое время матча применялось на прежних прогонах.
--
-- Поле `match_duration` истории не хранит, но слепки матчей, снятые перед
-- двумя сбросами, хранят ПРОСТАВЛЕННОЕ ВРЕМЯ. Шаг между соседними
-- запусками на одном корте и есть та длительность, по которой считалось
-- расписание. 90 там или 35 — видно числом, а не на слово.
--
-- НИЧЕГО НЕ МЕНЯЕТ. Только SELECT.
--
-- ТИП КОЛОНКИ НАЗЫВАЕТСЯ ЯВНО. `scheduled_time` в базе — text, а не time:
-- первая редакция этого запроса вычитала текст из текста и упала на 42883.
-- Приведение стоит в каждом месте, где время сравнивается или вычитается.

-- 1. Какие слепки вообще есть.
SELECT c.relname AS slepok, c.reltuples::bigint AS primerno_strok
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'slepok%'
 ORDER BY c.relname;

-- 2. ПЕРВЫЙ СЛЕПОК (снят перед сбросом жеребьёвки).
--    Шаг в минутах между соседними запусками — это и есть длительность.
SELECT scheduled_day,
       scheduled_time,
       count(*) AS matchey,
       EXTRACT(EPOCH FROM (scheduled_time::time
            - lag(scheduled_time::time) OVER (PARTITION BY scheduled_day
                                              ORDER BY scheduled_time::time))) / 60 AS shag_minut
  FROM public.slepok_matches_masters_1010
 WHERE scheduled_time IS NOT NULL
 GROUP BY scheduled_day, scheduled_time
 ORDER BY scheduled_day, scheduled_time::time;

-- 3. ВТОРОЙ СЛЕПОК (снят перед сбросом сетки с посевом).
SELECT scheduled_day,
       scheduled_time,
       count(*) AS matchey,
       EXTRACT(EPOCH FROM (scheduled_time::time
            - lag(scheduled_time::time) OVER (PARTITION BY scheduled_day
                                              ORDER BY scheduled_time::time))) / 60 AS shag_minut
  FROM public.slepok_m2_matches_1010
 WHERE scheduled_time IS NOT NULL
 GROUP BY scheduled_day, scheduled_time
 ORDER BY scheduled_day, scheduled_time::time;

-- 4. ЧТО СТОИТ СЕЙЧАС — для сравнения.
SELECT scheduled_day,
       scheduled_time,
       count(*) AS matchey,
       EXTRACT(EPOCH FROM (scheduled_time::time
            - lag(scheduled_time::time) OVER (PARTITION BY scheduled_day
                                              ORDER BY scheduled_time::time))) / 60 AS shag_minut
  FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
   AND scheduled_time IS NOT NULL
 GROUP BY scheduled_day, scheduled_time
 ORDER BY scheduled_day, scheduled_time::time;
