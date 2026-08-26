-- ============================================
-- Матчи, оставшиеся после чистки турниров
-- ============================================
--
-- После удаления турниров осталось 23 матча. Часть из них держат баттлы:
-- у challenges есть обратная ссылка match_id, из-за неё удаление и упало.
--
-- Всё в базе, кроме новостей и кортов, тестовое, поэтому сначала
-- отвязываем, потом удаляем. Ссылки ищем обходом внешних ключей, а не
-- списком из головы: match_id нашёлся не там, где ожидалось.

BEGIN;

-- 1. Что есть сейчас
SELECT 'до' AS когда,
       (SELECT COUNT(*) FROM matches) AS матчей,
       (SELECT COUNT(*) FROM challenges) AS баттлов,
       (SELECT COUNT(*) FROM challenges WHERE match_id IS NOT NULL) AS баттлов_со_счётом;

-- 2. Отвязываем всё, что ссылается на матчи
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT src.relname AS tbl, att.attname AS col, att.attnotnull AS required
        FROM pg_constraint c
        JOIN pg_class src ON src.oid = c.conrelid
        JOIN pg_class dst ON dst.oid = c.confrelid
        JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND dst.relname = 'matches'
    LOOP
        IF r.required THEN
            -- Обязательную ссылку в NULL не поставить: удаляем строку целиком
            EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL', r.tbl, r.col);
        ELSE
            EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL', r.tbl, r.col, r.col);
        END IF;
    END LOOP;
END $$;

-- 3. Сами матчи
DELETE FROM matches;

-- 4. Счёт игроков: побед и поражений без матчей быть не должно
UPDATE players
   SET wins = 0, losses = 0, form = '{}'::text[], rank_change = 0, points = 0
 WHERE wins <> 0 OR losses <> 0 OR points <> 0;

-- 5. Что стало
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM matches) AS матчей,
       (SELECT COUNT(*) FROM challenges) AS баттлов,
       (SELECT COUNT(*) FROM challenges WHERE match_id IS NOT NULL) AS баттлов_со_счётом,
       (SELECT COUNT(*) FROM players WHERE wins <> 0 OR losses <> 0) AS игроков_со_счётом;

COMMIT;
