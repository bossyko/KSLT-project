-- ============================================
-- DEMO: 3 турнира × 16 игроков (SE, FIC, Group Stage)
-- Категории: Challenger (SE), Masters (FIC), Futures (GS)
-- Run in Supabase SQL Editor
-- ============================================

-- =====================
-- 1. ИГРОКИ (48 штук — по 16 на турнир)
-- =====================

-- SE players (Challenger)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('demo-se-01', 'Азамат Токтогулов',   'Azamat Toktogulov',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 720, 14, 3, 2,  ARRAY['W','W','W','L','W'], ARRAY['champion'], false),
('demo-se-02', 'Бакыт Сыдыков',       'Bakyt Sydykov',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 680, 13, 4, 1,  ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('demo-se-03', 'Данияр Абдыкеримов',  'Daniyar Abdykerimov', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 640, 12, 5, 0,  ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('demo-se-04', 'Эрлан Жумабеков',     'Erlan Zhumabekov',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 600, 11, 5, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('demo-se-05', 'Нурбек Касымов',      'Nurbek Kasymov',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 560, 10, 6, 2,  ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-se-06', 'Тимур Исаков',        'Timur Isakov',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 520, 10, 7, 0,  ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
('demo-se-07', 'Алмаз Бектуров',      'Almaz Bekturov',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 480, 9, 7, -2,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-se-08', 'Руслан Омуралиев',    'Ruslan Omuraliev',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 440, 8, 8, 1,   ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-se-09', 'Марат Кадыров',       'Marat Kadyrov',       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 400, 8, 9, 0,   ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-se-10', 'Чынгыз Турдалиев',    'Chyngyz Turdaliev',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 360, 7, 9, -1,  ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], false),
('demo-se-11', 'Адилет Сатаров',      'Adilet Satarov',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 320, 7, 10, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-se-12', 'Кайрат Маматов',      'Kairat Mamatov',      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 280, 6, 10, 0,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-se-13', 'Жаныбек Усубалиев',   'Zhanybek Usubaliev',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 240, 5, 11, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('demo-se-14', 'Султан Эшматов',      'Sultan Eshmatov',     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 200, 5, 12, 2,  ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], false),
('demo-se-15', 'Арсен Боронбаев',     'Arsen Boronbaev',     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 160, 4, 12, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-se-16', 'Талант Асанов',       'Talant Asanov',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 120, 3, 13, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- FIC players (Masters) — reuse fic- prefix players from test-fic-16-players.sql
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('demo-fic-01', 'Андрей Смирнов',     'Andrey Smirnov',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 950, 18, 4, 2,  ARRAY['W','W','W','L','W'], ARRAY['champion'], false),
('demo-fic-02', 'Дмитрий Белов',      'Dmitry Belov',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 880, 16, 5, 1,  ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('demo-fic-03', 'Артём Козлов',       'Artem Kozlov',       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 820, 15, 6, 0,  ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('demo-fic-04', 'Сергей Новиков',     'Sergey Novikov',     'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 760, 14, 7, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('demo-fic-05', 'Максим Волков',      'Maxim Volkov',       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 700, 13, 7, 2,  ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-fic-06', 'Иван Морозов',       'Ivan Morozov',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 650, 12, 8, 0,  ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
('demo-fic-07', 'Никита Лебедев',     'Nikita Lebedev',     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 600, 11, 9, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-fic-08', 'Павел Соколов',      'Pavel Sokolov',      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 550, 10, 9, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-fic-09', 'Александр Фёдоров',  'Alexander Fedorov',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 500, 9, 10, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-fic-10', 'Кирилл Егоров',      'Kirill Egorov',      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 450, 8, 10, -1, ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], false),
('demo-fic-11', 'Роман Петров',       'Roman Petrov',       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 400, 8, 11, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-fic-12', 'Денис Иванов',       'Denis Ivanov',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 350, 7, 11, 0,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-fic-13', 'Олег Кузнецов',      'Oleg Kuznetsov',     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 300, 6, 12, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('demo-fic-14', 'Тимур Семёнов',      'Timur Semenov',      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 250, 5, 12, 2,  ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], false),
('demo-fic-15', 'Руслан Андреев',     'Ruslan Andreev',     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 200, 4, 13, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-fic-16', 'Дамир Алексеев',     'Damir Alekseev',     'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 150, 3, 14, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- Group Stage players (Futures)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('demo-gs-01', 'Айбек Калыков',       'Aibek Kalykov',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 480, 12, 4, 2,  ARRAY['W','W','W','L','W'], ARRAY['champion'], false),
('demo-gs-02', 'Бекзат Джумагулов',   'Bekzat Jumagulov',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 450, 11, 5, 1,  ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('demo-gs-03', 'Гани Сарыбаев',       'Gani Sarybaev',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 420, 10, 5, 0,  ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('demo-gs-04', 'Даулет Ибраимов',     'Daulet Ibraimov',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 390, 10, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('demo-gs-05', 'Элдияр Орозбаев',     'Eldiyar Orozbaev',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 360, 9, 6, 2,   ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-gs-06', 'Жаныш Келдибеков',    'Zhanysh Keldibekov', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 330, 8, 7, 0,   ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
('demo-gs-07', 'Исмаил Ташматов',     'Ismail Tashmatov',   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 300, 8, 8, -2,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-gs-08', 'Канат Тулегенов',     'Kanat Tulegenov',    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 270, 7, 8, 1,   ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-gs-09', 'Марлен Чотонов',      'Marlen Chotonov',    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 240, 7, 9, 0,   ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-gs-10', 'Нурлан Байгазиев',    'Nurlan Baigaziev',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 210, 6, 9, -1,  ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], false),
('demo-gs-11', 'Осмон Шералиев',      'Osmon Sheraliev',    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 180, 6, 10, 1,  ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('demo-gs-12', 'Рустам Алиев',        'Rustam Aliev',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 150, 5, 10, 0,  ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('demo-gs-13', 'Санжар Мамбетов',     'Sanzhar Mambetov',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 120, 4, 11, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('demo-gs-14', 'Улан Торобеков',      'Ulan Torobekov',     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 100, 4, 12, 2,  ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], false),
('demo-gs-15', 'Фарход Минбаев',      'Farkhod Minbaev',    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 80,  3, 12, 0,  ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('demo-gs-16', 'Хасан Джолдошев',     'Khasan Djoldoshev',  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 60,  2, 13, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;


-- =====================
-- 2. ТУРНИРЫ (3 штуки)
-- =====================

-- 2A. Single Elimination — Challenger
INSERT INTO tournaments (
    id, title, title_en, title_kg,
    description, description_en,
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
    'demo-se-challenger-16',
    'KSLT Demo Cup — Challenger',
    'KSLT Demo Cup — Challenger',
    'KSLT Demo Cup — Challenger',
    'Демо-турнир Single Elimination. 16 игроков, олимпийская система.',
    'Demo tournament Single Elimination. 16 players, knockout format.',
    'Бишкек, Dordoi Tennis Club',
    'Bishkek, Dordoi Tennis Club',
    'men-challenger',
    'registration_open',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '9 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '5 days',
    16,
    '30 000 сом',
    'singles',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80',
    16,
    'single_elimination',
    2, 90, 15, '09:00',
    (SELECT id FROM tournament_levels WHERE sort_order = 3 LIMIT 1),
    NOW()
) ON CONFLICT (id) DO UPDATE SET published_at = COALESCE(tournaments.published_at, NOW());

-- 2B. FIC — Masters
INSERT INTO tournaments (
    id, title, title_en, title_kg,
    description, description_en,
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
    'demo-fic-masters-16',
    'KSLT Masters Open — FIC',
    'KSLT Masters Open — FIC',
    'KSLT Masters Open — FIC',
    'Демо-турнир FIC (Full Individual Consolation). 16 игроков, каждый играет каждый раунд.',
    'Demo FIC tournament (Full Individual Consolation). 16 players, everyone plays every round.',
    'Бишкек, Tennis Park',
    'Bishkek, Tennis Park',
    'men-masters',
    'registration_open',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '8 days',
    16,
    '75 000 сом',
    'singles',
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80',
    16,
    'fic',
    3, 90, 15, '10:00',
    (SELECT id FROM tournament_levels WHERE sort_order = 2 LIMIT 1),
    NOW()
) ON CONFLICT (id) DO UPDATE SET published_at = COALESCE(tournaments.published_at, NOW());

-- 2C. Group Stage — Futures
INSERT INTO tournaments (
    id, title, title_en, title_kg,
    description, description_en,
    location, location_en,
    category_id, status,
    date_start, date_end,
    registration_start, registration_end,
    max_participants, prize_fund, format,
    image,
    draw_size, bracket_type,
    court_count, match_duration, buffer_minutes, start_time,
    level_id,
    group_count,
    published_at
) VALUES (
    'demo-gs-futures-16',
    'KSLT Futures League — Round Robin',
    'KSLT Futures League — Round Robin',
    'KSLT Futures League — Round Robin',
    'Демо-турнир групповой этап. 16 игроков, 4 группы по 4, плей-офф из топ-2.',
    'Demo Group Stage tournament. 16 players, 4 groups of 4, top-2 advance to playoffs.',
    'Бишкек, Sport Life',
    'Bishkek, Sport Life',
    'men-futures',
    'registration_open',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '16 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '12 days',
    16,
    '20 000 сом',
    'singles',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80',
    16,
    'group_stage',
    2, 60, 10, '09:00',
    (SELECT id FROM tournament_levels WHERE sort_order = 4 LIMIT 1),
    4,
    NOW()
) ON CONFLICT (id) DO UPDATE SET published_at = COALESCE(tournaments.published_at, NOW());


-- =====================
-- 3. РЕГИСТРАЦИИ (48 заявок — по 16 на турнир)
-- =====================

-- SE registrations
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('demo-se-challenger-16', 'demo-se-01', 'approved', NOW() - INTERVAL '16 minutes'),
('demo-se-challenger-16', 'demo-se-02', 'approved', NOW() - INTERVAL '15 minutes'),
('demo-se-challenger-16', 'demo-se-03', 'approved', NOW() - INTERVAL '14 minutes'),
('demo-se-challenger-16', 'demo-se-04', 'approved', NOW() - INTERVAL '13 minutes'),
('demo-se-challenger-16', 'demo-se-05', 'approved', NOW() - INTERVAL '12 minutes'),
('demo-se-challenger-16', 'demo-se-06', 'approved', NOW() - INTERVAL '11 minutes'),
('demo-se-challenger-16', 'demo-se-07', 'approved', NOW() - INTERVAL '10 minutes'),
('demo-se-challenger-16', 'demo-se-08', 'approved', NOW() - INTERVAL '9 minutes'),
('demo-se-challenger-16', 'demo-se-09', 'approved', NOW() - INTERVAL '8 minutes'),
('demo-se-challenger-16', 'demo-se-10', 'approved', NOW() - INTERVAL '7 minutes'),
('demo-se-challenger-16', 'demo-se-11', 'approved', NOW() - INTERVAL '6 minutes'),
('demo-se-challenger-16', 'demo-se-12', 'approved', NOW() - INTERVAL '5 minutes'),
('demo-se-challenger-16', 'demo-se-13', 'approved', NOW() - INTERVAL '4 minutes'),
('demo-se-challenger-16', 'demo-se-14', 'approved', NOW() - INTERVAL '3 minutes'),
('demo-se-challenger-16', 'demo-se-15', 'approved', NOW() - INTERVAL '2 minutes'),
('demo-se-challenger-16', 'demo-se-16', 'approved', NOW() - INTERVAL '1 minutes')
ON CONFLICT DO NOTHING;

-- FIC registrations
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('demo-fic-masters-16', 'demo-fic-01', 'approved', NOW() - INTERVAL '16 minutes'),
('demo-fic-masters-16', 'demo-fic-02', 'approved', NOW() - INTERVAL '15 minutes'),
('demo-fic-masters-16', 'demo-fic-03', 'approved', NOW() - INTERVAL '14 minutes'),
('demo-fic-masters-16', 'demo-fic-04', 'approved', NOW() - INTERVAL '13 minutes'),
('demo-fic-masters-16', 'demo-fic-05', 'approved', NOW() - INTERVAL '12 minutes'),
('demo-fic-masters-16', 'demo-fic-06', 'approved', NOW() - INTERVAL '11 minutes'),
('demo-fic-masters-16', 'demo-fic-07', 'approved', NOW() - INTERVAL '10 minutes'),
('demo-fic-masters-16', 'demo-fic-08', 'approved', NOW() - INTERVAL '9 minutes'),
('demo-fic-masters-16', 'demo-fic-09', 'approved', NOW() - INTERVAL '8 minutes'),
('demo-fic-masters-16', 'demo-fic-10', 'approved', NOW() - INTERVAL '7 minutes'),
('demo-fic-masters-16', 'demo-fic-11', 'approved', NOW() - INTERVAL '6 minutes'),
('demo-fic-masters-16', 'demo-fic-12', 'approved', NOW() - INTERVAL '5 minutes'),
('demo-fic-masters-16', 'demo-fic-13', 'approved', NOW() - INTERVAL '4 minutes'),
('demo-fic-masters-16', 'demo-fic-14', 'approved', NOW() - INTERVAL '3 minutes'),
('demo-fic-masters-16', 'demo-fic-15', 'approved', NOW() - INTERVAL '2 minutes'),
('demo-fic-masters-16', 'demo-fic-16', 'approved', NOW() - INTERVAL '1 minutes')
ON CONFLICT DO NOTHING;

-- Group Stage registrations
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('demo-gs-futures-16', 'demo-gs-01', 'approved', NOW() - INTERVAL '16 minutes'),
('demo-gs-futures-16', 'demo-gs-02', 'approved', NOW() - INTERVAL '15 minutes'),
('demo-gs-futures-16', 'demo-gs-03', 'approved', NOW() - INTERVAL '14 minutes'),
('demo-gs-futures-16', 'demo-gs-04', 'approved', NOW() - INTERVAL '13 minutes'),
('demo-gs-futures-16', 'demo-gs-05', 'approved', NOW() - INTERVAL '12 minutes'),
('demo-gs-futures-16', 'demo-gs-06', 'approved', NOW() - INTERVAL '11 minutes'),
('demo-gs-futures-16', 'demo-gs-07', 'approved', NOW() - INTERVAL '10 minutes'),
('demo-gs-futures-16', 'demo-gs-08', 'approved', NOW() - INTERVAL '9 minutes'),
('demo-gs-futures-16', 'demo-gs-09', 'approved', NOW() - INTERVAL '8 minutes'),
('demo-gs-futures-16', 'demo-gs-10', 'approved', NOW() - INTERVAL '7 minutes'),
('demo-gs-futures-16', 'demo-gs-11', 'approved', NOW() - INTERVAL '6 minutes'),
('demo-gs-futures-16', 'demo-gs-12', 'approved', NOW() - INTERVAL '5 minutes'),
('demo-gs-futures-16', 'demo-gs-13', 'approved', NOW() - INTERVAL '4 minutes'),
('demo-gs-futures-16', 'demo-gs-14', 'approved', NOW() - INTERVAL '3 minutes'),
('demo-gs-futures-16', 'demo-gs-15', 'approved', NOW() - INTERVAL '2 minutes'),
('demo-gs-futures-16', 'demo-gs-16', 'approved', NOW() - INTERVAL '1 minutes')
ON CONFLICT DO NOTHING;


-- ============================================
-- ГОТОВО! Далее в админке:
--
-- 1. Открой каждый турнир → вкладка «Сетка»
-- 2. Нажми «Сгенерировать жеребьёвку»
-- 3. Сетки будут сгенерированы автоматически (ITF seeding)
--
-- Турниры:
-- • KSLT Demo Cup — Challenger (SE, 16 игроков)
-- • KSLT Masters Open — FIC (FIC, 16 игроков)
-- • KSLT Futures League — Round Robin (Group Stage, 4 группы × 4)
-- ============================================


-- ============================================
-- CLEANUP (run separately if needed):
-- DELETE FROM tournament_registrations WHERE tournament_id LIKE 'demo-%';
-- DELETE FROM matches WHERE tournament_id LIKE 'demo-%';
-- DELETE FROM tournament_results WHERE tournament_id LIKE 'demo-%';
-- DELETE FROM tournaments WHERE id LIKE 'demo-%';
-- DELETE FROM players WHERE id LIKE 'demo-%';
-- ============================================
