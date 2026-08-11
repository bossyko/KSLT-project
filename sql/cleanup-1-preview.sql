-- ============================================
-- ШАГ 1. Что мы собираемся удалить — только смотрим
-- Запустить в Supabase SQL Editor. Ничего не меняет.
-- ============================================
--
-- Оставляем шесть аккаунтов и их карточки игроков. Всё остальное — игроки,
-- турниры, матчи, рейтинги, баттлы — удаляется.
--
-- Этот запрос ничего не трогает. Он показывает, сколько чего уйдёт и какие
-- таблицы вообще связаны с тем, что мы удаляем: список связей лучше узнать
-- у самой базы, чем вспоминать по названиям — иначе на середине удаления
-- вылезет забытая связь и всё остановится.

-- --- Кого оставляем ------------------------------------------------------

WITH keep AS (
    SELECT unnest(ARRAY[
        '623869d5-8176-44fe-8880-46052190d02a',
        '777a87ab-a246-4477-9f8d-9989f26e7205',
        '9ef31f4e-915c-4520-bf15-32aca8462e10',
        'c5062599-b633-456e-bbac-a8f02dd665dc',
        'cff23cd6-61c7-4845-aa5b-4d4f7f36d4b6',
        'e89021a2-72a5-47c6-aeec-fa2bea44a062'
    ]::uuid[]) AS id
)
SELECT p.id,
       p.full_name AS имя,
       p.email     AS почта,
       p.role      AS роль,
       p.player_id AS карточка_игрока,
       CASE WHEN p.id IN (SELECT id FROM keep) THEN 'ОСТАЁТСЯ' ELSE 'удаляется' END AS решение
FROM profiles p
ORDER BY решение, p.full_name;

-- --- Сколько чего уйдёт --------------------------------------------------

WITH keep AS (
    SELECT unnest(ARRAY[
        '623869d5-8176-44fe-8880-46052190d02a',
        '777a87ab-a246-4477-9f8d-9989f26e7205',
        '9ef31f4e-915c-4520-bf15-32aca8462e10',
        'c5062599-b633-456e-bbac-a8f02dd665dc',
        'cff23cd6-61c7-4845-aa5b-4d4f7f36d4b6',
        'e89021a2-72a5-47c6-aeec-fa2bea44a062'
    ]::uuid[]) AS id
),
keep_players AS (
    SELECT player_id FROM profiles WHERE id IN (SELECT id FROM keep) AND player_id IS NOT NULL
)
SELECT 'профили'      AS что, count(*) FILTER (WHERE id NOT IN (SELECT id FROM keep)) AS удалится,
                              count(*) FILTER (WHERE id IN (SELECT id FROM keep))     AS останется
FROM profiles
UNION ALL
SELECT 'игроки', count(*) FILTER (WHERE id NOT IN (SELECT player_id FROM keep_players)),
                 count(*) FILTER (WHERE id IN (SELECT player_id FROM keep_players))
FROM players
UNION ALL
SELECT 'турниры', count(*), 0 FROM tournaments
UNION ALL
SELECT 'матчи', count(*), 0 FROM matches
UNION ALL
SELECT 'заявки на турниры', count(*), 0 FROM tournament_registrations
UNION ALL
SELECT 'история рейтинга', count(*), 0 FROM rating_history
UNION ALL
SELECT 'бейджи игроков', count(*), 0 FROM player_badges
UNION ALL
SELECT 'баттлы', count(*), 0 FROM challenges;

-- --- Какие таблицы ссылаются на то, что удаляем --------------------------
-- Если здесь окажется таблица, которой нет в скрипте удаления, — удаление
-- остановится на ней. Лучше увидеть список сейчас.

SELECT tc.table_name        AS таблица,
       kcu.column_name      AS колонка,
       ccu.table_name       AS ссылается_на
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
     ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
JOIN information_schema.constraint_column_usage ccu
     ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name IN ('players', 'profiles', 'tournaments', 'challenges', 'matches')
ORDER BY ccu.table_name, tc.table_name;

-- --- Правила удаления у этих связей --------------------------------------
-- Где стоит ON DELETE CASCADE, дочерние записи уйдут сами. Где нет —
-- их нужно удалять вручную, иначе база не даст удалить родителя.

SELECT c.conname                AS связь,
       src.relname              AS таблица,
       tgt.relname              AS ссылается_на,
       CASE c.confdeltype
           WHEN 'a' THEN 'запретит удаление'
           WHEN 'r' THEN 'запретит удаление'
           WHEN 'c' THEN 'удалит следом (CASCADE)'
           WHEN 'n' THEN 'обнулит ссылку'
           WHEN 'd' THEN 'поставит значение по умолчанию'
       END AS что_будет
FROM pg_constraint c
JOIN pg_class src ON src.oid = c.conrelid
JOIN pg_class tgt ON tgt.oid = c.confrelid
WHERE c.contype = 'f'
  AND tgt.relname IN ('players', 'profiles', 'tournaments', 'challenges', 'matches')
ORDER BY tgt.relname, src.relname;
