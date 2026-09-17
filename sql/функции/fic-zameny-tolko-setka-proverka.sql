-- ============================================================
-- Перестановки не трогают группы — ПРОВЕРКА
-- ============================================================
--
-- Что ожидаем: у всех четырёх функций «есть» в колонке «отбор_сетки».
-- Если где-то «НЕТ» — функция в базе старая, правку не накатили.
--
-- Запрос читающий, ничего не меняет.

SELECT p.proname                                   AS функция,
       CASE WHEN pg_get_functiondef(p.oid) LIKE '%group_number IS NULL%'
            THEN 'есть' ELSE 'НЕТ' END             AS отбор_сетки,
       CASE WHEN pg_get_functiondef(p.oid) LIKE '%IS DISTINCT FROM ''IG''%'
            THEN 'есть' ELSE 'нет' END             AS отбор_отборочных,
       obj_description(p.oid, 'pg_proc')           AS подпись
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('fic_заменить_дальше', 'advance_bracket_winner',
                     'fic_итоги', 'fic_закрыть_проходы')
 ORDER BY p.proname;
