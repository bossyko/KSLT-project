-- ============================================================
-- ШАГ РАСПИСАНИЯ В ТРЁХ СНИМКАХ СРАЗУ — ОДНОЙ ТАБЛИЦЕЙ
-- ============================================================
--
-- Прежний запрос отдавал четыре таблицы подряд, и какая из них какая —
-- по виду не отличить. Здесь источник подписан в первой колонке.
--
-- Шаг — разница между соседними запусками внутри одного снимка. Он и есть
-- длительность, по которой считалось расписание.
--
-- ТИП НАЗЫВАЕТСЯ ЯВНО: scheduled_time в базе text, а не time.
--
-- Только чтение.

WITH всё AS (
    SELECT '1 · слепок перед сбросом жеребьёвки' AS snimok,
           scheduled_day, scheduled_time
      FROM public.slepok_matches_masters_1010
     WHERE scheduled_time IS NOT NULL
    UNION ALL
    SELECT '2 · слепок перед сбросом сетки',
           scheduled_day, scheduled_time
      FROM public.slepok_m2_matches_1010
     WHERE scheduled_time IS NOT NULL
    UNION ALL
    SELECT '3 · сейчас в базе',
           scheduled_day, scheduled_time
      FROM public.matches
     WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
       AND scheduled_time IS NOT NULL
),
времена AS (
    SELECT snimok, scheduled_day, scheduled_time, count(*) AS matchey
      FROM всё
     GROUP BY snimok, scheduled_day, scheduled_time
)
SELECT snimok, scheduled_day, scheduled_time, matchey,
       EXTRACT(EPOCH FROM (scheduled_time::time
            - lag(scheduled_time::time) OVER (PARTITION BY snimok, scheduled_day
                                              ORDER BY scheduled_time::time))) / 60 AS shag_minut
  FROM времена
 ORDER BY snimok, scheduled_day, scheduled_time::time;
