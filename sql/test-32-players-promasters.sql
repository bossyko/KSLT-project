-- ============================================
-- 32 женских игрока Pro-Masters + регистрация на турнир
-- Tournament ID: bea1fbe6-c429-468c-af03-ba848c6f0eb8
-- Category: women-promasters
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Создаём 32 игрока (ON CONFLICT — не дублируем если уже есть)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('wp-ivanova-anna',       'Анна Иванова',        'Anna Ivanova',        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1200, 15, 3, 2, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], false),
('wp-petrova-maria',      'Мария Петрова',        'Maria Petrova',       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1150, 14, 4, 1, ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('wp-sidorova-elena',     'Елена Сидорова',       'Elena Sidorova',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1100, 13, 5, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('wp-kuznetsova-olga',    'Ольга Кузнецова',      'Olga Kuznetsova',     'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1050, 12, 5, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('wp-volkova-daria',      'Дарья Волкова',        'Daria Volkova',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1000, 11, 6, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('wp-morozova-natalia',   'Наталья Морозова',     'Natalia Morozova',    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 960, 10, 6, 0, ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], false),
('wp-sokolova-irina',     'Ирина Соколова',       'Irina Sokolova',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 920, 10, 7, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('wp-lebedeva-tatiana',   'Татьяна Лебедева',     'Tatiana Lebedeva',    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 880, 9, 7, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('wp-novikova-vera',      'Вера Новикова',        'Vera Novikova',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 840, 9, 8, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('wp-fedorova-alina',     'Алина Фёдорова',       'Alina Fedorova',      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 800, 8, 8, -1, ARRAY['W','L','L','L','W'], ARRAY[]::TEXT[], false),
('wp-mikhailova-ksenia',  'Ксения Михайлова',     'Ksenia Mikhailova',   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 760, 8, 9, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('wp-egorova-polina',     'Полина Егорова',       'Polina Egorova',      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 720, 7, 9, 0, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('wp-pavlova-diana',      'Диана Павлова',        'Diana Pavlova',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 680, 7, 10, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('wp-semenova-yulia',     'Юлия Семёнова',        'Yulia Semenova',      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 640, 6, 10, 2, ARRAY['W','W','L','L','L'], ARRAY[]::TEXT[], false),
('wp-andreeva-lilia',     'Лилия Андреева',       'Lilia Andreeva',      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 600, 6, 11, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('wp-alekseeva-rina',     'Рина Алексеева',       'Rina Alekseeva',      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 560, 5, 11, -1, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], false),
('wp-stepanova-kira',     'Кира Степанова',       'Kira Stepanova',      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 530, 5, 12, 1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], false),
('wp-kozlova-marina',     'Марина Козлова',       'Marina Kozlova',      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 500, 5, 12, 0, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('wp-grigorieva-sofia',   'София Григорьева',     'Sofia Grigorieva',    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 470, 4, 12, -2, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], false),
('wp-romanova-vika',      'Вика Романова',        'Vika Romanova',       'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 440, 4, 13, 0, ARRAY['W','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-golubeva-yana',      'Яна Голубева',         'Yana Golubeva',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 410, 4, 13, 1, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('wp-vinogradova-mila',   'Мила Виноградова',     'Mila Vinogradova',    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 380, 3, 13, -1, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false),
('wp-bogdanova-eva',      'Ева Богданова',        'Eva Bogdanova',       'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 350, 3, 14, 0, ARRAY['L','W','L','L','L'], ARRAY[]::TEXT[], false),
('wp-voronova-nika',      'Ника Воронова',        'Nika Voronova',       'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 320, 3, 14, -1, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], false),
('wp-tarasova-rita',      'Рита Тарасова',        'Rita Tarasova',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 290, 2, 14, 0, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false),
('wp-belova-lena',        'Лена Белова',          'Lena Belova',         'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 260, 2, 15, 1, ARRAY['W','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-komarova-nina',      'Нина Комарова',        'Nina Komarova',       'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 230, 2, 15, -1, ARRAY['L','W','L','L','L'], ARRAY[]::TEXT[], false),
('wp-orlova-zhanna',      'Жанна Орлова',         'Zhanna Orlova',       'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 200, 1, 15, 0, ARRAY['L','L','L','L','W'], ARRAY[]::TEXT[], false),
('wp-kiseleva-ada',       'Ада Киселёва',         'Ada Kiseleva',        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 180, 1, 16, -1, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], false),
('wp-makarova-zoya',      'Зоя Макарова',         'Zoya Makarova',       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 150, 1, 16, 0, ARRAY['L','L','W','L','L'], ARRAY[]::TEXT[], false),
('wp-nikitina-rosa',      'Роза Никитина',        'Rosa Nikitina',       'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 120, 0, 16, -2, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-zakharova-alla',     'Алла Захарова',        'Alla Zakharova',      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 100, 0, 17, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

-- 2. Регистрируем всех 32 игроков на турнир (статус approved)
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-ivanova-anna',       'approved', NOW() - INTERVAL '32 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-petrova-maria',      'approved', NOW() - INTERVAL '31 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-sidorova-elena',     'approved', NOW() - INTERVAL '30 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-kuznetsova-olga',    'approved', NOW() - INTERVAL '29 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-volkova-daria',      'approved', NOW() - INTERVAL '28 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-morozova-natalia',   'approved', NOW() - INTERVAL '27 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-sokolova-irina',     'approved', NOW() - INTERVAL '26 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-lebedeva-tatiana',   'approved', NOW() - INTERVAL '25 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-novikova-vera',      'approved', NOW() - INTERVAL '24 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-fedorova-alina',     'approved', NOW() - INTERVAL '23 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-mikhailova-ksenia',  'approved', NOW() - INTERVAL '22 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-egorova-polina',     'approved', NOW() - INTERVAL '21 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-pavlova-diana',      'approved', NOW() - INTERVAL '20 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-semenova-yulia',     'approved', NOW() - INTERVAL '19 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-andreeva-lilia',     'approved', NOW() - INTERVAL '18 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-alekseeva-rina',     'approved', NOW() - INTERVAL '17 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-stepanova-kira',     'approved', NOW() - INTERVAL '16 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-kozlova-marina',     'approved', NOW() - INTERVAL '15 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-grigorieva-sofia',   'approved', NOW() - INTERVAL '14 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-romanova-vika',      'approved', NOW() - INTERVAL '13 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-golubeva-yana',      'approved', NOW() - INTERVAL '12 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-vinogradova-mila',   'approved', NOW() - INTERVAL '11 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-bogdanova-eva',      'approved', NOW() - INTERVAL '10 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-voronova-nika',      'approved', NOW() - INTERVAL '9 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-tarasova-rita',      'approved', NOW() - INTERVAL '8 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-belova-lena',        'approved', NOW() - INTERVAL '7 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-komarova-nina',      'approved', NOW() - INTERVAL '6 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-orlova-zhanna',      'approved', NOW() - INTERVAL '5 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-kiseleva-ada',       'approved', NOW() - INTERVAL '4 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-makarova-zoya',      'approved', NOW() - INTERVAL '3 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-nikitina-rosa',      'approved', NOW() - INTERVAL '2 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-zakharova-alla',     'approved', NOW() - INTERVAL '1 minutes')
ON CONFLICT DO NOTHING;

-- 3. Ещё 10 игроков в лист ожидания (registered_at ПОСЛЕ основных 32)
INSERT INTO players (id, name, name_en, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('wp-klimova-inga',       'Инга Климова',         'Inga Klimova',        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 90, 0, 10, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-fomina-lara',        'Лара Фомина',          'Lara Fomina',         'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 80, 0, 11, -1, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-tikhonova-marta',    'Марта Тихонова',       'Marta Tikhonova',     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 70, 0, 12, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-danilova-sveta',     'Света Данилова',       'Sveta Danilova',      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 60, 0, 12, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-ermakova-valya',     'Валя Ермакова',        'Valya Ermakova',      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 50, 0, 13, -1, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-zhuravleva-toma',    'Тома Журавлёва',       'Toma Zhuravleva',     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 40, 0, 14, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-loginova-maya',      'Майя Логинова',        'Maya Loginova',       'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 30, 0, 14, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-karpova-inna',       'Инна Карпова',         'Inna Karpova',        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 20, 0, 15, -1, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-gavrilova-liza',     'Лиза Гаврилова',       'Liza Gavrilova',      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 10, 0, 16, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false),
('wp-efimova-alia',       'Аля Ефимова',          'Alia Efimova',        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 5, 0, 17, 0, ARRAY['L','L','L','L','L'], ARRAY[]::TEXT[], false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at) VALUES
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-klimova-inga',       'approved', NOW()),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-fomina-lara',        'approved', NOW() + INTERVAL '1 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-tikhonova-marta',    'approved', NOW() + INTERVAL '2 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-danilova-sveta',     'approved', NOW() + INTERVAL '3 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-ermakova-valya',     'approved', NOW() + INTERVAL '4 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-zhuravleva-toma',    'approved', NOW() + INTERVAL '5 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-loginova-maya',      'approved', NOW() + INTERVAL '6 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-karpova-inna',       'approved', NOW() + INTERVAL '7 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-gavrilova-liza',     'approved', NOW() + INTERVAL '8 minutes'),
('bea1fbe6-c429-468c-af03-ba848c6f0eb8', 'wp-efimova-alia',       'approved', NOW() + INTERVAL '9 minutes')
ON CONFLICT DO NOTHING;
