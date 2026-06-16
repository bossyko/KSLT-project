-- ============================================
-- CLEANUP + RE-INSERT: чистые тестовые матчи (без дублей)
-- Run in Supabase SQL Editor (одним разом)
-- ============================================

-- 1. Удаляем ВСЕ старые тестовые матчи
DELETE FROM matches WHERE tournament_id IN ('h2h-spring-open-2026', 'h2h-winter-cup-2025');
DELETE FROM matches WHERE round = 'friendly' AND (
  player1_id IN ('ivanov-alexey','petrov-maxim','kozlov-dmitry','asanov-timur','bakirov-ruslan','zhumaev-erlan')
  OR player2_id IN ('ivanov-alexey','petrov-maxim','kozlov-dmitry','asanov-timur','bakirov-ruslan','zhumaev-erlan')
);

-- 2. Spring Open 2026 (7 матчей)
INSERT INTO matches (tournament_id, player1_id, player2_id, score, winner_id, round, round_number, match_order, status, played_at) VALUES
('h2h-spring-open-2026', 'ivanov-alexey', 'kravtsov-artem',   '6/2 6/3',      'ivanov-alexey',  'QF', 1, 1, 'completed', '2026-02-15 10:00:00+06'),
('h2h-spring-open-2026', 'petrov-maxim',  'mambetov-daniyar', '7/5 6/4',      'petrov-maxim',   'QF', 1, 2, 'completed', '2026-02-15 10:00:00+06'),
('h2h-spring-open-2026', 'kozlov-dmitry', 'zhumaev-erlan',    '6/4 3/6 7/5',  'kozlov-dmitry',  'QF', 1, 3, 'completed', '2026-02-15 12:00:00+06'),
('h2h-spring-open-2026', 'asanov-timur',  'bakirov-ruslan',   '4/6 5/7',      'bakirov-ruslan', 'QF', 1, 4, 'completed', '2026-02-15 12:00:00+06'),
('h2h-spring-open-2026', 'ivanov-alexey', 'petrov-maxim',     '6/4 7/6(7-5)', 'ivanov-alexey',  'SF', 2, 1, 'completed', '2026-02-16 10:00:00+06'),
('h2h-spring-open-2026', 'kozlov-dmitry', 'bakirov-ruslan',   '6/3 6/4',      'kozlov-dmitry',  'SF', 2, 2, 'completed', '2026-02-16 12:00:00+06'),
('h2h-spring-open-2026', 'ivanov-alexey', 'kozlov-dmitry',    '6/4 7/5',      'ivanov-alexey',  'F',  3, 1, 'completed', '2026-02-17 14:00:00+06');

-- 3. Winter Cup 2025 (7 матчей)
INSERT INTO matches (tournament_id, player1_id, player2_id, score, winner_id, round, round_number, match_order, status, played_at) VALUES
('h2h-winter-cup-2025', 'ivanov-alexey', 'zhumaev-erlan',      '6/1 6/3',       'ivanov-alexey',    'QF', 1, 1, 'completed', '2025-12-10 10:00:00+06'),
('h2h-winter-cup-2025', 'petrov-maxim',  'kravtsov-artem',     '6/4 6/2',       'petrov-maxim',     'QF', 1, 2, 'completed', '2025-12-10 10:00:00+06'),
('h2h-winter-cup-2025', 'kozlov-dmitry', 'mambetov-daniyar',   '4/6 6/7(5-7)',  'mambetov-daniyar', 'QF', 1, 3, 'completed', '2025-12-10 12:00:00+06'),
('h2h-winter-cup-2025', 'asanov-timur',  'bakirov-ruslan',     '7/6(7-4) 6/3',  'asanov-timur',     'QF', 1, 4, 'completed', '2025-12-10 12:00:00+06'),
('h2h-winter-cup-2025', 'ivanov-alexey', 'petrov-maxim',       '6/7(5-7) 4/6',  'petrov-maxim',     'SF', 2, 1, 'completed', '2025-12-11 10:00:00+06'),
('h2h-winter-cup-2025', 'mambetov-daniyar', 'asanov-timur',    '3/6 4/6',       'asanov-timur',     'SF', 2, 2, 'completed', '2025-12-11 12:00:00+06'),
('h2h-winter-cup-2025', 'petrov-maxim',  'asanov-timur',       '6/4 3/6 7/5',   'petrov-maxim',     'F',  3, 1, 'completed', '2025-12-12 14:00:00+06');

-- 4. Дружеские матчи (9 матчей)
INSERT INTO matches (player1_id, player2_id, score, winner_id, round, status, played_at) VALUES
('ivanov-alexey', 'petrov-maxim',   '6/3 6/4',               'ivanov-alexey',  'friendly', 'completed', '2026-01-10 14:00:00+06'),
('petrov-maxim',  'ivanov-alexey',  '6/4 7/5',               'petrov-maxim',   'friendly', 'completed', '2026-01-20 14:00:00+06'),
('ivanov-alexey', 'petrov-maxim',   '7/5 4/6 6/3',           'ivanov-alexey',  'friendly', 'completed', '2026-02-05 14:00:00+06'),
('petrov-maxim',  'ivanov-alexey',  '6/7(4-7) 6/4 7/6(7-5)', 'petrov-maxim',   'friendly', 'completed', '2025-11-15 14:00:00+06'),
('kozlov-dmitry', 'asanov-timur',   '6/4 6/3',               'kozlov-dmitry',  'friendly', 'completed', '2026-01-05 12:00:00+06'),
('asanov-timur',  'kozlov-dmitry',  '7/5 6/7(5-7) 6/4',      'asanov-timur',   'friendly', 'completed', '2026-01-25 12:00:00+06'),
('kozlov-dmitry', 'asanov-timur',   '6/2 6/1',               'kozlov-dmitry',  'friendly', 'completed', '2025-12-20 12:00:00+06'),
('bakirov-ruslan', 'zhumaev-erlan', '6/3 7/5',               'bakirov-ruslan', 'friendly', 'completed', '2026-02-01 10:00:00+06'),
('zhumaev-erlan',  'bakirov-ruslan', '6/4 4/6 7/6(7-3)',      'zhumaev-erlan',  'friendly', 'completed', '2026-01-15 10:00:00+06');

-- Проверка:
SELECT 'Total matches:' as info, count(*) as cnt FROM matches
WHERE player1_id IN ('ivanov-alexey','petrov-maxim','kozlov-dmitry','asanov-timur','bakirov-ruslan','zhumaev-erlan','mambetov-daniyar','kravtsov-artem')
   OR player2_id IN ('ivanov-alexey','petrov-maxim','kozlov-dmitry','asanov-timur','bakirov-ruslan','zhumaev-erlan','mambetov-daniyar','kravtsov-artem');
