-- ============================================================
-- Сетка «все места»: проверка после пересборки
-- ============================================================
-- Только читает. Правку делают fic-advance-by-round.sql и fic-rebuild.sql.

-- ---- 1. Куда попали проигравшие каждого круга ----
-- Для сетки 32 должно быть: 1-й круг → 17-32, 2-й → 9-16,
-- 3-й → 5-8, 4-й → матч за третье место.

WITH сетка AS (
    SELECT count(*) * 2 AS размер FROM matches
     WHERE tournament_id = 'tbsh-promasters-2026' AND round_number = 1
),
проигравшие AS (
    SELECT m.round_number AS круг,
           CASE WHEN m.winner_id = m.player1_id THEN m.player2_id ELSE m.player1_id END AS кто
      FROM matches m
     WHERE m.tournament_id = 'tbsh-promasters-2026'
       AND m.winner_id IS NOT NULL
       AND m.player1_id IS NOT NULL AND m.player2_id IS NOT NULL
)
SELECT п.круг AS проиграл_в_круге,
       count(*) AS человек,
       string_agg(DISTINCT (
           SELECT min(m2.round_number || ':' || m2.match_order)
             FROM matches m2
            WHERE m2.tournament_id = 'tbsh-promasters-2026'
              AND m2.round_number = п.круг + 1
              AND (m2.player1_id = п.кто OR m2.player2_id = п.кто)
       ), ', ') AS куда_попали
  FROM проигравшие п
 GROUP BY п.круг
 ORDER BY п.круг;

-- ---- 2. Матч за третье место ----

SELECT p1.name AS игрок_1, p2.name AS игрок_2, m.score, m.status
  FROM matches m
  LEFT JOIN players p1 ON p1.id = m.player1_id
  LEFT JOIN players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = 'tbsh-promasters-2026'
   AND m.round_number = 5 AND m.match_order = 2;

-- ---- 3. Сколько людей в каждом круге ----
-- Пустых клеток в кругах, до которых дошли, быть не должно.

SELECT round_number AS круг,
       count(*) AS матчей,
       count(player1_id) + count(player2_id) AS занято_мест,
       count(winner_id) AS сыграно
  FROM matches WHERE tournament_id = 'tbsh-promasters-2026'
 GROUP BY round_number ORDER BY round_number;

-- ---- 4. Не потерялся ли кто ----
-- Каждый участник обязан быть хоть в одном матче каждого круга,
-- до которого он дошёл.

SELECT p.name AS игрок, count(DISTINCT m.round_number) AS кругов_сыграл
  FROM tournament_registrations r
  JOIN players p ON p.id = r.player_id
  LEFT JOIN matches m ON m.tournament_id = r.tournament_id
       AND (m.player1_id = r.player_id OR m.player2_id = r.player_id)
 WHERE r.tournament_id = 'tbsh-promasters-2026'
 GROUP BY p.name
 ORDER BY кругов_сыграл, p.name;
