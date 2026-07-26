-- ============================================
-- KSLT — Seed: 3 Test Doubles Tournaments
-- 1) Men's Doubles: 18 pairs (max 16 pairs → 14 approved + 2 waitlist + 2 solo)
-- 2) Women's Doubles: 24 pairs (max 16 pairs → 16 approved + 5 waitlist + 3 solo)
-- 3) Mixed Doubles: 13 pairs (max 16 pairs → 9 approved + 2 waitlist + 2 solo)
--
-- Solo = зарегистрировался один человек без партнёра
-- ============================================

-- ========== TOURNAMENT 1: Men's Doubles — 18 пар ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, reserved_spots, bracket_type, draw_size,
  location, location_en, published_at
) VALUES (
  'test-doubles-men-2026',
  'Летний парный кубок — Мужчины',
  'Summer Doubles Cup — Men',
  'challenger', 'doubles', 'men', 'registration_open',
  '2026-08-15', '2026-08-17',
  '2026-07-20', '2026-08-10',
  32, 4,
  'single_elimination', 16,
  'Корт "Ала-Тоо", Бишкек',
  'Ala-Too Court, Bishkek',
  NOW()
)
;

-- Approved pairs (14 пар с партнёрами)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-men-2026', 'demo-se-01', 'demo-se-02', 'approved'),
  ('test-doubles-men-2026', 'demo-se-03', 'demo-смотриse-04', 'approved'),
  ('test-doubles-men-2026', 'demo-se-05', 'demo-se-06', 'approved'),
  ('test-doubles-men-2026', 'demo-se-07', 'demo-se-08', 'approved'),
  ('test-doubles-men-2026', 'demo-se-09', 'demo-se-10', 'approved'),
  ('test-doubles-men-2026', 'demo-se-11', 'demo-se-12', 'approved'),
  ('test-doubles-men-2026', 'demo-se-13', 'demo-se-14', 'approved'),
  ('test-doubles-men-2026', 'demo-se-15', 'demo-se-16', 'approved'),
  ('test-doubles-men-2026', 'sydykov-adilet', 'rakhimov-alisher', 'approved'),
  ('test-doubles-men-2026', 'kalmatov-ayan', 'askarov-bolot', 'approved'),
  ('test-doubles-men-2026', 'dzhumagulov-kanat', 'duishenov-kuban', 'approved'),
  ('test-doubles-men-2026', 'turdaliev-maksat', 'kozhoev-ulan', 'approved'),
  ('test-doubles-men-2026', 'batyrov-elaman', 'satybaldiev-eldiyar', 'approved'),
  ('test-doubles-men-2026', 'omorov-talant', 'rakhmanov-timur', 'approved')
;

-- Waitlist pairs (2 пары в ожидании)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-men-2026', 'oruzbaev-semetey', 'nurmukhamedov-serik', 'waitlist'),
  ('test-doubles-men-2026', 'zholdoshov-nurzhigit', 'demo-fic-01', 'waitlist')
;

-- Solo registrations (2 чел без партнёра — admin/manager добавит)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-men-2026', 'demo-fic-02', NULL, 'approved'),
  ('test-doubles-men-2026', 'demo-fic-03', NULL, 'waitlist')
;


-- ========== TOURNAMENT 2: Women's Doubles — 24 пары ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, reserved_spots, bracket_type, draw_size,
  location, location_en, published_at
) VALUES (
  'test-doubles-women-2026',
  'Летний парный кубок — Женщины',
  'Summer Doubles Cup — Women',
  'challenger', 'doubles', 'women', 'registration_open',
  '2026-08-15', '2026-08-17',
  '2026-07-20', '2026-08-10',
  32, 0,
  'single_elimination', 16,
  'Корт "Ала-Тоо", Бишкек',
  'Ala-Too Court, Bishkek',
  NOW()
)
;

-- Approved pairs (16 пар → полная сетка)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-women-2026', 'zholdoshbekova-aidai', 'bekturova-ainura', 'approved'),
  ('test-doubles-women-2026', 'turganbaeva-asel', 'eshmatova-burul', 'approved'),
  ('test-doubles-women-2026', 'tashtanova-gulzina', 'kurmanova-dariya', 'approved'),
  ('test-doubles-women-2026', 'musaeva-zhyldyz', 'nurkulova-zarina', 'approved'),
  ('test-doubles-women-2026', 'alymova-mirgul', 'abdykadyrova-meerim', 'approved'),
  ('test-doubles-women-2026', 'toktoeva-nurzat', 'shakirova-rano', 'approved'),
  ('test-doubles-women-2026', 'narmanbetova-saule', 'sagynova-tolkun', 'approved'),
  ('test-doubles-women-2026', 'ibraeva-elmira', 'toktogulova-aidai', 'approved'),
  ('test-doubles-women-2026', 'orozbekova-aijamal', 'sydykova-aijan', 'approved'),
  ('test-doubles-women-2026', 'kenenbaeva-aisuluu', 'kozhomkulova-asel', 'approved'),
  ('test-doubles-women-2026', 'temirova-begaiym', 'kaparova-gulzat', 'approved'),
  ('test-doubles-women-2026', 'abdyldaeva-zhyldyz', 'tashbaeva-zarina', 'approved'),
  ('test-doubles-women-2026', 'rysbaeva-kanykei', 'nuralieva-madina', 'approved'),
  ('test-doubles-women-2026', 'moldoeva-nurgul', 'asanbekova-nuriza', 'approved'),
  ('test-doubles-women-2026', 'dzhumalieva-sezim', 'baitikova-elmira', 'approved'),
  ('test-doubles-women-2026', 'abdieva-cholpon', 'abdraimova-kalys', 'approved')
