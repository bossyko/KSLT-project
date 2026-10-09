-- СНЯТЬ СХЕМУ ЧТЕНИЕМ КАТАЛОГА
--
-- ЗАЧЕМ. `schema-snapshot.sql` отстал от базы и один раз уже соврал: в нём
-- у `get_battle_votes` форма `(player_id, votes)`, а в живой базе
-- `(side, player_id, votes)`. Снимок нужен для ЧТЕНИЯ — посмотреть таблицы,
-- столбцы, типы и подписи функций прежде чем писать запрос, — и врущий
-- снимок хуже отсутствующего.
--
-- ЭТО НЕ pg_dump, И Я НЕ БУДУ ДЕЛАТЬ ВИД, ЧТО ЭТО ОН. Здесь чтение
-- системного каталога: таблицы со столбцами, типами, пустотой и
-- умолчаниями; ограничения; указатели; ПОЛНЫЕ тела функций
-- (`pg_get_functiondef` — ровно то, что лежит в базе); правила-сторожа;
-- правила доступа; перечисления; представления. Чего здесь НЕТ: порядка
-- создания, прав, расширений, данных, схем кроме public. Для «что есть и
-- какой формы» этого довольно, для восстановления базы — нет.
--
-- КАК ОТДАТЬ МНЕ РЕЗУЛЬТАТ. Прогнать, нажать «Download CSV» и положить
-- файл в папку KSLT под именем `shema-vygruzka.csv`. Я соберу из него
-- `sql/схема/schema-snapshot.sql` заново и скажу, что разошлось.
--
-- Запрос ТОЛЬКО ЧИТАЕТ. Ничего не создаёт и не меняет.

WITH tablicy AS (
    SELECT 1 AS razdel,
           c.relname || '.' || lpad(a.attnum::text, 4, '0') AS poryadok,
           '  ' || c.relname || '.' || a.attname
                || ' : ' || format_type(a.atttypid, a.atttypmod)
                || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
                || coalesce(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), '') AS stroka
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
     WHERE n.nspname = 'public' AND c.relkind = 'r'
       AND a.attnum > 0 AND NOT a.attisdropped
),
ogranicheniya AS (
    SELECT 2 AS razdel,
           c.relname || '.' || con.conname AS poryadok,
           '  ' || c.relname || ' : ' || con.conname
                || ' : ' || pg_get_constraintdef(con.oid) AS stroka
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
),
ukazateli AS (
    SELECT 3 AS razdel,
           tablename || '.' || indexname AS poryadok,
           '  ' || indexdef AS stroka
      FROM pg_indexes
     WHERE schemaname = 'public'
),
funkcii AS (
    SELECT 4 AS razdel,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS poryadok,
           pg_get_functiondef(p.oid) AS stroka
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prokind = 'f'
),
storozha AS (
    SELECT 5 AS razdel,
           c.relname || '.' || t.tgname AS poryadok,
           '  ' || pg_get_triggerdef(t.oid) AS stroka
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND NOT t.tgisinternal
),
dostup AS (
    SELECT 6 AS razdel,
           tablename || '.' || policyname AS poryadok,
           '  ' || tablename || ' : ' || policyname
                || ' : ' || cmd || ' : ' || coalesce(roles::text, '')
                || ' : USING ' || coalesce(qual, '—')
                || ' : CHECK ' || coalesce(with_check, '—') AS stroka
      FROM pg_policies
     WHERE schemaname = 'public'
),
perechisleniya AS (
    SELECT 7 AS razdel,
           t.typname AS poryadok,
           '  ' || t.typname || ' = '
                || string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS stroka
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
     GROUP BY t.typname
),
predstavleniya AS (
    SELECT 8 AS razdel,
           c.relname AS poryadok,
           '  ' || c.relname || ' AS ' || pg_get_viewdef(c.oid, true) AS stroka
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
),
vsyo AS (
    SELECT * FROM tablicy
    UNION ALL SELECT * FROM ogranicheniya
    UNION ALL SELECT * FROM ukazateli
    UNION ALL SELECT * FROM funkcii
    UNION ALL SELECT * FROM storozha
    UNION ALL SELECT * FROM dostup
    UNION ALL SELECT * FROM perechisleniya
    UNION ALL SELECT * FROM predstavleniya
)
SELECT row_number() OVER (ORDER BY razdel, poryadok) AS n,
       CASE razdel
            WHEN 1 THEN 'TABLICY'  WHEN 2 THEN 'OGRANICHENIYA'
            WHEN 3 THEN 'UKAZATELI' WHEN 4 THEN 'FUNKCII'
            WHEN 5 THEN 'STOROZHA' WHEN 6 THEN 'DOSTUP'
            WHEN 7 THEN 'PERECHISLENIYA' ELSE 'PREDSTAVLENIYA' END AS razdel,
       poryadok AS imya,
       stroka
  FROM vsyo
 ORDER BY razdel, poryadok;
