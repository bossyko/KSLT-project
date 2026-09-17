-- ============================================================
-- Категории и очки за место — ПРОВЕРКА
-- ============================================================
--
-- Что ожидаем: шесть уровней. У пяти категорий по 64 места и первые
-- строки как в Положении:
--
--   Высшая     1000  600  420  360
--   Первая      600  360  250  215
--   Вторая      360  215  150  130
--   Третья      215  130   90   77
--   Четвёртая   130   80   55   48
--
-- У «Итогового турнира» мест 8: за_1 400, за_2 250, за_3 150, за_4 100,
-- дальше нули — места с пятого по восьмое не разыгрываются, за них
-- начисляется по 50 за каждую победу в группе, и это делает код.
--
-- Колонка «турниров» показывает, сколько турниров привязано к уровню:
-- переименование привязку не трогало, числа должны остаться прежними.
--
-- Запрос читающий, ничего не меняет.

SELECT tl.name                                          AS категория,
       tl.name_en                                       AS англ,
       tl.sort_order                                    AS сила,
       (SELECT count(*) FROM public.tournaments t
         WHERE t.level_id = tl.id)                      AS турниров,
       count(pp.id)                                     AS мест,
       max(CASE WHEN pp.place = 1  THEN pp.points END)  AS за_1,
       max(CASE WHEN pp.place = 2  THEN pp.points END)  AS за_2,
       max(CASE WHEN pp.place = 3  THEN pp.points END)  AS за_3,
       max(CASE WHEN pp.place = 4  THEN pp.points END)  AS за_4,
       max(CASE WHEN pp.place = 8  THEN pp.points END)  AS за_8,
       max(CASE WHEN pp.place = 16 THEN pp.points END)  AS за_16,
       max(CASE WHEN pp.place = 32 THEN pp.points END)  AS за_32,
       max(CASE WHEN pp.place = 64 THEN pp.points END)  AS за_64
  FROM public.tournament_levels tl
  LEFT JOIN public.points_by_place pp ON pp.level_id = tl.id
 GROUP BY tl.id, tl.name, tl.name_en, tl.sort_order
 ORDER BY tl.sort_order DESC;
