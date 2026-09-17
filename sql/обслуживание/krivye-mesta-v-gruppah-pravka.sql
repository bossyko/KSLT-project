-- ============================================================
-- Сброс кривых ручных мест в группах — ПРАВКА
-- ============================================================
--
-- Поле выбора места меняло участников местами неверно: «прежним» местом
-- считалось уже новое, и тот, с кем менялись, получал то же самое число. В
-- группе из четырёх выходило два четвёртых места, одно пятое, а второго не
-- было вовсе.
--
-- Сама ошибка исправлена в админке. Здесь убираем её след: раскладки, где
-- места повторяются или где наибольшее место больше числа участников
-- группы. Правильно расставленные ручные места остаются.
--
-- Что было до и что стало — смотреть соседним файлом
-- krivye-mesta-v-gruppah-proverka.sql
--
-- Запускать можно повторно.

BEGIN;

WITH разбор AS (
    SELECT t.id                    AS турнир,
           г.ключ                  AS группа,
           count(*)                AS записей,
           count(DISTINCT м.место) AS разных,
           max(м.место)            AS наибольшее
      FROM public.tournaments t
     CROSS JOIN LATERAL jsonb_each(COALESCE(t.manual_group_places, '{}'::jsonb)) AS г(ключ, раскладка)
     CROSS JOIN LATERAL jsonb_each_text(г.раскладка) AS з(игрок, место_текст)
     CROSS JOIN LATERAL (SELECT з.место_текст::int AS место) AS м
     GROUP BY t.id, г.ключ
),
кривые AS (
    SELECT турнир, группа
      FROM разбор
     WHERE разных < записей OR наибольшее > записей
)
UPDATE public.tournaments t
   SET manual_group_places = (
           SELECT COALESCE(jsonb_object_agg(г.ключ, г.раскладка), '{}'::jsonb)
             FROM jsonb_each(t.manual_group_places) AS г(ключ, раскладка)
            WHERE NOT EXISTS (
                SELECT 1 FROM кривые k
                 WHERE k.турнир = t.id AND k.группа = г.ключ
            )
       )
 WHERE EXISTS (SELECT 1 FROM кривые k WHERE k.турнир = t.id);

COMMIT;
