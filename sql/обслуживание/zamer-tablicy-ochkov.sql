-- ============================================================
-- ЗАМЕР ТАБЛИЦЫ ОЧКОВ: что в ней на самом деле стоит
-- ============================================================
--
-- ЧИТАЕТ, НЕ МЕНЯЕТ. Прогонять в БОЕВОЙ (qqkzszesviukopgjbead) —
-- истина живёт там. В тестовой можно прогнать тем же файлом для сверки.
--
-- ЗАЧЕМ. Экран «Рейтинговые очки» в админке правит `points_rules` — очки
-- ПО РАУНДАМ (`settings.js:309`). Начисление же читает `points_by_place` —
-- очки ПО МЕСТАМ (`bracket.js:2328`). Два определения одного понятия:
-- экран правит не ту таблицу, и 64 места никогда не имели экрана.
--
-- Прежде чем заводить версии и переписывать экран, надо знать ЦИФРАМИ:
-- сколько мест заполнено у каждого уровня и есть ли вообще 64 строки.
--
-- ОСТОРОЖНО С ИМЕНАМИ. `sql/схема/kategorii-i-ochki.sql:179` привязывал
-- строки по НАЗВАНИЮ уровня — 'Высшая', 'Первая', 'Вторая', 'Третья',
-- 'Четвёртая'. 30.09 и 02.10 уровни переименованы: «Высшая категория»,
-- «1 категория», «2 категория», «3 категория», «Итоговый турнир».
-- Значит привязка по имени больше не сработает, и ПРОВЕРИТЬ надо не
-- название, а что строки доехали до нынешних уровней по `id`.

-- ---- Шаг 1. Уровни: сколько их и в каком порядке ----
SELECT 'ШАГ 1 · УРОВНИ' AS шаг;

SELECT sort_order,
       name,
       name_en,
       on_ladder,
       id
  FROM public.tournament_levels
 ORDER BY sort_order DESC;

-- ---- Шаг 2. Сколько мест заполнено у каждого уровня ----
--
-- Ждём: четыре категории по 64 строки, итоговый турнир — 8.
-- Любое другое число означает, что таблица неполна, и экран на 64 места
-- показал бы дыры.

SELECT 'ШАГ 2 · МЕСТ НА УРОВЕНЬ' AS шаг;

SELECT у.sort_order,
       у.name,
       count(п.place)        AS строк,
       min(п.place)          AS первое_место,
       max(п.place)          AS последнее_место,
       count(*) FILTER (WHERE п.points = 0) AS нулевых,
       -- дыры: сколько мест между первым и последним пропущено
       (max(п.place) - min(п.place) + 1) - count(п.place) AS пропущено
  FROM public.tournament_levels у
  LEFT JOIN public.points_by_place п ON п.level_id = у.id
 GROUP BY у.sort_order, у.name
 ORDER BY у.sort_order DESC;

-- ---- Шаг 3. Первые десять мест — числами ----
--
-- Чтобы на макете и на экране стояли те же цифры, что в базе, а не
-- переписанные с бумаги.

SELECT 'ШАГ 3 · МЕСТА 1–10' AS шаг;

SELECT п.place AS место,
       max(п.points) FILTER (WHERE у.sort_order = 5) AS "Высшая",
       max(п.points) FILTER (WHERE у.sort_order = 4) AS "1 кат",
       max(п.points) FILTER (WHERE у.sort_order = 3) AS "2 кат",
       max(п.points) FILTER (WHERE у.sort_order = 2) AS "3 кат",
       max(п.points) FILTER (WHERE у.sort_order = 1) AS "Итоговый"
  FROM public.points_by_place п
  JOIN public.tournament_levels у ON у.id = п.level_id
 WHERE п.place <= 10
 GROUP BY п.place
 ORDER BY п.place;

-- ---- Шаг 4. Старая таблица по раундам: жива ли ----
--
-- Её правит нынешний экран. Если в ней есть строки, значит экран писал
-- в неё — и надо знать, читает ли её хоть кто-нибудь.
-- Читателя я нашёл один: `players.js:142` (список игроков).

SELECT 'ШАГ 4 · ТАБЛИЦА ПО РАУНДАМ' AS шаг;

SELECT у.name,
       count(п.*) AS строк,
       string_agg(п.round || '=' || п.points, ', ' ORDER BY п.points DESC) AS содержимое
  FROM public.tournament_levels у
  LEFT JOIN public.points_rules п ON п.level_id = у.id
 GROUP BY у.name
 ORDER BY у.name;

-- ---- Шаг 5. Кто уже начислен: турниры с итогами ----
--
-- Версии нужны ровно затем, чтобы эти турниры НЕ пересчитывались при
-- правке таблицы. Надо знать, сколько их и с какой даты.

SELECT 'ШАГ 5 · ТУРНИРЫ С НАЧИСЛЕННЫМИ ОЧКАМИ' AS шаг;

SELECT count(DISTINCT и.tournament_id) AS турниров,
       count(*)                        AS строк_итогов,
       min(т.start_date)               AS самый_ранний,
       max(т.start_date)               AS самый_поздний
  FROM public.tournament_results и
  JOIN public.tournaments т ON т.id = и.tournament_id;

-- ---- Шаг 6. Кому сейчас разрешено писать в таблицу ----
--
-- Слово Кости 02.10: «изменить очки может только администратор, не
-- менеджер». В базе политика пускает обоих
-- (`sql/схема/kategorii-i-ochki.sql:89`) — проверяем текстом политики,
-- а не памятью.

SELECT 'ШАГ 6 · ПОЛИТИКИ ДОСТУПА' AS шаг;

SELECT tablename, policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('points_by_place', 'points_rules')
 ORDER BY tablename, policyname;
