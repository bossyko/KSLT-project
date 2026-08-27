-- ============================================
-- Чистка тестовых тренеров
-- ============================================
--
-- Все шестеро заведены для отладки: Ким Анна, Орозов Тимур, Волков
-- Дмитрий, Петров Иван, Иванова Мария, Смирнов Алексей. Видно и по
-- кортам — у них проставлены «Тест», «Дордой Спорт», «Champion Arena»,
-- которых в базе давно нет.
--
-- Настоящих тренеров заведём отдельно, когда клуб пришлёт список.
--
-- Ссылки на тренеров ищем обходом внешних ключей: за сегодня уже дважды
-- всплывало поле не там, где ожидалось.

BEGIN;

-- 1. Что было
SELECT 'до' AS когда, COUNT(*) AS тренеров FROM coaches;

-- 2. Отвязываем всё, что на них ссылается
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
        WHERE c.contype = 'f' AND dst.relname = 'coaches'
    LOOP
        IF r.required THEN
            EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL', r.tbl, r.col);
        ELSE
            BEGIN
                EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL', r.tbl, r.col, r.col);
            EXCEPTION WHEN check_violation THEN
                -- Ссылку не обнулить из-за проверки — удаляем строку целиком
                EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL', r.tbl, r.col);
            END;
        END IF;
    END LOOP;
END $$;

-- 3. Сами тренеры
DELETE FROM coaches;

-- 4. Что стало
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM coaches) AS тренеров,
       (SELECT COUNT(*) FROM partner_services WHERE entity_type = 'coach') AS услуг_тренеров;

COMMIT;
