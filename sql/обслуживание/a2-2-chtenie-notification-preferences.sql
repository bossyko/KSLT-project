-- ============================================================
-- A2.2 — ЧТО ЛЕЖИТ В МЁРТВОЙ ТАБЛИЦЕ notification_preferences
-- ============================================================
--
-- ТОЛЬКО ЧТЕНИЕ. Ни одной строки не меняется и не удаляется.
--
-- ОДИН ЗАПРОС, А НЕ ВОСЕМЬ: редактор Supabase показывает результат
-- ТОЛЬКО ПОСЛЕДНЕГО запроса, и файл из нескольких запросов один раз уже
-- заставил нас думать, что заливка не прошла. Поэтому всё собрано в один
-- результат через UNION ALL: читается сверху вниз как отчёт.
--
-- Столбцы взяты ИЗ КОДА, а не из файла схемы:
--   mobile/www/js/screens/profile.js:1516 — select profile_id, category,
--   channel, opted_out;
--   :1572 — upsert по (profile_id, category, channel).
-- Если в живой базе столбцы другие — это покажет раздел «6».
--
-- ЧТО НАДО УВИДЕТЬ ПЕРЕД УДАЛЕНИЕМ:
--   · сколько строк всего и скольких людей они касаются;
--   · есть ли среди них ЖИВЫЕ учётные записи (не удалённые);
--   · есть ли хоть одна строка, где человек ВЫКЛЮЧИЛ уведомление
--     (opted_out = true) — именно такую потерять нельзя: это не
--     «настройка по умолчанию», а прямой отказ человека;
--   · сколько людей уже имеют настройки в ЖИВОМ месте
--     (profiles.notify_preferences) — тех переносить не из чего.

with строки as (
    select
        np.profile_id,
        np.category,
        np.channel,
        np.opted_out,
        p.id                     as профиль_жив,
        p.deleted_at             as помечен_на_удаление,
        p.notify_preferences     as живые_настройки
    from notification_preferences np
    left join profiles p on p.id = np.profile_id
)
select * from (

    select 1 as n, '1 · ВСЕГО' as раздел,
           'строк в таблице' as ключ,
           count(*)::text as число
    from строки

    union all
    select 2, '1 · ВСЕГО', 'разных людей', count(distinct profile_id)::text from строки

    union all
    select 3, '2 · ЖИВЫЕ ЛИ ЭТО ЛЮДИ',
           'строк, у которых профиля в базе НЕТ вовсе',
           count(*)::text
    from строки where профиль_жив is null

    union all
    select 4, '2 · ЖИВЫЕ ЛИ ЭТО ЛЮДИ',
           'строк у профилей, помеченных на удаление',
           count(*)::text
    from строки where помечен_на_удаление is not null

    union all
    select 5, '2 · ЖИВЫЕ ЛИ ЭТО ЛЮДИ',
           'строк у ЖИВЫХ профилей',
           count(*)::text
    from строки
    where профиль_жив is not null and помечен_на_удаление is null

    union all
    select 6, '3 · ЕСТЬ ЛИ ПРЯМОЙ ОТКАЗ ЧЕЛОВЕКА',
           'строк с opted_out = true (ВЫКЛЮЧИЛ сам)',
           count(*)::text
    from строки where opted_out is true

    union all
    select 7, '3 · ЕСТЬ ЛИ ПРЯМОЙ ОТКАЗ ЧЕЛОВЕКА',
           'из них у ЖИВЫХ профилей — ИМЕННО ЭТИ ТЕРЯТЬ НЕЛЬЗЯ',
           count(*)::text
    from строки
    where opted_out is true
      and профиль_жив is not null and помечен_на_удаление is null

    union all
    select 8, '3 · ЕСТЬ ЛИ ПРЯМОЙ ОТКАЗ ЧЕЛОВЕКА',
           'разных ЖИВЫХ людей с хотя бы одним отказом',
           count(distinct profile_id)::text
    from строки
    where opted_out is true
      and профиль_жив is not null and помечен_на_удаление is null

    union all
    select 9, '4 · РАЗБИВКА',
           coalesce(category, '(пусто)') || ' / ' || coalesce(channel, '(пусто)'),
           count(*)::text || ' строк, из них выключено ' ||
           count(*) filter (where opted_out is true)::text
    from строки
    group by category, channel

    union all
    select 10, '5 · ЖИВОЕ МЕСТО',
           'людей, у которых profiles.notify_preferences уже заполнен',
           count(*)::text
    from profiles
    where notify_preferences is not null
      and notify_preferences::text not in ('{}', 'null')

    union all
    select 11, '5 · ЖИВОЕ МЕСТО',
           'из тех, кто есть в мёртвой таблице, уже имеют живые настройки',
           count(distinct profile_id)::text
    from строки
    where живые_настройки is not null
      and живые_настройки::text not in ('{}', 'null')

    union all
    select 12, '6 · СТОЛБЦЫ МЁРТВОЙ ТАБЛИЦЫ (как есть в базе)',
           ordinal_position::text || '. ' || column_name,
           data_type || case when is_nullable = 'YES' then ', может быть пусто' else '' end
    from information_schema.columns
    where table_schema = 'public' and table_name = 'notification_preferences'

    union all
    select 13, '7 · КТО ЕЩЁ ТРОГАЕТ ТАБЛИЦУ',
           'правил RLS на таблице',
           count(*)::text
    from pg_policies
    where schemaname = 'public' and tablename = 'notification_preferences'

    union all
    select 14, '7 · КТО ЕЩЁ ТРОГАЕТ ТАБЛИЦУ',
           'триггеров на таблице',
           count(*)::text
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'notification_preferences'

) отчёт
order by n, ключ;
