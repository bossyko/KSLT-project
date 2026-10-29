-- ============================================================
-- A2.2б — ГДЕ НА САМОМ ДЕЛЕ ЖИВУТ НАСТРОЙКИ УВЕДОМЛЕНИЙ
-- ============================================================
--
-- ЗАЧЕМ ВТОРОЙ ЗАПРОС. Первый упал: `relation "notification_preferences"
-- does not exist`. Значит таблицы, в которую пишет приложение
-- (`mobile/www/js/screens/profile.js:1572`), в базе НЕТ ВОВСЕ — и моя
-- прежняя запись в трекере «люди уже навыбирали в мёртвой таблице» была
-- НЕПРОВЕРЕННЫМ УТВЕРЖДЕНИЕМ. Исправляю порядок: сперва читаю каталог,
-- потом говорю.
--
-- ТОЛЬКО ЧТЕНИЕ КАТАЛОГА. Ни к одной прикладной таблице запрос не
-- обращается по имени, поэтому упасть на отсутствующей таблице он не
-- может — что и было бедой первого файла.
--
-- ОДИН ЗАПРОС: редактор Supabase показывает результат только последнего.

select * from (

    -- 1. Все таблицы и представления, чьё имя похоже на уведомления или
    --    настройки — в ЛЮБОЙ схеме, а не только в public.
    select 1 as n,
           '1 · ЧТО ЕСТЬ ПОХОЖЕГО ПО ИМЕНИ' as раздел,
           table_schema || '.' || table_name as ключ,
           lower(table_type) as значение
    from information_schema.tables
    where (table_name ilike '%notif%' or table_name ilike '%pref%'
           or table_name ilike '%subscri%' or table_name ilike '%push%')
      and table_schema not in ('pg_catalog', 'information_schema')

    union all
    -- 2. Есть ли вообще таблица с таким именем в любой схеме.
    select 2, '2 · ТА САМАЯ ТАБЛИЦА',
           'notification_preferences найдена в схемах',
           coalesce(string_agg(table_schema, ', ' order by table_schema), 'НИ В ОДНОЙ')
    from information_schema.tables
    where table_name = 'notification_preferences'

    union all
    -- 3. Живое место: столбец notify_preferences на profiles.
    select 3, '3 · ЖИВОЕ МЕСТО (столбец на profiles)',
           column_name,
           data_type || ', по умолчанию ' || coalesce(column_default, 'ничего')
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and (column_name ilike '%notif%' or column_name ilike '%pref%'
           or column_name ilike '%push%' or column_name ilike '%telegram%')

    union all
    -- 4. Все столбцы profiles, чтобы не гадать второй раз.
    select 4, '4 · ВСЕ СТОЛБЦЫ profiles',
           ordinal_position::text || '. ' || column_name,
           data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'

    union all
    -- 5. Не ссылается ли на пропавшую таблицу что-то в самой базе:
    --    представления, функции, триггеры.
    select 5, '5 · КТО В БАЗЕ ЕЩЁ ЗНАЕТ ЭТО ИМЯ',
           'представлений с упоминанием notification_preferences',
           count(*)::text
    from information_schema.views
    where table_schema = 'public'
      and view_definition ilike '%notification_preferences%'

    union all
    select 6, '5 · КТО В БАЗЕ ЕЩЁ ЗНАЕТ ЭТО ИМЯ',
           'функций с упоминанием notification_preferences',
           count(*)::text
    from pg_proc pr
    join pg_namespace ns on ns.oid = pr.pronamespace
    where ns.nspname = 'public'
      -- ПРИБОР, СПРАШИВАЮЩИЙ ОПРЕДЕЛЕНИЕ, ПАДАЕТ НА АГРЕГАТЕ:
      -- `pg_get_functiondef` для агрегатной функции бросает
      -- «"array_agg" is an aggregate function», и из-за одной такой
      -- функции в схеме падал бы ВЕСЬ отчёт. Берём только обычные
      -- функции и процедуры (prokind 'f' и 'p').
      and pr.prokind in ('f', 'p')
      and pg_get_functiondef(pr.oid) ilike '%notification_preferences%'

    union all
    -- 6. Сколько людей всего и у скольких живые настройки заполнены.
    --    Считается ДИНАМИЧЕСКИ — через каталог, без имени столбца в
    --    тексте запроса, чтобы не упасть, если столбца тоже нет.
    select 7, '6 · ЛЮДИ',
           'строк в profiles',
           (select count(*)::text from profiles)

    union all
    select 8, '6 · ЛЮДИ',
           'из них помечены на удаление',
           (select count(*)::text from profiles where deleted_at is not null)

) отчёт
order by n, ключ;
