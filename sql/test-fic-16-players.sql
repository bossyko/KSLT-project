-- ============================================
-- TEST: FIC bracket — 16 мужских игроков Masters
-- Bracket type: fic (Full Individual Consolation)
-- Draw size: 16, Court count: 2
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Создаём 16 игроков (ON CONFLICT — не дублируем)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('fic-smirnov-andrey',    'Андрей Смирнов',      'Andrey Smirnov',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 950, 18, 4, 2,  ARRAY['W','W','W','L','W'], ARRAY['champion'], false),
('fic-belov-dmitry',      'Дмитрий Белов',       'Dmitry Belov',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 880, 16, 5, 1,  ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('fic-kozlov-artem',      'Артём Козлов',        'Artem Kozlov',        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 820, 15, 6, 0,  ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('fic-novikov-sergey',    'Сергей Новиков',      'Sergey Novikov',      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 760, 14, 7, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('fic-volkov-maxim',      'Максим Волков',       'Maxim Volkov',        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 700, 13, 7, 2,  ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('fic-morozov-ivan',      'Иван Морозов',        'Ivan Morozov',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 650, 12, 8, 0,  ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
('fic-lebedev-nikita',    'Никита Лебедев',      'Nikita Lebedev',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 600, 11, 9, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('fic-sokolov-pavel',     'Павел Соколов',       'Pavel Sokolov',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 550, 10, 9, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('fic-fedorov-alexander', 'Александр Фёдоров',   'Alexander Fedorov',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 500, 9, 10, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('fic-egorov-kirill',     'Кирилл Егоров',       'Kirill Egorov',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 450, 8, 10, -1, ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], false),
('fic-petrov-roman',      'Роман Петров',        'Roman Petrov',        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 400, 8, 11, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('fic-ivanov-denis',      'Денис Иванов',        'Denis Ivanov',        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 350, 7, 11, 0,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('fic-kuznetsov-oleg',    'Олег Кузнецов',       'Oleg Kuznetsov',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 300, 6, 12, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('fic-semenov-timur',     'Тимур Семёнов',       'Timur Semenov',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 250, 5, 12, 2,  ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], false),
('fic-andreev-ruslan',    'Руслан Андреев',      'Ruslan Andreev',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 200, 4, 13, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('fic-alekseev-damir',    'Дамир Алексеев',      'Damir Alekseev',      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 150, 3, 14, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- 2. Создаём FIC-турнир (level = Категория 2 для очков)
INSERT INTO tournaments (
    id, title, title_en, description, description_en,
    location, location_en,
    category_id, status,
    date_start, date_end,
    registration_start, registration_end,
    max_participants, prize_fund, format,
    image,
    draw_size, bracket_type,
    court_count, match_duration, buffer_minutes, start_time,
    level_id,
    published_at
) VALUES (
    'fic-test-16-masters',
    'FIC Тест — Masters 16',
    'FIC Test — Masters 16',
    'Тестовый турнир FIC (олимпийская, все места). 16 игроков, каждый играет каждый раунд.',
    'Test FIC tournament (Full Individual Consolation). 16 players, everyone plays every round.',
    'Бишкек, Dordoi Tennis Club',
    'Bishkek, Dordoi Tennis Club',
    'men-masters',
    'registration_open',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '9 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '5 days',
    16,
    '50 000 сом',
    'singles',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80',
    16,
    'fic',
    2, 90, 15, '09:00',
    (SELECT id FROM tournament_levels WHERE sort_order = 2 LIMIT 1),
    NOW()
) ON CONFLICT (id) DO UPDATE SET published_at = COALESCE(tournaments.published_at, NOW());

-- 3. Регистрируем 16 игроков (approved, по убыванию очков → seed order)
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('fic-test-16-masters', 'fic-smirnov-andrey',    'approved', NOW() - INTERVAL '16 minutes'),
('fic-test-16-masters', 'fic-belov-dmitry',      'approved', NOW() - INTERVAL '15 minutes'),
('fic-test-16-masters', 'fic-kozlov-artem',      'approved', NOW() - INTERVAL '14 minutes'),
('fic-test-16-masters', 'fic-novikov-sergey',    'approved', NOW() - INTERVAL '13 minutes'),
('fic-test-16-masters', 'fic-volkov-maxim',      'approved', NOW() - INTERVAL '12 minutes'),
('fic-test-16-masters', 'fic-morozov-ivan',      'approved', NOW() - INTERVAL '11 minutes'),
('fic-test-16-masters', 'fic-lebedev-nikita',    'approved', NOW() - INTERVAL '10 minutes'),
('fic-test-16-masters', 'fic-sokolov-pavel',     'approved', NOW() - INTERVAL '9 minutes'),
('fic-test-16-masters', 'fic-fedorov-alexander', 'approved', NOW() - INTERVAL '8 minutes'),
('fic-test-16-masters', 'fic-egorov-kirill',     'approved', NOW() - INTERVAL '7 minutes'),
('fic-test-16-masters', 'fic-petrov-roman',      'approved', NOW() - INTERVAL '6 minutes'),
('fic-test-16-masters', 'fic-ivanov-denis',      'approved', NOW() - INTERVAL '5 minutes'),
('fic-test-16-masters', 'fic-kuznetsov-oleg',    'approved', NOW() - INTERVAL '4 minutes'),
('fic-test-16-masters', 'fic-semenov-timur',     'approved', NOW() - INTERVAL '3 minutes'),
('fic-test-16-masters', 'fic-andreev-ruslan',    'approved', NOW() - INTERVAL '2 minutes'),
('fic-test-16-masters', 'fic-alekseev-damir',    'approved', NOW() - INTERVAL '1 minutes')
ON CONFLICT DO NOTHING;

-- ============================================
-- CLEANUP (run separately if needed):
-- DELETE FROM tournament_registrations WHERE tournament_id = 'fic-test-16-masters';
-- DELETE FROM matches WHERE tournament_id = 'fic-test-16-masters';
-- DELETE FROM tournament_results WHERE tournament_id = 'fic-test-16-masters';
-- DELETE FROM tournaments WHERE id = 'fic-test-16-masters';
-- DELETE FROM players WHERE id LIKE 'fic-%';
-- ============================================

-- ============================================
-- EXPECTED после "Generate Draw" в админке:
--
-- Всего матчей: 32 (8 × 4 раунда)
-- Round FIC-R1: 8 матчей (M1-M8)
-- Round FIC-R2: 8 матчей (M1-M8)
-- Round FIC-R3: 8 матчей (M1-M8)
-- Round FIC-R4: 8 матчей (M1-M8)
--
-- 4 секции в админке:
-- 1. Основная сетка (1-2): R1:M1-8 → R2:M1-4 → R3:M1-2 → R4:M1 + За 3-4: R4:M5
-- 2. 5-8 место: R3:M5-6 → R4:M3 + За 7-8: R4:M7
-- 3. 9-12 место: R2:M5-8 → R3:M3-4 → R4:M2 + За 11-12: R4:M6
-- 4. 13-16 место: R3:M7-8 → R4:M4 + За 15-16: R4:M8
--
-- Проверка продвижения (R1 M1, match_order=1):
-- Winner → R2:M1 (p1 slot)
-- Loser  → R2:M5 (p1 slot)  [ceil(1/2) + 4 = 5]
--
-- Проверка продвижения (R1 M2, match_order=2):
-- Winner → R2:M1 (p2 slot)
-- Loser  → R2:M5 (p2 slot)
--
-- Финальный раунд bit-reversal (R4):
-- M1 (idx=0, bitrev=0) → места 1-2
-- M2 (idx=1, bitrev=4) → места 9-10
-- M3 (idx=2, bitrev=2) → места 5-6
-- M4 (idx=3, bitrev=6) → места 13-14
-- M5 (idx=4, bitrev=1) → места 3-4
-- M6 (idx=5, bitrev=5) → места 11-12
-- M7 (idx=6, bitrev=3) → места 7-8
-- M8 (idx=7, bitrev=7) → места 15-16
-- ============================================
