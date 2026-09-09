-- ============================================================
-- Проверка переноса турниров ТБШ 2026
-- ============================================================
--
-- Только читает. Запускать после файлов tbsh-*-2026.sql, чтобы убедиться,
-- что перенеслось столько людей и пар, сколько нарисовано в таблице.

-- Сколько участников и какая сетка у каждого турнира
SELECT t.id AS турнир, t.category_id AS категория, t.gender AS пол,
       t.draw_size AS сетка, t.status AS состояние,
       count(r.player_id) AS заявлено
  FROM tournaments t
  LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
 WHERE t.id LIKE 'tbsh-%-2026'
 GROUP BY t.id, t.category_id, t.gender, t.draw_size, t.status
 ORDER BY t.id;

-- Первый круг: сколько пар, сколько проходов без соперника
SELECT tournament_id AS турнир,
       count(*) AS клеток,
       count(*) FILTER (WHERE player1_id IS NOT NULL AND player2_id IS NOT NULL) AS пар,
       count(*) FILTER (WHERE (player1_id IS NULL) <> (player2_id IS NULL)) AS без_соперника,
       count(*) FILTER (WHERE player1_id IS NULL AND player2_id IS NULL) AS пустых
  FROM matches
 WHERE tournament_id LIKE 'tbsh-%-2026' AND round_number = 1
 GROUP BY tournament_id ORDER BY tournament_id;

-- Все круги на месте и пусты, кроме первого
SELECT tournament_id AS турнир, round_number AS круг, count(*) AS клеток,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches
 WHERE tournament_id LIKE 'tbsh-%-2026'
 GROUP BY tournament_id, round_number ORDER BY tournament_id, round_number;

-- Никто не попал в сетку мимо заявки
SELECT m.tournament_id AS турнир, p.id AS игрок, p.name AS имя
  FROM matches m
  JOIN players p ON p.id IN (m.player1_id, m.player2_id)
 WHERE m.tournament_id LIKE 'tbsh-%-2026'
   AND NOT EXISTS (SELECT 1 FROM tournament_registrations r
                    WHERE r.tournament_id = m.tournament_id AND r.player_id = p.id);

-- Пол участников совпадает с полом турнира
SELECT t.id AS турнир, p.name AS имя, p.gender AS пол_игрока
  FROM tournament_registrations r
  JOIN tournaments t ON t.id = r.tournament_id
  JOIN players p ON p.id = r.player_id
 WHERE t.id LIKE 'tbsh-%-2026' AND p.gender IS DISTINCT FROM t.gender;