;

-- Waitlist pairs (5 пар в ожидании — сетка заполнена)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-women-2026', 'abdullaeva-sevara', 'akmatova-eliza', 'waitlist'),
  ('test-doubles-women-2026', 'amanbaeva-nurgul', 'anarbaeva-bermet', 'waitlist'),
  ('test-doubles-women-2026', 'bekova-altynai', 'dzhorobekova-jamilya', 'waitlist'),
  ('test-doubles-women-2026', 'ergeshova-saltanat', 'ismailova-dinara', 'waitlist'),
  ('test-doubles-women-2026', 'kadyrova-nurzhamal', 'karabaeva-nuray', 'waitlist')
;

-- Solo registrations (3 чел без партнёра в waitlist)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-women-2026', 'kasymova-zhibek', NULL, 'waitlist'),
  ('test-doubles-women-2026', 'kulova-madina', NULL, 'waitlist'),
  ('test-doubles-women-2026', 'kurmanbekova-jyldyz', NULL, 'waitlist')
;


-- ========== TOURNAMENT 3: Mixed Doubles — 13 пар ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, reserved_spots, bracket_type, draw_size,
  ntrp_combined_max, location, location_en, published_at
) VALUES (
  'test-mixed-doubles-2026',
  'Микст Кубок — Лето 2026',
  'Mixed Doubles Cup — Summer 2026',
  'challenger', 'mixed_doubles', 'mixed', 'registration_open',
  '2026-08-22', '2026-08-24',
  '2026-07-25', '2026-08-18',
  32, 2,
  'single_elimination', 16,
  7.0,
  'Корт "Ала-Тоо", Бишкек',
  'Ala-Too Court, Bishkek',
  NOW()
)
;

-- Approved mixed pairs (9 пар: капитан + партнёр разных полов)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-mixed-doubles-2026', 'demo-se-01', 'zholdoshbekova-aidai', 'approved'),
  ('test-mixed-doubles-2026', 'demo-se-03', 'turganbaeva-asel', 'approved'),
  ('test-mixed-doubles-2026', 'sydykov-adilet', 'musaeva-zhyldyz', 'approved'),
  ('test-mixed-doubles-2026', 'demo-se-05', 'tashtanova-gulzina', 'approved'),
  ('test-mixed-doubles-2026', 'rakhimov-alisher', 'kurmanova-dariya', 'approved'),
  ('test-mixed-doubles-2026', 'bekturova-ainura', 'demo-se-07', 'approved'),
  ('test-mixed-doubles-2026', 'demo-se-09', 'nurkulova-zarina', 'approved'),
  ('test-mixed-doubles-2026', 'eshmatova-burul', 'demo-se-11', 'approved'),
  ('test-mixed-doubles-2026', 'demo-se-13', 'alymova-mirgul', 'approved')
;

-- Waitlist mixed pairs (2 пары в ожидании)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-mixed-doubles-2026', 'demo-se-15', 'abdykadyrova-meerim', 'waitlist'),
  ('test-mixed-doubles-2026', 'toktoeva-nurzat', 'kalmatov-ayan', 'waitlist')
;

-- Solo registrations (2 чел без партнёра — admin добавит)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-mixed-doubles-2026', 'askarov-bolot', NULL, 'approved'),
  ('test-mixed-doubles-2026', 'shakirova-rano', NULL, 'waitlist')
;


-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.gender,
  t.max_participants || ' (res: ' || COALESCE(t.reserved_spots,0) || ')' AS capacity,
  COUNT(r.id) AS total_regs,
  COUNT(CASE WHEN r.status = 'approved' AND r.partner_id IS NOT NULL THEN 1 END) AS approved_pairs,
  COUNT(CASE WHEN r.status = 'approved' AND r.partner_id IS NULL THEN 1 END) AS approved_solo,
  COUNT(CASE WHEN r.status = 'waitlist' AND r.partner_id IS NOT NULL THEN 1 END) AS waitlist_pairs,
  COUNT(CASE WHEN r.status = 'waitlist' AND r.partner_id IS NULL THEN 1 END) AS waitlist_solo
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id IN ('test-doubles-men-2026', 'test-doubles-women-2026', 'test-mixed-doubles-2026')
GROUP BY t.id, t.title, t.format, t.gender, t.max_participants, t.reserved_spots
ORDER BY t.id;
