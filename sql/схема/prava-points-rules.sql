-- ============================================================
-- ПРАВА НА `points_rules`: имя политики перестаёт врать
-- ============================================================
--
-- НЕ ПРОГОНЯТЬ БЕЗ СЛОВА КОСТИ. Сначала тестовая (itlanqwcwygxchitaatt),
-- потом боевая (qqkzszesviukopgjbead). Транзакция.
--
-- ЗАЧЕМ. Слово Кости 02.10: «изменить очки может только администратор, не
-- менеджер». У `points_by_place` и `points_versions` это уже так — замер
-- прав 03.10 показал `is_admin()` в обеих половинах. А у `points_rules`
-- три пишущие политики НАЗВАНЫ `points_rules_admin_insert`,
-- `..._admin_update`, `..._admin_delete`, но внутри у них стоит
--     role = ANY (ARRAY['admin'::text, 'manager'::text])
-- — прочитано из `pg_policies` 03.10, не по памяти.
--
-- ИМЯ ПОЛИТИКИ ВРЁТ, И ЭТО ХУЖЕ ОТКРЫТОГО ДОСТУПА: человек правит права по
-- названию и уверен, что закрыл. Беда родится ровно на этом шве.
--
-- ЧТО ДЕЛАЕМ. Одна политика записи вместо трёх, с `is_admin()` в обеих
-- половинах — ровно как у `points_by_place`. ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО
-- ПОНЯТИЕ: «кто правит очки» названо одной функцией
-- (`sql/схема/schema-snapshot.sql:1430`), а не повторено телом политики
-- трижды.
--
-- ЧЕГО НЕ ДЕЛАЕМ. Таблицу НЕ удаляем и строки НЕ трогаем. Её читает ручной
-- ввод прошлых результатов (`js/admin/sections/players.js:2795`), и свести
-- тот ввод на места — отдельный кусок: шаг 5 замера нашёл 174 живые строки
-- R16/R32 с вилкой в 8 и 16 мест и 28 строк G3/G4 с числами, которых в
-- `points_rules` нет вовсе.
--
-- ЦЕНА, НАЗВАННАЯ ВСЛУХ: после этого менеджер не сможет править очки по
-- раундам НИГДЕ. Экран, который их правил, 03.10 переехал на места и стал
-- для менеджера только читаемым, так что терять ему нечего — но если у
-- него был свой путь правки, он закроется.

BEGIN;

-- ---- Шаг 1. Порог: убеждаемся, что чиним то, что нашли ----
--
-- Если политики уже исправлены кем-то другим, правка должна ОТКАЗАТЬСЯ, а
-- не делать вид, что починила.

DO $$
DECLARE
    врущих integer;
BEGIN
    SELECT count(*) INTO врущих
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'points_rules'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
       AND coalesce(qual, '') || coalesce(with_check, '') LIKE '%manager%';

    IF врущих = 0 THEN
        RAISE EXCEPTION
            'Пишущих политик points_rules с менеджером не найдено — чинить нечего, правка отказывается';
    END IF;

    RAISE NOTICE 'Политик с менеджером найдено: %', врущих;
END $$;

-- ---- Шаг 2. Одна политика записи вместо трёх ----

DROP POLICY IF EXISTS points_rules_admin_insert ON public.points_rules;
DROP POLICY IF EXISTS points_rules_admin_update ON public.points_rules;
DROP POLICY IF EXISTS points_rules_admin_delete ON public.points_rules;
DROP POLICY IF EXISTS points_rules_admin        ON public.points_rules;

CREATE POLICY points_rules_admin ON public.points_rules
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Чтение остаётся открытым: очки — открытая часть правил
DROP POLICY IF EXISTS points_rules_read ON public.points_rules;
CREATE POLICY points_rules_read ON public.points_rules
    FOR SELECT USING (true);

-- ---- Шаг 3. Перечитка ВНУТРИ транзакции ----
--
-- «CREATE POLICY» говорит, что политика заведена, а не что она запрещает.

DO $$
DECLARE
    сменеджером integer;
    пишущих     integer;
BEGIN
    SELECT count(*) INTO сменеджером
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'points_rules'
       AND coalesce(qual, '') || coalesce(with_check, '') LIKE '%manager%';

    SELECT count(*) INTO пишущих
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'points_rules'
       AND cmd = 'ALL' AND qual = 'is_admin()' AND with_check = 'is_admin()';

    IF сменеджером <> 0 THEN
        RAISE EXCEPTION 'После правки политик с менеджером осталось %', сменеджером;
    END IF;
    IF пишущих <> 1 THEN
        RAISE EXCEPTION 'Пишущих политик is_admin() стало %, а не одна', пишущих;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- ЧТО ПРОВЕРИТЬ ЧТЕНИЕМ ПОСЛЕ ПРОГОНА
-- ============================================================
-- Тем же файлом, что и до правки — ОДИН запрос:
--   sql/обслуживание/prava-ochkov-perechitka.sql
--
-- ЖДЁМ: у всех трёх таблиц запись только `is_admin()`, чтение `true`,
-- и слова `manager` в выдаче нет НИ РАЗУ.
