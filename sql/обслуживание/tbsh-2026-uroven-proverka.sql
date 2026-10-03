-- ============================================================
-- ТБШ 2026: ПРОВЕРКА ПЕРЕД ПРАВКОЙ УРОВНЯ
-- ============================================================
--
-- ЧИТАЕТ, НЕ МЕНЯЕТ. Прогонять ПЕРВЫМ, до правки, и прислать вывод.
--
-- ЧТО НАШЛОСЬ (замер боевой 02.10, шаги 8–10). Восемь турниров ТБШ 2026
-- несут 269 строк итогов и 37 181 очко, а `level_id` у них пуст. Пока он
-- пуст, турнир не считается рейтинговым: выключены и очки, и отказ по
-- полу, и лестница категорий.
--
-- КАКАЯ ТАБЛИЦА ИМ ПЛАТИЛА — ДОКАЗАНО ЧИСЛАМИ, А НЕ ВЫВЕДЕНО ИЗ НАЗВАНИЯ.
-- Каждое число в этих турнирах есть значение места ВЫСШЕЙ категории
-- (`sql/схема/kategorii-i-ochki.sql:101`, колонка «Высшая»):
--
--   1000·600·420·360 — места 1·2·3·4      250·215·180 — места 5·6·7-8
--   145 — место 9      80 — место 17       45 — места 19-20
--   35 — места 21-24   31 — места 27-28    30 — места 29-33
--   15 — места 35-36   10 — места 37-40
--
-- Ни одно не разошлось. Слово Кости 02.10 объясняет и одинаковую 1000 у
-- всех: «категория турнира у всех была одна, а группы у них своя
-- категория… очки начисляются одинаково, так как они не пересекаются».
-- Названия ProMasters…Tour — это ДИВИЗИОНЫ одного события, а не уровни.

-- ---- 1. Те восемь: отбор, которым будет править правка ----
--
-- Отбор держится на содержимом, а не на списке id: название начинается с
-- «ТБШ », год 2026, одиночный, сетка `fic`, уровень пуст.
-- ЖДЁМ РОВНО 8 СТРОК. Другое число — правку не запускать.

SELECT 'ПРОВЕРКА 1 · ОТБОР' AS шаг;

SELECT т.id, т.title, т.gender, т.bracket_type, т.date_start,
       т.level_id,
       count(и.id)          AS строк_итогов,
       sum(и.points_earned) AS очков
  FROM public.tournaments т
  LEFT JOIN public.tournament_results и ON и.tournament_id = т.id
 WHERE т.level_id IS NULL
   AND т.title LIKE 'ТБШ %'
   AND т.date_start >= DATE '2026-01-01'
   AND т.format = 'singles'
   AND т.bracket_type = 'fic'
 GROUP BY т.id, т.title, т.gender, т.bracket_type, т.date_start, т.level_id
 ORDER BY т.title;

-- ---- 2. Уровень, который будем ставить ----
--
-- ЖДЁМ РОВНО ОДНУ СТРОКУ: «Высшая категория», sort_order 5, on_ladder true.

SELECT 'ПРОВЕРКА 2 · УРОВЕНЬ' AS шаг;

SELECT id, name, name_en, sort_order, on_ladder
  FROM public.tournament_levels
 WHERE sort_order = 5;

-- ---- 3. Не разойдётся ли начисленное с таблицей Высшей ----
--
-- Если уровень прописать, пересчёт турнира станет возможен — и он возьмёт
-- таблицу Высшей. Здесь видно заранее, где начисленное с ней РАСХОДИТСЯ:
-- такие строки пересчёт изменит, и о них надо знать ДО правки.
--
-- ЖДЁМ: «расходится» ноль у всех этапов, кроме тех, где этап не
-- переводится в точное место (SF, QF, R16, R32, G*) — там у меня перевода
-- нет, и пусто означает «не мерил», а не «сошлось».

SELECT 'ПРОВЕРКА 3 · СОЙДЁТСЯ ЛИ ПЕРЕСЧЁТ' AS шаг;

WITH высшая AS (
  SELECT п.place, п.points
    FROM public.points_by_place п
    JOIN public.tournament_levels у ON у.id = п.level_id
   WHERE у.sort_order = 5
),
итоги AS (
  SELECT и.round_reached AS этап, и.points_earned AS начислено,
         CASE и.round_reached WHEN 'W' THEN 1 WHEN 'F' THEN 2
                              WHEN '3RD' THEN 3 WHEN '4TH' THEN 4 END AS место
    FROM public.tournaments т
    JOIN public.tournament_results и ON и.tournament_id = т.id
   WHERE т.level_id IS NULL
     AND т.title LIKE 'ТБШ %'
     AND т.date_start >= DATE '2026-01-01'
     AND т.format = 'singles'
     AND т.bracket_type = 'fic'
)
SELECT coalesce(nullif(и.этап, ''), '— этап пуст —') AS этап,
       count(*)                                      AS строк,
       count(*) FILTER (WHERE и.место IS NOT NULL
                          AND и.начислено <> в.points) AS расходится,
       count(*) FILTER (WHERE и.место IS NULL)         AS не_мерил
  FROM итоги и
  LEFT JOIN высшая в ON в.place = и.место
 GROUP BY 1
 ORDER BY count(*) DESC;

-- ---- 4. Отдельная находка, правкой НЕ закрывается ----
--
-- У одного из восьми — «ТБШ Futures 2026» мужского — 50 строк итогов, и
-- этап не записан ни у одной: `round_reached` пустой строкой. Очки там
-- есть (15…1000), а стадии нет. Правка уровня этого не чинит.

SELECT 'ПРОВЕРКА 4 · СТРОКИ БЕЗ ЭТАПА' AS шаг;

SELECT т.title, count(*) AS строк,
       min(и.points_earned) AS от, max(и.points_earned) AS до
  FROM public.tournaments т
  JOIN public.tournament_results и ON и.tournament_id = т.id
 WHERE т.level_id IS NULL
   AND coalesce(и.round_reached, '') = ''
 GROUP BY т.id, т.title
 ORDER BY count(*) DESC;
