-- ============================================================
-- ДВА ШАГА, КОТОРЫЕ ЕЩЁ НЕ ИЗМЕРЕНЫ
-- ============================================================
--
-- ЧИТАЕТ, НЕ МЕНЯЕТ. Прогонять в БОЕВОЙ (qqkzszesviukopgjbead).
--
-- ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. В `zamer-tablicy-ochkov.sql` четырнадцать шагов, и
-- редактор Supabase показывает только последнюю выдачу. Шаг 4 прогонялся
-- вместе со всеми и потерялся в хвосте. Здесь ровно два запроса.
--
-- ПРИБОР, НАСТРОЕННЫЙ НА БЕДУ, СЛЕПНЕТ, КОГДА БЕДУ ПОЧИНИЛИ. Шаг 10в
-- отбирал турниры условием `level_id IS NULL` — то есть по СИМПТОМУ. После
-- правки ТБШ (`tbsh-2026-uroven-pravka.sql`) у тех восьми уровень есть, и
-- шаг 10в их больше не видит вовсе: он показывает 139 строк парных и
-- дружеских, все с нулём очков. Запрос верен, предмета в нём нет.
-- Здесь отбор идёт ПО СЛЕПКУ `public.slepok_tbsh_uroven` — он называет
-- предмет по `id`, и правка ТБШ его не ослепляет.

-- ---- Шаг 4. Старая таблица по раундам: что в ней лежит ----
--
-- Экран «Рейтинговые очки» правит `points_rules` (`settings.js:309`), а
-- начисление читает `points_by_place` (`bracket.js:2328`). Прежде чем
-- переносить экран на места, надо знать, что именно потеряется.
-- Читателя `points_rules` я нашёл один: `players.js:142`.

SELECT 'ШАГ 4 · ТАБЛИЦА ПО РАУНДАМ' AS шаг;

SELECT coalesce(у.name, '— без уровня —') AS уровень,
       count(п.id)                        AS строк,
       string_agg(п.round || '=' || п.points, ', ' ORDER BY п.points DESC) AS содержимое
  FROM public.points_rules п
  LEFT JOIN public.tournament_levels у ON у.id = п.level_id
 GROUP BY у.name
 ORDER BY (у.name IS NULL) DESC, у.name;

-- ---- Шаг 10в заново. Куда зачтены очки восьми ТБШ ----
--
-- Две оси, которые нельзя сводить в одну: уровень турнира
-- (`tournaments.level_id`) говорит СКОЛЬКО платить, категория игрока
-- (`tournament_results.category_id`) — КУДА зачесть. Названия
-- ProMasters…Tour в заголовке — это дивизионы одного события, а не уровни.
--
-- Проверяем числами: заполнен ли `category_id` в этих строках.

SELECT 'ШАГ 10в · КУДА ЗАЧТЕНЫ ОЧКИ ТБШ' AS шаг;

SELECT т.title,
       coalesce(у.name, '— без уровня —')    AS уровень_турнира,
       coalesce(и.category_id, '— пусто —')  AS категория_зачёта,
       count(*)                              AS строк,
       sum(и.points_earned)                  AS очков,
       min(и.points_earned)                  AS от,
       max(и.points_earned)                  AS до
  FROM public.slepok_tbsh_uroven с
  JOIN public.tournaments т        ON т.id = с.id
  JOIN public.tournament_results и ON и.tournament_id = т.id
  LEFT JOIN public.tournament_levels у ON у.id = т.level_id
 WHERE с.снято = (SELECT max(снято) FROM public.slepok_tbsh_uroven)
 GROUP BY т.title, у.name, и.category_id
 ORDER BY т.title, count(*) DESC;
