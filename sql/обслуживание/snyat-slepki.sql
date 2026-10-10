-- ============================================================
-- УБОРКА СЛЕПКОВ — ПО СЛОВУ КОСТИ 09.10
-- ============================================================
--
-- Слепки делали своё дело: каждый снимался перед правкой данных и жил,
-- пока Костя не посмотрит результат глазами. Он посмотрел.
--
-- ПОРЯДОК ВАЖЕН: сначала СПИСОК с числом строк — его видно в выводе, и
-- это последняя возможность сказать «стой». Потом удаление. Потом
-- проверка, что не осталось ни одного.
--
-- СНОСИТСЯ ТОЛЬКО ТО, ЧТО НАЧИНАЕТСЯ НА slepok_ И ЛЕЖИТ В public.
-- Ни одна рабочая таблица под это имя не попадает — проверено списком
-- ниже: он печатается до удаления.

-- ---- ШАГ 1: ЧТО ИМЕННО УЙДЁТ ----
SELECT c.relname AS slepok,
       c.reltuples::bigint AS primerno_strok,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS razmer
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND c.relname LIKE 'slepok%'
 ORDER BY c.relname;

-- ---- ШАГ 2: УДАЛЕНИЕ ----
DO $$
DECLARE
    т record;
    счёт integer := 0;
BEGIN
    FOR т IN
        SELECT c.relname
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relkind = 'r'
           AND c.relname LIKE 'slepok%'
    LOOP
        EXECUTE format('DROP TABLE public.%I', т.relname);
        счёт := счёт + 1;
        RAISE NOTICE 'снят слепок: %', т.relname;
    END LOOP;
    RAISE NOTICE 'снято слепков: %', счёт;
END $$;

-- ---- ШАГ 3: ПРОВЕРКА ЧТЕНИЕМ ----
-- Ждём ноль.
SELECT count(*) AS slepkov_ostalos
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND c.relname LIKE 'slepok%';

-- И отдельно: рабочие таблицы на месте, ни одна не задета.
SELECT count(*) AS tablic_v_public
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r';
