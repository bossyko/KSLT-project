-- ============================================
-- KSLT — Seed: Test IG/X-slot Tournaments (Round Robin + Groups)
--
-- Все 32 mm-* игроков = 16 пар максимум.
-- Сценарий A: 13 пар → 4 группы (1×4 + 3×3) → candidates=3, free=3, auto_pass=3, IG=0
-- Сценарий B: 12 пар → 4 группы (все по 3) → candidates=4, free=4, auto_pass=4, IG=0
-- Сценарий C: 16 пар → 6 групп (4×3 + 2×2) → candidates=4, free=4, auto_pass=4, IG=0
--   (для IG-матчей: 16 пар → 4 группы по 4 = no candidates;
--    поменяем на 5 групп: 1×4 + 4×3 → candidates=4, direct=10, draw=16, free=6, all pass)
--
-- Лучший вариант для IG: одиночный турнир, 15 игроков → 5 групп по 3
--   direct=10, draw=16, free=6, candidates=5, auto_pass=5, IG=0
-- Для IG-матчей нужно candidates > free_slots, т.е. много групп по 3 и мало free.
-- 12 игроков → 4 группы по 3 → direct=8, draw=8, free=0, candidates=4 → IG=4 матча!
--
-- ИТОГО:
-- Сценарий 1 (doubles): 13 пар, 4 группы → IG path (3 candidates, free=3, all pass)
-- Сценарий 2 (singles): 12 игроков, 4 группы по 3 → direct=8, draw=8, free=0, IG=4 (candidates > free!)
-- Сценарий 3 (doubles): 16 пар, 4 группы по 4 → no IG needed (all played 3 games)
-- ============================================

-- ========== Cleanup old test data ==========
DELETE FROM matches WHERE tournament_id IN ('test-ig-doubles-13', 'test-ig-singles-12', 'test-ig-doubles-16');
DELETE FROM tournament_registrations WHERE tournament_id IN ('test-ig-doubles-13', 'test-ig-singles-12', 'test-ig-doubles-16');
DELETE FROM tournaments WHERE id IN ('test-ig-doubles-13', 'test-ig-singles-12', 'test-ig-doubles-16');


-- ========== СЦЕНАРИЙ 1: 13 doubles пар → 4 группы (1×4 + 3×3) ==========
-- direct = 4×2 = 8, draw_size = 8, free_slots = 0
-- candidates = 3 (из 3 групп по 3)
-- WAIT: free_slots=0 → IG не нужен (нет слотов)
-- Лучше: 5 групп! 13 пар → 5 групп (3×3 + 2×2) → direct=10, draw=16, free=6, candidates=3
-- Все pass, без IG. Для теста auto-pass.

INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type,
  court_count, match_duration, buffer_minutes, start_time,
  group_count, qualifiers_per_group,
  location, location_en, published_at
) VALUES (
  'test-ig-doubles-13',
  'Тест IG doubles — 13 пар (5 групп, auto-pass)',
  'Test IG doubles — 13 pairs (5 groups, auto-pass)',
  'masters', 'doubles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '12 days',
  26, 'round_robin',
  3, 60, 10, '09:00',
  5, 2,
  'Бишкек, Dordoi Tennis Club', 'Bishkek, Dordoi Tennis Club',
  NOW()
);

