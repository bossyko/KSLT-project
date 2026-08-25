-- ============================================
-- Чистка тестовых турниров
-- ============================================
--
-- В таблице лежали 127 турниров, и настоящих среди них нет: 18 названы
-- «тест» или «проверка», 92 стоят пустыми — ровные серии по пять разрядов
-- для отладки фильтров, а у остальных матчи от проверок функционала.
-- Настоящие турниры клуба живут пока только в новостях.
--
-- Вместе с турнирами уходят матчи, регистрации и таблица результатов.
-- Матчей, не привязанных к турниру, в базе нет — баттлы не пострадают.
--
-- Победы, поражения и очки, набежавшие за отладочные матчи, тоже
-- обнуляем: иначе у 122 игроков останется счёт матчей, которых больше
-- нет, а у 15 — очки, взявшиеся ниоткуда.

BEGIN;

-- 1. Что было
SELECT 'до' AS когда,
       (SELECT COUNT(*) FROM tournaments) AS турниров,
       (SELECT COUNT(*) FROM matches) AS матчей,
       (SELECT COUNT(*) FROM tournament_registrations) AS регистраций,
       (SELECT COUNT(*) FROM tournament_results) AS результатов;

-- 2. Всё, что ссылается на турниры. Перечислять руками ненадёжно —
--    обходим внешние ключи, как делали при чистке кортов
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Сначала обязательные ссылки: такие строки удаляем целиком
    FOR r IN
        SELECT src.relname AS tbl, att.attname AS col
        FROM pg_constraint c
        JOIN pg_class src ON src.oid = c.conrelid
        JOIN pg_class dst ON dst.oid = c.confrelid
        JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND dst.relname = 'tournaments'
    LOOP
        EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL', r.tbl, r.col);
    END LOOP;
END $$;

-- 3. Сами турниры
DELETE FROM tournaments;

-- 4. Счёт матчей и очки, набежавшие за отладку
UPDATE players
   SET points = 0,
       wins = 0,
       losses = 0,
       form = '{}'::text[],
       rank_change = 0
 WHERE points <> 0 OR wins <> 0 OR losses <> 0;

-- Раскладка очков по категориям: сейчас пустая, но на случай, если
-- что-то осталось с прошлых прогонов
UPDATE player_categories SET points = 0 WHERE points <> 0;

-- 5. Что стало
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM tournaments) AS турниров,
       (SELECT COUNT(*) FROM matches) AS матчей,
       (SELECT COUNT(*) FROM tournament_registrations) AS регистраций,
       (SELECT COUNT(*) FROM tournament_results) AS результатов,
       (SELECT COUNT(*) FROM players WHERE points <> 0) AS игроков_с_очками;

COMMIT;
