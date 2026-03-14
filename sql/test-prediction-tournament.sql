-- ============================================
-- TEST: Текущий турнир для проверки prediction bar
-- 8 игроков Pro-Masters, QF сыгран, SF/F предстоят
-- Run in Supabase SQL Editor
-- ============================================

-- 0. Убедимся что игроки существуют (из test-h2h-matches.sql)
-- Если ещё не запускали — сначала запустите test-h2h-matches.sql

-- 1. Cleanup (safe re-run)
DELETE FROM matches WHERE tournament_id = 'pred-test-march-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'pred-test-march-2026';
DELETE FROM tournaments WHERE id = 'pred-test-march-2026';

-- 2. Турнир: ongoing, текущие даты
INSERT INTO tournaments (
    id, title, title_en, title_kg,
    description, description_en, description_kg,
    location, location_en,
    category_id, status,
    date_start, date_end,
    registration_start, registration_end,
    draw_size, bracket_type,
    max_participants, prize_fund, format,
    image, published_at
) VALUES (
    'pred-test-march-2026',
    'KSLT March Masters 2026',
    'KSLT March Masters 2026',
    'KSLT Март Мастерс 2026',
    'Мартовский турнир Pro-Masters. Четвертьфиналы завершены, полуфиналы — сегодня!',
    'March Pro-Masters tournament. Quarterfinals complete, semifinals today!',
    'Март Pro-Masters мелдеши. Чейрек финалдар аяктады, жарым финалдар — бүгүн!',
    'Бишкек, Dordoi Tennis Club',
    'Bishkek, Dordoi Tennis Club',
    'men-promasters',
    'ongoing',
    '2026-03-12',
    '2026-03-14',
    '2026-03-01',
    '2026-03-10',
    8, 'single_elimination',
    8, '150 000 сом', 'singles',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80',
    NOW()
);

-- 3. Регистрации (все approved)
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('pred-test-march-2026', 'ivanov-alexey',    'approved', '2026-03-01 10:00:00+06'),
('pred-test-march-2026', 'petrov-maxim',     'approved', '2026-03-01 10:05:00+06'),
('pred-test-march-2026', 'kozlov-dmitry',    'approved', '2026-03-01 10:10:00+06'),
('pred-test-march-2026', 'asanov-timur',     'approved', '2026-03-01 10:15:00+06'),
('pred-test-march-2026', 'bakirov-ruslan',   'approved', '2026-03-01 10:20:00+06'),
('pred-test-march-2026', 'zhumaev-erlan',    'approved', '2026-03-01 10:25:00+06'),
('pred-test-march-2026', 'mambetov-daniyar', 'approved', '2026-03-01 10:30:00+06'),
('pred-test-march-2026', 'kravtsov-artem',   'approved', '2026-03-01 10:35:00+06');

-- 4. Матчи — QF completed, SF/F upcoming
INSERT INTO matches (tournament_id, player1_id, player2_id, score, winner_id, round, round_number, match_order, seed1, seed2, status, played_at) VALUES
-- QF1: [1] Иванов (2450) vs [8] Кравцов (1750) → Иванов wins
('pred-test-march-2026', 'ivanov-alexey', 'kravtsov-artem',   '6/1 6/2', 'ivanov-alexey', 'QF', 1, 1, 1, 8, 'completed', '2026-03-12 10:00:00+06'),
-- QF2: [4] Асанов (2180) vs [5] Бакиров (2050) → Асанов wins (tight match)
('pred-test-march-2026', 'asanov-timur',  'bakirov-ruslan',   '7/6 4/6 7/5', 'asanov-timur', 'QF', 1, 2, 4, 5, 'completed', '2026-03-12 10:00:00+06'),
-- QF3: [3] Козлов (2310) vs [6] Жумаев (1950) → Козлов wins
('pred-test-march-2026', 'kozlov-dmitry', 'zhumaev-erlan',    '6/3 6/4', 'kozlov-dmitry', 'QF', 1, 3, 3, 6, 'completed', '2026-03-12 12:00:00+06'),
-- QF4: [2] Петров (2380) vs [7] Мамбетов (1850) → Петров wins
('pred-test-march-2026', 'petrov-maxim',  'mambetov-daniyar', '6/2 6/3', 'petrov-maxim',  'QF', 1, 4, 2, 7, 'completed', '2026-03-12 12:00:00+06');

-- SF: upcoming (оба игрока известны → prediction покажется!)
INSERT INTO matches (tournament_id, player1_id, player2_id, round, round_number, match_order, seed1, seed2, status, scheduled_day, scheduled_time) VALUES
-- SF1: [1] Иванов (2450) vs [4] Асанов (2180) → prediction ~65-35
('pred-test-march-2026', 'ivanov-alexey', 'asanov-timur',  'SF', 2, 1, 1, 4, 'upcoming', '2026-03-13', '10:00'),
-- SF2: [3] Козлов (2310) vs [2] Петров (2380) → prediction ~48-52 (close!)
('pred-test-march-2026', 'kozlov-dmitry', 'petrov-maxim',  'SF', 2, 2, 3, 2, 'upcoming', '2026-03-13', '12:00');

-- Final: upcoming, TBD (оба игрока пустые → prediction НЕ покажется)
INSERT INTO matches (tournament_id, round, round_number, match_order, status, scheduled_day, scheduled_time) VALUES
('pred-test-march-2026', 'F', 3, 1, 'upcoming', '2026-03-14', '14:00');

-- 5. Матч за 3-е место: upcoming, TBD
INSERT INTO matches (tournament_id, round, round_number, match_order, status, scheduled_day, scheduled_time) VALUES
('pred-test-march-2026', '3RD', 3, 2, 'upcoming', '2026-03-14', '12:00');

-- ============================================
-- ПРОВЕРКА:
-- ============================================
SELECT 'Tournament:' as info, id, status, date_start, date_end FROM tournaments WHERE id = 'pred-test-march-2026';
SELECT 'Matches:' as info, round, player1_id, player2_id, status, score FROM matches WHERE tournament_id = 'pred-test-march-2026' ORDER BY round_number, match_order;
SELECT 'Registrations:' as info, count(*) as cnt FROM tournament_registrations WHERE tournament_id = 'pred-test-march-2026';

-- ============================================
-- ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
-- QF (4 матча) — completed, score видно, prediction НЕТ
-- SF1: Иванов vs Асанов — upcoming, prediction ~65/35 (Иванов фаворит)
-- SF2: Козлов vs Петров — upcoming, prediction ~48/52 (close match)
-- F: TBD vs TBD — upcoming, prediction НЕТ (нет игроков)
-- 3RD: TBD vs TBD — upcoming, prediction НЕТ
-- ============================================

-- CLEANUP (run separately):
-- DELETE FROM matches WHERE tournament_id = 'pred-test-march-2026';
-- DELETE FROM tournament_registrations WHERE tournament_id = 'pred-test-march-2026';
-- DELETE FROM tournaments WHERE id = 'pred-test-march-2026';
