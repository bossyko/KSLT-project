-- ============================================
-- Пересчёт значков по всем игрокам
-- Запускать ПОСЛЕ sql/badges-fix.sql
-- ============================================
--
-- Выдаёт недостающие значки и снимает те, что перестали быть заслуженными.
--
-- Идём партиями по полсотни игроков. Одним запросом на все три сотни
-- редактор Supabase не дожидается ответа и показывает «Failed to fetch» —
-- это обрыв соединения, а не ошибка в запросе.
--
-- КАК ЗАПУСКАТЬ: выделить один блок, нажать Ctrl+Enter (Cmd+Enter), дождаться
-- ответа, перейти к следующему. Порядок значения не имеет, повторный прогон
-- блока безвреден.
--
-- В ответе — сколько игроков обработано и сколько значков выдано заново.
-- Снятые значки в счёт не идут, их видно проверкой в самом низу файла.

-- ---- Куда я попал? ----------------------------------------------------
-- Выполнить первым делом. Боевая база — три сотни игроков и знакомые
-- фамилии. Тестовая — три строки с именами вида test-*. Файлы ниже
-- рассчитаны на боевую.
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;

-- ---- Партия 1 (игроки 1–50) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 0) p) x;

-- ---- Партия 2 (51–100) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 50) p) x;

-- ---- Партия 3 (101–150) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 100) p) x;

-- ---- Партия 4 (151–200) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 150) p) x;

-- ---- Партия 5 (201–250) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 200) p) x;

-- ---- Партия 6 (251–300) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 250) p) x;

-- ---- Партия 7 (301 и далее, если игроков стало больше) ----
SELECT count(*) AS игроков, coalesce(sum(array_length(added, 1)), 0) AS выдано_значков
FROM (SELECT check_and_award_badges(id) AS added
      FROM (SELECT id FROM players ORDER BY id LIMIT 50 OFFSET 300) p) x;


-- ============================================
-- Проверка после всех партий
-- ============================================

-- 1. Чемпионы и финалисты должны совпасть с результатами турниров.
--    Строк быть не должно ни одной.
SELECT pb.player_id, pb.badge_id, 'значок есть, а результата нет' AS что_не_так
FROM player_badges pb
WHERE pb.badge_id IN ('champion', 'finalist')
  AND NOT EXISTS (
      SELECT 1 FROM tournament_results tr
      WHERE tr.player_id = pb.player_id
        AND tr.round_reached = CASE pb.badge_id WHEN 'champion' THEN 'W' ELSE 'F' END
        AND COALESCE(tr.is_doubles, false) = false
  );

-- 2. Именной разбор по живому турниру: у Хана должен быть «Чемпион»,
--    у Жаныбекова его быть не должно, у Иванова — ни «Финалиста»,
--    ни «Первой победы».
SELECT p.id, p.name, p.wins, p.losses,
       array_agg(pb.badge_id ORDER BY pb.badge_id) AS значки
FROM players p
LEFT JOIN player_badges pb ON pb.player_id = p.id
WHERE p.id IN ('han-konstantin', 'zhanybekov-azat', 'ivan-ivanov', 'test-test')
GROUP BY p.id, p.name, p.wins, p.losses
ORDER BY p.id;