-- 13 approved doubles pairs (using all 26 mm-* players)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-ig-doubles-13', 'mm-asanov-azamat',       'mm-toktogulov-bakyt',    'approved'),
  ('test-ig-doubles-13', 'mm-beishenaliev-damir',  'mm-sultanov-erkin',      'approved'),
  ('test-ig-doubles-13', 'mm-orozbekov-zhanybek',  'mm-ibraev-ilyas',        'approved'),
  ('test-ig-doubles-13', 'mm-kalykov-kanat',       'mm-mamytov-marat',       'approved'),
  ('test-ig-doubles-13', 'mm-nurgaliev-nurlan',    'mm-omurbekov-ruslan',    'approved'),
  ('test-ig-doubles-13', 'mm-tursunov-sanzhar',    'mm-usenov-timur',        'approved'),
  ('test-ig-doubles-13', 'mm-abdyldaev-ulan',      'mm-zhoroev-chyngyz',     'approved'),
  ('test-ig-doubles-13', 'mm-kalmurzaev-eldar',    'mm-sadykov-aibek',       'approved'),
  ('test-ig-doubles-13', 'mm-djumaev-bolot',       'mm-isakov-daniyar',      'approved'),
  ('test-ig-doubles-13', 'mm-tentimishev-esen',    'mm-moldoev-kuban',       'approved'),
  ('test-ig-doubles-13', 'mm-shamshiev-mirlan',    'mm-aitmatov-almaz',      'approved'),
  ('test-ig-doubles-13', 'mm-dzhunusov-seyit',     'mm-osmonov-talant',      'approved'),
  ('test-ig-doubles-13', 'mm-kudaibergenov-nurbek', 'mm-turduev-adilet',     'approved')
;

-- 2 waitlist pairs
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-ig-doubles-13', 'mm-junusov-maksat',    'mm-eshmatov-sultan', 'waitlist'),
  ('test-ig-doubles-13', 'mm-mamatov-arsen',     'mm-bakirov-manas',   'waitlist')
;

-- 1 solo (без партнёра)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-ig-doubles-13', 'mm-saralaev-bektur', NULL, 'waitlist')
;


-- ========== СЦЕНАРИЙ 2: 12 singles → 4 группы по 3 ==========
-- direct = 4×2 = 8, draw_size = 8, free_slots = 0
-- candidates = 4 (все 3-и), need_to_eliminate = 4
-- IG = 4 матча (4 пары по 2, отсеять 4 → wait, 4*2=8 participants, but only 4 candidates)
-- Пересчёт: candidates=4, free=0, need_to_eliminate=4, IG_match_count=4
-- participants_in_IG = 4*2 = 8 > candidates(4) → cap: participants=4, IG=2
-- auto_pass = 4 - 4 = 0, IG participants = 4, IG matches = 2
-- BUT: free_slots=0 → NO X-SLOTS! IG winners have nowhere to go.
--
-- ПРАВИЛЬНЫЙ ТЕСТ для IG: нужно free_slots > 0 но < candidates.
-- 10 singles → 4 группы (2×3 + 2×2) → direct=8, draw=8, free=0 — нет
-- 9 singles → 3 группы по 3 → direct=6, draw=8, free=2, candidates=3
--   need_to_eliminate=1, IG=1 матч, auto_pass=1
-- ОТЛИЧНО! Это самый интересный кейс.

INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type,
  court_count, match_duration, buffer_minutes, start_time,
  group_count, qualifiers_per_group,
  location, location_en, published_at
) VALUES (
  'test-ig-singles-12',
  'Тест IG singles — 9 игроков (3 группы по 3, 1 IG)',
  'Test IG singles — 9 players (3 groups of 3, 1 IG)',
  'masters', 'singles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '21 days',
  CURRENT_DATE + INTERVAL '23 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '19 days',
  12, 'round_robin',
  3, 60, 10, '09:00',
  3, 2,
  'Бишкек, Sport Life', 'Bishkek, Sport Life',
  NOW()
);

-- 9 approved singles
INSERT INTO tournament_registrations (tournament_id, player_id, status) VALUES
  ('test-ig-singles-12', 'mm-asanov-azamat',       'approved'),
  ('test-ig-singles-12', 'mm-toktogulov-bakyt',    'approved'),
  ('test-ig-singles-12', 'mm-beishenaliev-damir',  'approved'),
  ('test-ig-singles-12', 'mm-sultanov-erkin',      'approved'),
  ('test-ig-singles-12', 'mm-orozbekov-zhanybek',  'approved'),
  ('test-ig-singles-12', 'mm-ibraev-ilyas',        'approved'),
  ('test-ig-singles-12', 'mm-kalykov-kanat',       'approved'),
  ('test-ig-singles-12', 'mm-mamytov-marat',       'approved'),
  ('test-ig-singles-12', 'mm-nurgaliev-nurlan',    'approved')
