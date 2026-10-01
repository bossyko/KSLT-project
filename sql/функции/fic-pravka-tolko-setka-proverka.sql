-- ============================================================
-- Проверка: правка результата отделяет сетку от групп
-- ============================================================
--
-- Читающий файл. Базу не меняет. Гоняется после
-- `fic-pravka-tolko-setka.sql`.
--
-- Жду `true` во всех трёх строках.

-- 1. Отбор «только сетка» стоит в теле функции
select 'отбор в теле fic_правка' as что,
       (pg_get_functiondef(p.oid) like '%group_number IS NULL%') as ок
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'fic_правка';

-- 2. Отбор стоит у ВСЕГО семейства, а не у одной функции
select 'всё семейство отбирает сетку' as что,
       bool_and(pg_get_functiondef(p.oid) like '%group_number IS NULL%') as ок
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('fic_правка', 'fic_затронутые', 'fic_заменить_дальше',
                     'fic_закрыть_проходы', 'advance_bracket_winner');

-- 3. Размер сетки считается по клеткам сетки, а не по всем матчам круга 1.
--    На турнире с группами эти два числа РАЗНЫЕ — в том и дело.
select 'размер сетки считается по клеткам' as что,
       count(*) filter (where group_number is null and round is distinct from 'IG') as клеток_сетки,
       count(*)                                                                     as всех_матчей_круга_1,
       count(*) filter (where group_number is null and round is distinct from 'IG')
         < count(*)                                                                 as различаются
  from matches
 where tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   and round_number = 1;
