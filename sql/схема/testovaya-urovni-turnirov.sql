-- ============================================================
-- ТЕСТОВАЯ ДОГОНЯЕТ БОЕВУЮ: УРОВНИ ТУРНИРОВ
-- ============================================================
--
-- ТОЛЬКО ТЕСТОВАЯ (itlanqwcwygxchitaatt). В боевой уровни уже есть.
--
-- ЗАЧЕМ. Прогон 02.10 в тестовой: `tournament_levels` несёт ОДИН уровень —
-- «Итоговый турнир», sort_order 1. Четырёх категорий нет. Поэтому
-- наполнение таблицы очков дало 64 строки вместо 320, и любая проверка
-- начисления в тестовой мерила один уровень из пяти.
--
-- ТЕСТОВАЯ БАЗА — ЧАСТЬ ПРИБОРА, И ПРИБОР БЕЗ ЧЕТЫРЁХ ПЯТЫХ ШКАЛЫ НЕ ПРИБОР.
--
-- Числа sort_order и названия — из боевой (замер 02.10, шаг 1):
--   5 Высшая категория · 4 1 категория · 3 2 категория · 2 3 категория
--   1 Итоговый турнир (on_ladder = false)
--
-- Идентификаторы в тестовой будут СВОИ: `id` у уровня свой в каждой базе,
-- и сверять базы надо по `sort_order`, а не по `id`.

BEGIN;

-- ---- 1. Заводим то, чего нет. Существующее не трогаем ----
--
-- Привязка по `sort_order`, а не по названию: имена переименовывались
-- дважды, и привязка по имени — ровно то, из-за чего старый файл сегодня
-- не положил бы ни строки.

INSERT INTO public.tournament_levels (name, name_en, sort_order, on_ladder)
SELECT н.name, н.name_en, н.sort_order, н.on_ladder
  FROM (VALUES
          ('Высшая категория', 'Top category', 5, true),
          ('1 категория',      'Category 1',   4, true),
          ('2 категория',      'Category 2',   3, true),
          ('3 категория',      'Category 3',   2, true)
       ) AS н(name, name_en, sort_order, on_ladder)
 WHERE NOT EXISTS (SELECT 1 FROM public.tournament_levels у
                    WHERE у.sort_order = н.sort_order);

-- ---- 2. Порог: должно стать ровно пять ----

DO $$
DECLARE
    сколько integer;
    налестнице integer;
BEGIN
    SELECT count(*) INTO сколько
      FROM public.tournament_levels WHERE sort_order BETWEEN 1 AND 5;
    IF сколько <> 5 THEN
        RAISE EXCEPTION
            'Уровней со sort_order 1…5 стало % вместо пяти — откатываемся', сколько;
    END IF;

    SELECT count(*) INTO налестнице
      FROM public.tournament_levels WHERE on_ladder AND sort_order BETWEEN 1 AND 5;
    IF налестнице <> 4 THEN
        RAISE EXCEPTION
            'На лестнице % уровней вместо четырёх — откатываемся', налестнице;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- ПОСЛЕ ЭТОГО ФАЙЛА — ПРОГНАТЬ `sql/схема/versii-tablicy-ochkov.sql`
-- ЕЩЁ РАЗ: он наполнит местами те уровни, у которых мест нет.
-- ============================================================
--
-- ПРОВЕРИТЬ ЧТЕНИЕМ:
--
-- SELECT sort_order, name, on_ladder FROM public.tournament_levels
--  ORDER BY sort_order DESC;
-- -- ждём пять строк, у итогового on_ladder = false
--
-- SELECT у.sort_order, у.name, count(п.place) AS строк,
--        max(п.points) FILTER (WHERE п.place = 1) AS за_первое
--   FROM public.tournament_levels у
--   LEFT JOIN public.points_by_place п ON п.level_id = у.id
--  GROUP BY у.sort_order, у.name ORDER BY у.sort_order DESC;
-- -- ждём по 64 строки у всех пяти, за первое место 1000·600·360·215·130
