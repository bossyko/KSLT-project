-- ============================================
-- 32 мужских игрока Masters + регистрация на турнир
-- Tournament ID: 0204e784-e449-410b-b0e2-502704212ba9
-- Category: men-masters
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Создаём 32 игрока
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, ntrp_rating, is_online) VALUES
('mm-asanov-azamat',      'Азамат Асанов',         'Azamat Asanov',         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1200, 18, 4, 3, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], 5.5, false),
('mm-toktogulov-bakyt',   'Бакыт Токтогулов',      'Bakyt Toktogulov',      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1150, 17, 5, 1, ARRAY['W','L','W','W','W'], ARRAY['streak'], 5.0, false),
('mm-beishenaliev-damir', 'Дамир Бейшеналиев',     'Damir Beishenaliev',    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1100, 16, 5, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], 5.0, false),
('mm-sultanov-erkin',     'Эркин Султанов',        'Erkin Sultanov',        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1050, 15, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], 4.5, false),
('mm-orozbekov-zhanybek', 'Жаныбек Орозбеков',     'Zhanybek Orozbekov',    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1000, 14, 7, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], 4.5, false),
('mm-ibraev-ilyas',       'Ильяс Ибраев',          'Ilyas Ibraev',          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 960, 13, 7, 0, ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], 4.5, false),
('mm-kalykov-kanat',      'Канат Калыков',          'Kanat Kalykov',         'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 920, 12, 8, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], 4.0, false),
('mm-mamytov-marat',      'Марат Мамытов',          'Marat Mamytov',         'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 880, 12, 8, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], 4.0, false),
('mm-nurgaliev-nurlan',   'Нурлан Нургалиев',      'Nurlan Nurgaliev',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 840, 11, 9, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], 4.0, false),
('mm-omurbekov-ruslan',   'Руслан Омурбеков',      'Ruslan Omurbekov',      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 800, 10, 9, -1, ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], 4.0, false),
('mm-tursunov-sanzhar',   'Санжар Турсунов',       'Sanzhar Tursunov',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 760, 10, 10, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], 3.5, false),
('mm-usenov-timur',       'Тимур Усенов',          'Timur Usenov',          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 720, 9, 10, 0, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], 3.5, false),
('mm-abdyldaev-ulan',     'Улан Абдылдаев',        'Ulan Abdyldaev',        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 680, 9, 11, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], 3.5, false),
('mm-zhoroev-chyngyz',    'Чынгыз Жороев',         'Chyngyz Zhoroev',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 640, 8, 11, 2, ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], 3.5, false),
('mm-kalmurzaev-eldar',   'Эльдар Калмурзаев',     'Eldar Kalmurzaev',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 600, 8, 12, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], 3.5, false),
('mm-sadykov-aibek',      'Айбек Садыков',          'Aibek Sadykov',         'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 560, 7, 12, -1, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], 3.0, false),
('mm-djumaev-bolot',      'Болот Джумаев',          'Bolot Djumaev',         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 530, 7, 13, 1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-isakov-daniyar',     'Данияр Исаков',          'Daniyar Isakov',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 500, 6, 13, 0, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], 3.0, false),
('mm-tentimishev-esen',   'Эсен Тентимишев',       'Esen Tentimishev',      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 470, 6, 13, -2, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-moldoev-kuban',      'Кубан Молдоев',          'Kuban Moldoev',         'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 440, 5, 14, 0, ARRAY['W','L','L','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-shamshiev-mirlan',   'Мирлан Шамшиев',        'Mirlan Shamshiev',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 410, 5, 14, 1, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-aitmatov-almaz',     'Алмаз Айтматов',        'Almaz Aitmatov',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 380, 4, 14, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-dzhunusov-seyit',    'Сейит Джунусов',        'Seyit Dzhunusov',       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 350, 4, 15, 0, ARRAY['L','W','L','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-osmonov-talant',     'Талант Осмонов',        'Talant Osmonov',        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 320, 3, 15, -1, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-kudaibergenov-nurbek','Нурбек Кудайбергенов', 'Nurbek Kudaibergenov',  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 290, 3, 15, 0, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-turduev-adilet',     'Адилет Турдуев',        'Adilet Turduev',        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 260, 3, 16, 1, ARRAY['W','L','L','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-junusov-maksat',     'Максат Жунусов',        'Maksat Junusov',        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 230, 2, 16, -1, ARRAY['L','W','L','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-eshmatov-sultan',    'Султан Эшматов',        'Sultan Eshmatov',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 200, 2, 16, 0, ARRAY['L','L','L','L','W'], ARRAY[]::TEXT[], 3.0, false),
('mm-mamatov-arsen',      'Арсен Маматов',          'Arsen Mamatov',         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 180, 1, 17, -1, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-bakirov-manas',      'Манас Бакиров',          'Manas Bakirov',         'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 150, 1, 17, 0, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-saralaev-bektur',    'Бектур Саралаев',       'Bektur Saralaev',       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 120, 0, 18, -2, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], 3.0, false),
('mm-ermekbaev-argen',    'Арген Эрмекбаев',       'Argen Ermekbaev',       'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 100, 0, 18, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], 3.0, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Регистрация всех 32 на турнир (approved, по времени)
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-asanov-azamat',       'approved', NOW() - INTERVAL '32 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-toktogulov-bakyt',    'approved', NOW() - INTERVAL '31 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-beishenaliev-damir',  'approved', NOW() - INTERVAL '30 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-sultanov-erkin',      'approved', NOW() - INTERVAL '29 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-orozbekov-zhanybek',  'approved', NOW() - INTERVAL '28 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-ibraev-ilyas',        'approved', NOW() - INTERVAL '27 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-kalykov-kanat',       'approved', NOW() - INTERVAL '26 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-mamytov-marat',       'approved', NOW() - INTERVAL '25 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-nurgaliev-nurlan',    'approved', NOW() - INTERVAL '24 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-omurbekov-ruslan',    'approved', NOW() - INTERVAL '23 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-tursunov-sanzhar',    'approved', NOW() - INTERVAL '22 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-usenov-timur',        'approved', NOW() - INTERVAL '21 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-abdyldaev-ulan',      'approved', NOW() - INTERVAL '20 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-zhoroev-chyngyz',     'approved', NOW() - INTERVAL '19 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-kalmurzaev-eldar',    'approved', NOW() - INTERVAL '18 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-sadykov-aibek',       'approved', NOW() - INTERVAL '17 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-djumaev-bolot',       'approved', NOW() - INTERVAL '16 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-isakov-daniyar',      'approved', NOW() - INTERVAL '15 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-tentimishev-esen',    'approved', NOW() - INTERVAL '14 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-moldoev-kuban',       'approved', NOW() - INTERVAL '13 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-shamshiev-mirlan',    'approved', NOW() - INTERVAL '12 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-aitmatov-almaz',      'approved', NOW() - INTERVAL '11 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-dzhunusov-seyit',     'approved', NOW() - INTERVAL '10 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-osmonov-talant',      'approved', NOW() - INTERVAL '9 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-kudaibergenov-nurbek','approved', NOW() - INTERVAL '8 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-turduev-adilet',      'approved', NOW() - INTERVAL '7 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-junusov-maksat',      'approved', NOW() - INTERVAL '6 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-eshmatov-sultan',     'approved', NOW() - INTERVAL '5 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-mamatov-arsen',       'approved', NOW() - INTERVAL '4 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-bakirov-manas',       'approved', NOW() - INTERVAL '3 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-saralaev-bektur',     'approved', NOW() - INTERVAL '2 hours'),
('0204e784-e449-410b-b0e2-502704212ba9', 'mm-ermekbaev-argen',     'approved', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
