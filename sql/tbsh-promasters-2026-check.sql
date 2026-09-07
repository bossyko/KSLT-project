-- ============================================================
-- ТБШ ProMasters 2026: проверка переноса
-- ============================================================
-- Только читает. Перенос делает tbsh-promasters-2026.sql.

-- ---- 1. Сам турнир ----
-- published_at пустой — значит черновик, на сайте его не видно.

SELECT id, title, category_id, gender, bracket_type, draw_size, status,
       published_at AS опубликован, date_start
  FROM tournaments WHERE id = 'tbsh-promasters-2026';

-- ---- 2. Участники с посевами ----

SELECT r.seed_number AS посев, p.name AS игрок, r.status
  FROM tournament_registrations r
  JOIN players p ON p.id = r.player_id
 WHERE r.tournament_id = 'tbsh-promasters-2026'
 ORDER BY r.seed_number;

-- ---- 3. Круги: сколько сыграно ----
-- Пустых матчей в первых кругах быть не должно.

SELECT round_number AS круг,
       count(*) AS матчей,
       count(winner_id) AS сыграно,
       count(*) FILTER (WHERE player1_id IS NULL AND player2_id IS NULL) AS пустых
  FROM matches WHERE tournament_id = 'tbsh-promasters-2026'
 GROUP BY round_number ORDER BY round_number;

-- ---- 4. Все матчи по порядку ----

SELECT m.round_number AS круг, m.match_order AS №,
       p1.name AS игрок_1, p2.name AS игрок_2,
       w.name AS победитель, m.score AS счёт, m.status
  FROM matches m
  LEFT JOIN players p1 ON p1.id = m.player1_id
  LEFT JOIN players p2 ON p2.id = m.player2_id
  LEFT JOIN players w  ON w.id  = m.winner_id
 WHERE m.tournament_id = 'tbsh-promasters-2026'
 ORDER BY m.round_number, m.match_order;

-- ---- 5. Не осталось ли счетов, которым не нашлось матча ----
-- Пары из таблицы, которых нет в сетке: если такие есть — расстановка
-- нашего построителя разошлась с бумажной.

SELECT count(*) AS матчей_со_счётом
  FROM matches
 WHERE tournament_id = 'tbsh-promasters-2026' AND winner_id IS NOT NULL;
