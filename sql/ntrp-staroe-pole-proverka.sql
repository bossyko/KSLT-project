-- ============================================================
-- Старое поле ntrp_rating: кто в базе его читает
-- ============================================================
--
-- Убираем поле из карточки игрока. В коде сайта и приложения его уже нет —
-- везде стоит ntrp_singles. Осталось проверить саму базу: функции и
-- представления пишутся текстом, и если внутри осталось ntrp_rating, после
-- удаления столбца они молча сломаются на первом же вызове.
--
-- Файл только смотрит, ничего не меняет.

-- ---- 1. Функции ----

SELECT n.nspname || '.' || p.proname AS функция
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND p.prokind IN ('f', 'p')
   AND p.prosrc ILIKE '%ntrp_rating%'
 ORDER BY 1;
-- Тело читаем через prosrc, а не pg_get_functiondef: тот спотыкается об
-- агрегатные функции и обрывает запрос.

-- ---- 2. Представления ----

SELECT schemaname || '.' || viewname AS представление
  FROM pg_views
 WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   AND definition ILIKE '%ntrp_rating%'
 ORDER BY 1;

-- ---- 3. Ограничения и значения по умолчанию ----

SELECT conname AS ограничение, conrelid::regclass AS таблица
  FROM pg_constraint
 WHERE pg_get_constraintdef(oid) ILIKE '%ntrp_rating%';

-- ---- 4. Разошлись ли числа перед удалением ----
-- Если где-то старое поле отличается от одиночного — значит его меняли мимо
-- админки, и удалять рано.

SELECT count(*) AS расхождений
  FROM public.players
 WHERE ntrp_rating IS DISTINCT FROM ntrp_singles;
