-- ============================================================
-- Убрать старое поле ntrp_rating из карточки игрока
-- ============================================================
--
-- В карточке остаются два числа: ntrp_singles (одиночный разряд) и
-- ntrp_doubles (парные турниры). Третье поле, ntrp_rating, было до нового
-- списка; весь код сайта, админки и приложения с него уже снят.
--
-- ВАЖНО: перед запуском выложить функцию tournament-register — она читает
-- поле при записи на турнир. Пока не выложена, удалять нельзя.
--
-- Порядок в файле:
--   1. Переносим оценку тем, у кого она была только в старом поле.
--   2. Переводим функции и представления самой базы на новое поле.
--   3. Проверяем, что старое поле больше нигде не поминается. Если что-то
--      осталось — файл останавливается и называет это поимённо, ничего не
--      удалив.
--   4. Удаляем столбец.
--
-- Запускать можно повторно.

BEGIN;

-- ---- 1. Не потерять оценку ----
--
-- Трое есть в базе со старой оценкой, но их нет в новом списке NTRP.
-- Переносим им старое число в одиночный разряд, чтобы оно не пропало
-- вместе со столбцом.

UPDATE public.players
   SET ntrp_singles = ntrp_rating
 WHERE ntrp_singles IS NULL
   AND ntrp_rating IS NOT NULL;

-- ---- 2. Перевести функции и представления базы на новое поле ----
--
-- Внутри базы поле поминается текстом. Берём живое определение, меняем в нём
-- имя поля и создаём заново — руками переписывать нечего, и ошибиться негде.
-- Что переписали, будет видно в сообщениях.

DO $$
DECLARE
    зап record;
BEGIN
    FOR зап IN
        SELECT n.nspname || '.' || p.proname AS имя,
               regexp_replace(pg_get_functiondef(p.oid), 'ntrp_rating', 'ntrp_singles', 'g') AS код
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
           AND p.prokind IN ('f', 'p')
           AND p.prosrc ILIKE '%ntrp_rating%'
    LOOP
        EXECUTE зап.код;
        RAISE NOTICE 'Функция переписана: %', зап.имя;
    END LOOP;

    FOR зап IN
        SELECT schemaname || '.' || viewname AS имя,
               'CREATE OR REPLACE VIEW ' || quote_ident(schemaname) || '.' || quote_ident(viewname)
                 || ' AS ' || regexp_replace(definition, 'ntrp_rating', 'ntrp_singles', 'g') AS код
          FROM pg_views
         WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
           AND definition ILIKE '%ntrp_rating%'
    LOOP
        EXECUTE зап.код;
        RAISE NOTICE 'Представление переписано: %', зап.имя;
    END LOOP;
END $$;

-- ---- 3. Проверить, что никто больше не читает старое поле ----

DO $$
DECLARE
    список text;
BEGIN
    SELECT string_agg(имя, ', ') INTO список FROM (
        SELECT n.nspname || '.' || p.proname AS имя
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
           AND p.prokind IN ('f', 'p')
           AND p.prosrc ILIKE '%ntrp_rating%'
        UNION ALL
        SELECT schemaname || '.' || viewname
          FROM pg_views
         WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
           AND definition ILIKE '%ntrp_rating%'
    ) x;

    IF список IS NOT NULL THEN
        RAISE EXCEPTION
            'Старое поле ещё читают: %. Сначала переписать их на ntrp_singles.', список;
    END IF;
END $$;

-- ---- 4. Удалить столбец ----

ALTER TABLE public.players DROP COLUMN IF EXISTS ntrp_rating;

COMMIT;

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE ntrp_singles IS NOT NULL) AS с_одиночным,
       count(*) FILTER (WHERE ntrp_doubles IS NOT NULL) AS с_парным,
       count(*)                                         AS всего
  FROM public.players
 WHERE NOT is_guest;