;

-- 3 waitlist
INSERT INTO tournament_registrations (tournament_id, player_id, status) VALUES
  ('test-ig-singles-12', 'mm-omurbekov-ruslan',   'waitlist'),
  ('test-ig-singles-12', 'mm-tursunov-sanzhar',   'waitlist'),
  ('test-ig-singles-12', 'mm-usenov-timur',       'waitlist')
;


-- ========== СЦЕНАРИЙ 3: 16 doubles пар → 4 группы по 4 ==========
-- direct = 4×2 = 8, draw_size = 8, free = 0
-- candidates = 0 (все группы по 4, 3-е места уже сыграли 3 матча)
-- IG не нужен → прямой плей-офф

INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type,
  court_count, match_duration, buffer_minutes, start_time,
  group_count, qualifiers_per_group,
  location, location_en, published_at
) VALUES (
  'test-ig-doubles-16',
  'Тест прямой плей-офф — 16 пар (4×4)',
  'Test direct playoff — 16 pairs (4×4)',
  'masters', 'doubles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '28 days',
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '26 days',
  32, 'round_robin',
  3, 60, 10, '09:00',
  4, 2,
  'Бишкек, Asia Mall Tennis', 'Bishkek, Asia Mall Tennis',
  NOW()
);

-- 16 approved doubles pairs (all 32 mm-* players)
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-ig-doubles-16', 'mm-asanov-azamat',        'mm-toktogulov-bakyt',     'approved'),
  ('test-ig-doubles-16', 'mm-beishenaliev-damir',   'mm-sultanov-erkin',       'approved'),
  ('test-ig-doubles-16', 'mm-orozbekov-zhanybek',   'mm-ibraev-ilyas',         'approved'),
  ('test-ig-doubles-16', 'mm-kalykov-kanat',        'mm-mamytov-marat',        'approved'),
  ('test-ig-doubles-16', 'mm-nurgaliev-nurlan',     'mm-omurbekov-ruslan',     'approved'),
  ('test-ig-doubles-16', 'mm-tursunov-sanzhar',     'mm-usenov-timur',         'approved'),
  ('test-ig-doubles-16', 'mm-abdyldaev-ulan',       'mm-zhoroev-chyngyz',      'approved'),
  ('test-ig-doubles-16', 'mm-kalmurzaev-eldar',     'mm-sadykov-aibek',        'approved'),
  ('test-ig-doubles-16', 'mm-djumaev-bolot',        'mm-isakov-daniyar',       'approved'),
  ('test-ig-doubles-16', 'mm-tentimishev-esen',     'mm-moldoev-kuban',        'approved'),
  ('test-ig-doubles-16', 'mm-shamshiev-mirlan',     'mm-aitmatov-almaz',       'approved'),
  ('test-ig-doubles-16', 'mm-dzhunusov-seyit',      'mm-osmonov-talant',      'approved'),
  ('test-ig-doubles-16', 'mm-kudaibergenov-nurbek',  'mm-turduev-adilet',     'approved'),
  ('test-ig-doubles-16', 'mm-junusov-maksat',        'mm-eshmatov-sultan',    'approved'),
  ('test-ig-doubles-16', 'mm-mamatov-arsen',         'mm-bakirov-manas',      'approved'),
  ('test-ig-doubles-16', 'mm-saralaev-bektur',       'mm-ermekbaev-argen',    'approved')
;


-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.group_count || ' groups' AS groups,
  t.qualifiers_per_group AS q_per_grp,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved,
  COUNT(CASE WHEN r.status = 'waitlist' THEN 1 END) AS waitlist
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id IN ('test-ig-doubles-13', 'test-ig-singles-12', 'test-ig-doubles-16')
GROUP BY t.id, t.title, t.format, t.group_count, t.qualifiers_per_group
ORDER BY t.id;
