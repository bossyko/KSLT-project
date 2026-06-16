-- ============================================
-- TEST: H2H matches — тестовые матчи для профиля игрока
-- 8 игроков Pro-Masters, 2 завершённых турнира, ~20 матчей
-- Несколько повторных встреч для тестирования H2H модала
-- Run in Supabase SQL Editor
-- ============================================

-- 0. Категория (если нет)
INSERT INTO categories (id, name, name_en, name_kg, gender, sort_order) VALUES
('men-promasters', 'Pro-Masters', 'Pro-Masters', 'Pro-Masters', 'men', 1)
ON CONFLICT (id) DO NOTHING;

-- 1. Игроки (ON CONFLICT — не дублируем)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('ivanov-alexey',    'Алексей Иванов',    'Alexey Ivanov',    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2450, 18, 3, 2,  ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], true),
('petrov-maxim',     'Максим Петров',     'Maxim Petrov',     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2380, 16, 5, -1, ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('kozlov-dmitry',    'Дмитрий Козлов',    'Dmitry Kozlov',    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-promasters', 2310, 15, 4, 1,  ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('asanov-timur',     'Тимур Асанов',      'Timur Asanov',     'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2180, 14, 6, 0,  ARRAY['L','W','W','W','L'], ARRAY[]::TEXT[], true),
('bakirov-ruslan',   'Руслан Бакиров',    'Ruslan Bakirov',   'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-promasters', 2050, 13, 5, 3,  ARRAY['W','W','W','W','L'], ARRAY['streak'], false),
('zhumaev-erlan',    'Эрлан Жумаев',      'Erlan Zhumaev',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1950, 12, 7, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('mambetov-daniyar', 'Данияр Мамбетов',   'Daniyar Mambetov', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1850, 11, 8, 1,  ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('kravtsov-artem',   'Артём Кравцов',     'Artem Kravtsov',   'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1750, 10, 9, 0,  ARRAY['L','W','L','W','L'], ARRAY['newbie'], false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  photo = EXCLUDED.photo,
  category_id = EXCLUDED.category_id,
  points = EXCLUDED.points,
  wins = EXCLUDED.wins,
  losses = EXCLUDED.losses;

-- 2. Турниры (2 завершённых)
INSERT INTO tournaments (
    id, title, title_en, title_kg, description, description_en,
    location, location_en,
    category_id, status,
    date_start, date_end,
    draw_size, bracket_type,
    max_participants, prize_fund, format,
    image,
    published_at
) VALUES
(
    'h2h-spring-open-2026',
    'KSLT Spring Open 2026',
    'KSLT Spring Open 2026',
    'KSLT Жазгы Ачык 2026',
    'Весенний турнир Pro-Masters',
    'Spring Pro-Masters tournament',
    'Бишкек, Dordoi Tennis Club',
    'Bishkek, Dordoi Tennis Club',
    'men-promasters',
    'completed',
    '2026-02-15',
    '2026-02-17',
    8, 'single_elimination',
    8, '100 000 сом', 'singles',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80',
    NOW()
),
(
    'h2h-winter-cup-2025',
    'Winter Cup 2025',
    'Winter Cup 2025',
    'Кышкы Кубок 2025',
    'Зимний кубок Pro-Masters',
    'Winter Pro-Masters Cup',
    'Бишкек, Tennis Center KG',
    'Bishkek, Tennis Center KG',
    'men-promasters',
    'completed',
    '2025-12-10',
    '2025-12-12',
    8, 'single_elimination',
    8, '80 000 сом', 'singles',
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET status = 'completed';

-- 3. Регистрации (approved = участвовали в сетке)
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
-- Spring Open 2026
('h2h-spring-open-2026', 'ivanov-alexey',    'approved', '2026-02-01 10:00:00+06'),
('h2h-spring-open-2026', 'petrov-maxim',     'approved', '2026-02-01 10:05:00+06'),
('h2h-spring-open-2026', 'kozlov-dmitry',    'approved', '2026-02-01 10:10:00+06'),
('h2h-spring-open-2026', 'asanov-timur',     'approved', '2026-02-01 10:15:00+06'),
('h2h-spring-open-2026', 'bakirov-ruslan',   'approved', '2026-02-01 10:20:00+06'),
('h2h-spring-open-2026', 'zhumaev-erlan',    'approved', '2026-02-01 10:25:00+06'),
('h2h-spring-open-2026', 'mambetov-daniyar', 'approved', '2026-02-01 10:30:00+06'),
('h2h-spring-open-2026', 'kravtsov-artem',   'approved', '2026-02-01 10:35:00+06'),
-- Winter Cup 2025
('h2h-winter-cup-2025', 'ivanov-alexey',    'approved', '2025-11-25 10:00:00+06'),
('h2h-winter-cup-2025', 'petrov-maxim',     'approved', '2025-11-25 10:05:00+06'),
('h2h-winter-cup-2025', 'kozlov-dmitry',    'approved', '2025-11-25 10:10:00+06'),
('h2h-winter-cup-2025', 'asanov-timur',     'approved', '2025-11-25 10:15:00+06'),
('h2h-winter-cup-2025', 'bakirov-ruslan',   'approved', '2025-11-25 10:20:00+06'),
('h2h-winter-cup-2025', 'zhumaev-erlan',    'approved', '2025-11-25 10:25:00+06'),
('h2h-winter-cup-2025', 'mambetov-daniyar', 'approved', '2025-11-25 10:30:00+06'),
('h2h-winter-cup-2025', 'kravtsov-artem',   'approved', '2025-11-25 10:35:00+06')
ON CONFLICT DO NOTHING;

-- 4. Матчи — Spring Open 2026 (QF → SF → F)
-- Score format: 6/4 7/5 (player1 games / player2 games per set)

-- Quarterfinals (Round 1)
INSERT INTO matches (tournament_id, player1_id, player2_id, score, winner_id, round, round_number, match_order, status, played_at) VALUES
-- QF1: Иванов vs Кравцов → Иванов побеждает
('h2h-spring-open-2026', 'ivanov-alexey', 'kravtsov-artem',   '6/2 6/3',     'ivanov-alexey',    'QF', 1, 1, 'completed', '2026-02-15 10:00:00+06'),
-- QF2: Петров vs Мамбетов → Петров побеждает
('h2h-spring-open-2026', 'petrov-maxim',  'mambetov-daniyar', '7/5 6/4',     'petrov-maxim',     'QF', 1, 2, 'completed', '2026-02-15 10:00:00+06'),
-- QF3: Козлов vs Жумаев → Козлов побеждает в 3 сетах
('h2h-spring-open-2026', 'kozlov-dmitry', 'zhumaev-erlan',    '6/4 3/6 7/5', 'kozlov-dmitry',    'QF', 1, 3, 'completed', '2026-02-15 12:00:00+06'),
-- QF4: Асанов vs Бакиров → Бакиров побеждает
('h2h-spring-open-2026', 'asanov-timur',  'bakirov-ruslan',   '4/6 5/7',     'bakirov-ruslan',   'QF', 1, 4, 'completed', '2026-02-15 12:00:00+06'),

-- Semifinals (Round 2)
-- SF1: Иванов vs Петров → Иванов побеждает (H2H матч #1)
('h2h-spring-open-2026', 'ivanov-alexey', 'petrov-maxim',     '6/4 7/6(7-5)', 'ivanov-alexey',   'SF', 2, 1, 'completed', '2026-02-16 10:00:00+06'),
-- SF2: Козлов vs Бакиров → Козлов побеждает
('h2h-spring-open-2026', 'kozlov-dmitry', 'bakirov-ruslan',   '6/3 6/4',     'kozlov-dmitry',    'SF', 2, 2, 'completed', '2026-02-16 12:00:00+06'),

-- Final (Round 3)
-- F: Иванов vs Козлов → Иванов побеждает (чемпион)
('h2h-spring-open-2026', 'ivanov-alexey', 'kozlov-dmitry',    '6/4 7/5',     'ivanov-alexey',    'F',  3, 1, 'completed', '2026-02-17 14:00:00+06');

-- 5. Матчи — Winter Cup 2025 (QF → SF → F)
INSERT INTO matches (tournament_id, player1_id, player2_id, score, winner_id, round, round_number, match_order, status, played_at) VALUES
-- QF1: Иванов vs Жумаев → Иванов
('h2h-winter-cup-2025', 'ivanov-alexey', 'zhumaev-erlan',    '6/1 6/3',     'ivanov-alexey',    'QF', 1, 1, 'completed', '2025-12-10 10:00:00+06'),
-- QF2: Петров vs Кравцов → Петров
('h2h-winter-cup-2025', 'petrov-maxim',  'kravtsov-artem',   '6/4 6/2',     'petrov-maxim',     'QF', 1, 2, 'completed', '2025-12-10 10:00:00+06'),
-- QF3: Козлов vs Мамбетов → Мамбетов upset!
('h2h-winter-cup-2025', 'kozlov-dmitry', 'mambetov-daniyar', '4/6 6/7(5-7)', 'mambetov-daniyar','QF', 1, 3, 'completed', '2025-12-10 12:00:00+06'),
-- QF4: Асанов vs Бакиров → Асанов
('h2h-winter-cup-2025', 'asanov-timur',  'bakirov-ruslan',   '7/6(7-4) 6/3', 'asanov-timur',    'QF', 1, 4, 'completed', '2025-12-10 12:00:00+06'),

-- SF1: Иванов vs Петров → Петров побеждает (H2H матч #2 — реванш!)
('h2h-winter-cup-2025', 'ivanov-alexey', 'petrov-maxim',     '6/7(5-7) 4/6', 'petrov-maxim',    'SF', 2, 1, 'completed', '2025-12-11 10:00:00+06'),
-- SF2: Мамбетов vs Асанов → Асанов
('h2h-winter-cup-2025', 'mambetov-daniyar', 'asanov-timur',  '3/6 4/6',     'asanov-timur',     'SF', 2, 2, 'completed', '2025-12-11 12:00:00+06'),

-- F: Петров vs Асанов → Петров (чемпион Winter Cup)
('h2h-winter-cup-2025', 'petrov-maxim',  'asanov-timur',     '6/4 3/6 7/5', 'petrov-maxim',     'F',  3, 1, 'completed', '2025-12-12 14:00:00+06');

-- 6. Дополнительные матчи — отдельные встречи для H2H глубины
-- Ещё 6 матчей Иванов vs Петров (вне турниров) + другие пары
INSERT INTO matches (player1_id, player2_id, score, winner_id, round, status, played_at) VALUES
-- Иванов vs Петров: ещё 4 матча (итого H2H будет 2+4=6)
('ivanov-alexey', 'petrov-maxim',  '6/3 6/4',      'ivanov-alexey', 'friendly', 'completed', '2026-01-10 14:00:00+06'),
('petrov-maxim',  'ivanov-alexey', '6/4 7/5',      'petrov-maxim',  'friendly', 'completed', '2026-01-20 14:00:00+06'),
('ivanov-alexey', 'petrov-maxim',  '7/5 4/6 6/3',  'ivanov-alexey', 'friendly', 'completed', '2026-02-05 14:00:00+06'),
('petrov-maxim',  'ivanov-alexey', '6/7(4-7) 6/4 7/6(7-5)', 'petrov-maxim', 'friendly', 'completed', '2025-11-15 14:00:00+06'),

-- Козлов vs Асанов: 3 матча
('kozlov-dmitry', 'asanov-timur',  '6/4 6/3',      'kozlov-dmitry', 'friendly', 'completed', '2026-01-05 12:00:00+06'),
('asanov-timur',  'kozlov-dmitry', '7/5 6/7(5-7) 6/4', 'asanov-timur', 'friendly', 'completed', '2026-01-25 12:00:00+06'),
('kozlov-dmitry', 'asanov-timur',  '6/2 6/1',      'kozlov-dmitry', 'friendly', 'completed', '2025-12-20 12:00:00+06'),

-- Бакиров vs Жумаев: 2 матча
('bakirov-ruslan', 'zhumaev-erlan', '6/3 7/5',     'bakirov-ruslan', 'friendly', 'completed', '2026-02-01 10:00:00+06'),
('zhumaev-erlan',  'bakirov-ruslan', '6/4 4/6 7/6(7-3)', 'zhumaev-erlan', 'friendly', 'completed', '2026-01-15 10:00:00+06');

-- ============================================
-- ИТОГО:
-- 7 матчей (Spring Open) + 7 матчей (Winter Cup) + 9 отдельных = 23 матча
-- Иванов vs Петров: 6 матчей (3-3 — идеальный H2H тест)
-- Козлов vs Асанов: 3 матча (2-1)
-- Бакиров vs Жумаев: 2 матча (1-1)
-- ============================================

-- ============================================
-- CLEANUP (run separately if needed):
-- DELETE FROM matches WHERE tournament_id IN ('h2h-spring-open-2026', 'h2h-winter-cup-2025');
-- DELETE FROM matches WHERE round = 'friendly' AND player1_id IN ('ivanov-alexey','petrov-maxim','kozlov-dmitry','asanov-timur','bakirov-ruslan','zhumaev-erlan');
-- DELETE FROM tournament_registrations WHERE tournament_id IN ('h2h-spring-open-2026', 'h2h-winter-cup-2025');
-- DELETE FROM tournaments WHERE id IN ('h2h-spring-open-2026', 'h2h-winter-cup-2025');
-- ============================================
