-- ========================================
-- PLAYERS MIGRATION
-- Generated from players-data.js
-- 9 categories, 135 players total
-- ========================================

-- ==========================================
-- MEN: Pro-Masters (men-promasters) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('ivanov-alexey', 'Алексей Иванов', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2450, 18, 3, 2, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], true),
('petrov-maxim', 'Максим Петров', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2380, 16, 5, -1, ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('kozlov-dmitry', 'Дмитрий Козлов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-promasters', 2310, 15, 4, 1, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('asanov-timur', 'Тимур Асанов', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 2180, 14, 6, 0, ARRAY['L','W','W','W','L'], ARRAY[]::TEXT[], true),
('bakirov-ruslan', 'Руслан Бакиров', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-promasters', 2050, 13, 5, 3, ARRAY['W','W','W','W','L'], ARRAY['streak'], false),
('zhumaev-erlan', 'Эрлан Жумаев', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1980, 12, 7, -2, ARRAY['L','W','L','W','W'], ARRAY[]::TEXT[], false),
('mambetov-daniyar', 'Данияр Мамбетов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-promasters', 1920, 11, 6, 1, ARRAY['W','L','W','W','W'], ARRAY[]::TEXT[], true),
('kravtsov-artem', 'Артём Кравцов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇷🇺', 'men-promasters', 1870, 10, 8, 0, ARRAY['W','L','L','W','W'], ARRAY[]::TEXT[], false),
('sultanov-aybek', 'Айбек Султанов', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1810, 10, 7, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('orozbekov-nurdin', 'Нурдин Орозбеков', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1760, 9, 8, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], true),
('toktomushev-azamat', 'Азамат Токтомушев', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1700, 9, 9, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('kurbanov-farid', 'Фарид Курбанов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-promasters', 1650, 8, 9, 1, ARRAY['W','W','L','L','W'], ARRAY['newbie'], false),
('tashiev-bektur', 'Бектур Ташиев', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1600, 8, 10, -3, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('ismailov-sultan', 'Султан Исмаилов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1550, 7, 10, 12, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], true),
('abdykerimov-manas', 'Манас Абдыкеримов', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-promasters', 1500, 7, 11, -1, ARRAY['L','W','L','W','L'], ARRAY['newbie'], false);

-- ==========================================
-- MEN: Masters (men-masters) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('tursunov-bekzhan', 'Бекжан Турсунов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1850, 15, 4, 1, ARRAY['W','W','L','W','W'], ARRAY['champion','top1'], true),
('kydyrov-nurlan', 'Нурлан Кыдыров', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1780, 13, 5, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], false),
('suleymanov-marat', 'Марат Сулейманов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-masters', 1720, 12, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('zhanybekov-azat', 'Азат Жаныбеков', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1690, 12, 7, 2, ARRAY['W','W','W','L','W'], ARRAY[]::TEXT[], true),
('aliev-kenzhebek', 'Кенжебек Алиев', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-masters', 1650, 11, 6, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('orozov-salamat', 'Саламат Орозов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1600, 10, 7, 3, ARRAY['W','W','W','W','L'], ARRAY['streak'], false),
('shevchenko-ivan', 'Иван Шевченко', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇷🇺', 'men-masters', 1560, 10, 8, -2, ARRAY['L','L','W','W','W'], ARRAY[]::TEXT[], false),
('toktogulov-almaz', 'Алмаз Токтогулов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1520, 9, 8, 0, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], true),
('beishenaliev-taalaibek', 'Таалайбек Бейшеналиев', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1480, 9, 9, 1, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('ryspek-uulu-aman', 'Аман Рыспек уулу', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1440, 8, 9, -1, ARRAY['L','W','L','W','W'], ARRAY[]::TEXT[], false),
('voronov-denis', 'Денис Воронов', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇷🇺', 'men-masters', 1400, 8, 10, 2, ARRAY['W','W','L','L','W'], ARRAY[]::TEXT[], false),
('karimov-dilshod', 'Дильшод Каримов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-masters', 1360, 7, 10, 0, ARRAY['L','W','W','L','L'], ARRAY['newbie'], true),
('osmonov-chyngyz', 'Чынгыз Осмонов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1320, 7, 11, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], false),
('niyazov-eldar', 'Эльдар Ниязов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1280, 6, 11, 11, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('tagaev-melis', 'Мелис Тагаев', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-masters', 1240, 6, 12, -1, ARRAY['W','L','L','W','L'], ARRAY['newbie'], false);

-- ==========================================
-- MEN: Futures (men-futures) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('bolotov-askar', 'Аскар Болотов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 980, 12, 3, 4, ARRAY['W','W','W','W','L'], ARRAY['champion','top1','streak'], true),
('usenov-temirlan', 'Темирлан Усенов', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 920, 10, 4, 1, ARRAY['W','L','W','W','W'], ARRAY[]::TEXT[], false),
('kasymov-zhandos', 'Жандос Касымов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-futures', 870, 9, 5, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('abdiev-sanzhar', 'Санжар Абдиев', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 840, 8, 6, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], true),
('nazarov-bakyt', 'Бакыт Назаров', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 810, 8, 7, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('esenov-kayrat', 'Кайрат Эсенов', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-futures', 780, 7, 7, 0, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('sheraliev-mirlan', 'Мирлан Шералиев', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 750, 7, 8, -1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], false),
('toktoev-nurbek', 'Нурбек Токтоев', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 720, 6, 8, 1, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], true),
('dzhenaliev-dastan', 'Дастан Дженалиев', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 690, 6, 9, 0, ARRAY['L','W','L','L','W'], ARRAY['newbie'], false),
('torobekov-erzhan', 'Ержан Торобеков', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 660, 5, 9, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], false),
('maratov-ilim', 'Илим Маратов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 630, 5, 10, 1, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('kushchenko-igor', 'Игорь Кущенко', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇷🇺', 'men-futures', 600, 5, 10, 0, ARRAY['L','W','L','W','L'], ARRAY['newbie'], false),
('turgunov-saidakbar', 'Саидакбар Тургунов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-futures', 570, 4, 11, 13, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], true),
('kemelbekov-adilet', 'Адилет Кемелбеков', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 540, 4, 11, -1, ARRAY['L','L','W','L','W'], ARRAY['newbie'], false),
('sydykov-nurbolot', 'Нурболот Сыдыков', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-futures', 510, 3, 12, 0, ARRAY['L','W','L','L','L'], ARRAY['newbie'], false);

-- ==========================================
-- MEN: Challenger (men-challenger) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('satybaldiev-eldiyar', 'Элдияр Сатыбалдиев', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1420, 14, 4, 1, ARRAY['W','W','L','W','W'], ARRAY['champion','top1'], false),
('dzhumagulov-kanat', 'Канат Джумагулов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1380, 13, 5, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], true),
('rakhimov-alisher', 'Алишер Рахимов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-challenger', 1340, 12, 5, -1, ARRAY['L','W','W','W','L'], ARRAY[]::TEXT[], false),
('kozhoev-ulan', 'Улан Кожоев', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1290, 11, 6, 3, ARRAY['W','W','W','L','W'], ARRAY[]::TEXT[], false),
('omorov-talant', 'Талант Оморов', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1250, 10, 7, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], true),
('nurmukhamedov-serik', 'Серик Нурмухамедов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-challenger', 1210, 10, 8, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('sydykov-adilet', 'Адилет Сыдыков', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1180, 9, 8, -1, ARRAY['L','W','L','W','W'], ARRAY[]::TEXT[], false),
('turdaliev-maksat', 'Максат Турдалиев', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1150, 9, 9, 0, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('kalmatov-ayan', 'Аян Калматов', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1110, 8, 9, 1, ARRAY['W','W','L','L','W'], ARRAY[]::TEXT[], false),
('batyrov-elaman', 'Эламан Батыров', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1080, 8, 10, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], true),
('duishenov-kuban', 'Кубан Дуйшенов', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1050, 7, 10, 0, ARRAY['W','L','W','L','L'], ARRAY['newbie'], false),
('zholdoshov-nurzhigit', 'Нуржигит Жолдошов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 1020, 7, 11, 11, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('rakhmanov-timur', 'Тимур Рахманов', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-challenger', 990, 6, 11, -1, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('oruzbaev-semetey', 'Семетей Орузбаев', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 960, 6, 12, 0, ARRAY['L','L','W','W','L'], ARRAY['newbie'], false),
('askarov-bolot', 'Болот Аскаров', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-challenger', 930, 5, 12, 2, ARRAY['W','L','W','L','L'], ARRAY['newbie'], false);

-- ==========================================
-- MEN: Tour (men-tour) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('dzholdoshev-samat', 'Самат Джолдошев', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 520, 10, 3, 5, ARRAY['W','W','W','W','W'], ARRAY['champion','top1','streak'], true),
('kalykov-arsen', 'Арсен Калыков', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 490, 9, 4, 2, ARRAY['W','L','W','W','W'], ARRAY[]::TEXT[], false),
('mamatov-begaly', 'Бегалы Маматов', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 460, 8, 5, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('asylbekov-nurzhigit', 'Нуржигит Асылбеков', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇿', 'men-tour', 430, 7, 5, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('omuraliev-zhanysh', 'Жаныш Омуралиев', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 400, 7, 6, 1, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], true),
('subanov-tilek', 'Тилек Субанов', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 380, 6, 7, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('baisalov-murat', 'Мурат Байсалов', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 350, 5, 8, -3, ARRAY['L','L','L','W','L'], ARRAY[]::TEXT[], false),
('kasymaliev-chyngyz', 'Чынгыз Касымалиев', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 320, 5, 8, 2, ARRAY['W','W','L','L','W'], ARRAY[]::TEXT[], false),
('temirov-nursultan', 'Нурсултан Темиров', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 290, 4, 9, 0, ARRAY['L','W','L','L','W'], ARRAY['newbie'], false),
('moldogaziev-emilbek', 'Эмилбек Молдогазиев', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 260, 4, 9, -1, ARRAY['W','L','L','L','W'], ARRAY['newbie'], true),
('dzhumaev-nurgazy', 'Нургазы Джумаев', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 230, 3, 10, 1, ARRAY['L','L','W','L','L'], ARRAY['newbie'], false),
('ergeshov-baiaman', 'Байаман Эргешов', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 200, 3, 10, 0, ARRAY['W','L','L','W','L'], ARRAY['newbie'], false),
('kulbaev-almaz', 'Алмаз Кулбаев', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 180, 2, 11, 12, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('ryskulov-aidyn', 'Айдын Рыскулов', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80', '🇰🇬', 'men-tour', 150, 2, 11, -2, ARRAY['L','L','W','L','L'], ARRAY['newbie'], false),
('nazarbekov-isa', 'Иса Назарбеков', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80', '🇺🇿', 'men-tour', 120, 1, 12, 0, ARRAY['L','L','L','W','L'], ARRAY['newbie'], false);

-- ==========================================
-- WOMEN: Pro-Masters (women-promasters) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('moldobaeva-anara', 'Анара Молдобаева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 2420, 17, 3, 1, ARRAY['W','W','L','W','W'], ARRAY['champion','top1'], true),
('tashmatova-venera', 'Венера Ташматова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 2350, 15, 4, 0, ARRAY['W','L','W','W','W'], ARRAY['streak'], false),
('omurzakova-gulnara', 'Гулнара Омурзакова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-promasters', 2280, 14, 5, -1, ARRAY['L','W','W','W','L'], ARRAY[]::TEXT[], false),
('sulaymanova-zhazgul', 'Жазгуль Сулайманова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 2210, 13, 5, 2, ARRAY['W','W','W','L','W'], ARRAY[]::TEXT[], true),
('abdraimova-kalys', 'Калыс Абдраимова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 2150, 12, 6, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('kadyrova-nurzhamal', 'Нуржамал Кадырова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-promasters', 2090, 11, 7, 1, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('turgunova-sezim', 'Сезим Тургунова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 2030, 11, 8, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('zhusupova-elnura', 'Элнура Жусупова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1970, 10, 8, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], true),
('anarbaeva-bermet', 'Бермет Анарбаева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1910, 10, 9, 1, ARRAY['W','W','L','L','W'], ARRAY[]::TEXT[], false),
('mamytova-asel', 'Асель Мамытова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1860, 9, 9, -1, ARRAY['L','W','L','W','W'], ARRAY[]::TEXT[], false),
('kurmanbekova-jyldyz', 'Жылдыз Курманбекова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1800, 9, 10, 0, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('raimkulova-kunuz', 'Кунуз Раимкулова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1740, 8, 10, 11, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('akmatova-eliza', 'Элиза Акматова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1680, 8, 11, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], true),
('satybaldyeva-nurkyz', 'Нуркыз Сатыбалдыева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1620, 7, 11, 1, ARRAY['W','L','W','L','L'], ARRAY['newbie'], false),
('orozalieva-aisulu', 'Айсулуу Орозалиева', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-promasters', 1560, 7, 12, 0, ARRAY['L','W','L','L','W'], ARRAY['newbie'], false);

-- ==========================================
-- WOMEN: Masters (women-masters) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('sidorova-elena', 'Елена Сидорова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 2290, 16, 3, 1, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], true),
('nikolaeva-ksenia', 'Ксения Николаева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 2180, 14, 4, 3, ARRAY['W','W','W','W','L'], ARRAY['streak'], false),
('toktosunova-aizhan', 'Айжан Токтосунова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 2050, 13, 5, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], false),
('kulova-madina', 'Мадина Кулова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-masters', 1980, 12, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], true),
('amanbaeva-nurgul', 'Нургуль Аманбаева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1920, 11, 6, 2, ARRAY['W','W','L','W','W'], ARRAY[]::TEXT[], false),
('ismailova-dinara', 'Динара Исмаилова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-masters', 1870, 10, 7, 0, ARRAY['W','L','L','W','W'], ARRAY[]::TEXT[], false),
('kasymova-zhibek', 'Жибек Касымова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1810, 10, 8, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('ergeshova-saltanat', 'Салтанат Эргешова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1760, 9, 8, 1, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], false),
('temirbekova-aida', 'Аида Темирбекова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1710, 9, 9, 0, ARRAY['L','W','L','W','W'], ARRAY[]::TEXT[], true),
('zhaparova-cholpon', 'Чолпон Жапарова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1660, 8, 9, -1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], false),
('umetalieva-jazgul', 'Жазгуль Уметалиева', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1620, 8, 10, 2, ARRAY['W','W','L','L','W'], ARRAY[]::TEXT[], false),
('abdullaeva-sevara', 'Севара Абдуллаева', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-masters', 1580, 7, 10, 0, ARRAY['L','W','W','L','L'], ARRAY['newbie'], false),
('karabaeva-nuray', 'Нурай Карабаева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1540, 7, 11, 12, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('moldoeva-ayzirek', 'Айзирек Молдоева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1500, 6, 11, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], false),
('sagynalyeva-kanykei', 'Каныкей Сагыналыева', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-masters', 1460, 6, 12, 0, ARRAY['W','L','L','L','W'], ARRAY['newbie'], false);

-- ==========================================
-- WOMEN: Challenger (women-challenger) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('turganbaeva-asel', 'Асель Турганбаева', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1350, 13, 4, 2, ARRAY['W','W','L','W','W'], ARRAY['champion','top1'], false),
('nurkulova-zarina', 'Зарина Нуркулова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1290, 12, 5, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], true),
('kurmanova-dariya', 'Дария Курманова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-challenger', 1240, 11, 6, -1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('alymova-mirgul', 'Миргуль Алымова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1200, 10, 6, 1, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('bekturova-ainura', 'Айнура Бектурова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1160, 10, 7, 0, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], true),
('sagynova-tolkun', 'Толкун Сагынова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-challenger', 1120, 9, 8, 3, ARRAY['W','W','W','L','W'], ARRAY[]::TEXT[], false),
('toktoeva-nurzat', 'Нурзат Токтоева', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1080, 9, 9, -2, ARRAY['L','L','W','W','L'], ARRAY[]::TEXT[], false),
('eshmatova-burul', 'Бурул Эшматова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1040, 8, 9, 0, ARRAY['W','L','W','L','L'], ARRAY[]::TEXT[], false),
('tashtanova-gulzina', 'Гулзина Таштанова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 1000, 8, 10, 1, ARRAY['L','W','W','L','W'], ARRAY[]::TEXT[], false),
('musaeva-zhyldyz', 'Жылдыз Мусаева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 960, 7, 10, -1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], true),
('abdykadyrova-meerim', 'Мээрим Абдыкадырова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 920, 7, 11, 0, ARRAY['L','L','W','W','L'], ARRAY['newbie'], false),
('ibraeva-elmira', 'Эльмира Ибраева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 880, 6, 11, 11, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('narmanbetova-saule', 'Сауле Нарманбетова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-challenger', 840, 6, 12, -2, ARRAY['L','W','L','L','W'], ARRAY[]::TEXT[], false),
('zholdoshbekova-aidai', 'Айдай Жолдошбекова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-challenger', 800, 5, 12, 1, ARRAY['W','L','L','W','L'], ARRAY['newbie'], false),
('shakirova-rano', 'Рано Шакирова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-challenger', 760, 5, 13, 0, ARRAY['L','L','W','L','L'], ARRAY['newbie'], false);

-- ==========================================
-- WOMEN: Tour (women-tour) — 15 players
-- ==========================================
INSERT INTO players (id, name, photo, country, category_id, points, wins, losses, rank_change, form, badges, is_online) VALUES
('orozova-begimai', 'Бегимай Орозова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 480, 9, 3, 3, ARRAY['W','W','W','L','W'], ARRAY['champion','top1'], true),
('zholdosheva-aida', 'Аида Жолдошева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 450, 8, 4, 0, ARRAY['W','L','W','W','L'], ARRAY[]::TEXT[], false),
('rakhmatova-kamila', 'Камила Рахматова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇺🇿', 'women-tour', 420, 7, 5, 1, ARRAY['W','L','W','L','W'], ARRAY[]::TEXT[], false),
('satyeva-nazgul', 'Назгуль Сатыева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 390, 7, 6, -1, ARRAY['L','W','W','L','L'], ARRAY[]::TEXT[], true),
('bekova-altynai', 'Алтынай Бекова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 360, 6, 6, 2, ARRAY['W','W','L','W','L'], ARRAY[]::TEXT[], false),
('mamatova-gulzat', 'Гулзат Маматова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 330, 5, 7, 0, ARRAY['L','W','L','W','L'], ARRAY[]::TEXT[], false),
('tashieva-elmira', 'Эльмира Ташиева', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇿', 'women-tour', 300, 5, 8, -2, ARRAY['L','L','W','L','W'], ARRAY[]::TEXT[], false),
('abdieva-cholpon', 'Чолпон Абдиева', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 280, 4, 8, 1, ARRAY['W','L','L','W','L'], ARRAY[]::TEXT[], false),
('tashtemirova-aigerim', 'Айгерим Таштемирова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 250, 4, 9, 0, ARRAY['L','W','L','L','W'], ARRAY['newbie'], true),
('nurmatova-begaiym', 'Бегайым Нурматова', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 220, 3, 9, -1, ARRAY['W','L','L','L','W'], ARRAY['newbie'], false),
('sarykbaeva-damira', 'Дамира Сарыкбаева', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 200, 3, 10, 1, ARRAY['L','L','W','L','L'], ARRAY['newbie'], false),
('dzhorobekova-jamilya', 'Жамиля Джоробекова', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 180, 2, 10, 0, ARRAY['L','W','L','L','L'], ARRAY['newbie'], false),
('tynystanova-aiturgan', 'Айтурган Тыныстанова', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 160, 2, 11, 13, ARRAY['W','W','W','W','W'], ARRAY['breakthrough','streak'], false),
('toktobaeva-ainash', 'Айнаш Токтобаева', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 140, 1, 11, -2, ARRAY['L','L','L','W','L'], ARRAY['newbie'], false),
('usenova-perizat', 'Перизат Усенова', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&q=80', '🇰🇬', 'women-tour', 120, 1, 12, 0, ARRAY['L','L','W','L','L'], ARRAY['newbie'], false);
