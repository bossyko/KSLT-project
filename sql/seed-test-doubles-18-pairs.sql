-- ============================================
-- KSLT — Seed: Test 18 doubles pairs (no groups set)
-- Tournament with registrations only, admin decides format
-- 18 пар → варианты: 6×3, 4×4+2×1 и тд
-- ============================================

-- ========== Cleanup ==========
DELETE FROM matches WHERE tournament_id = 'test-doubles-18';
DELETE FROM tournament_registrations WHERE tournament_id = 'test-doubles-18';
DELETE FROM tournaments WHERE id = 'test-doubles-18';

-- ========== Tournament (no group_count, no qualifiers) ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type,
  court_count, match_duration, buffer_minutes, start_time,
  location, location_en, published_at
) VALUES (
  'test-doubles-18',
  'Тест — 18 пар (без групп)',
  'Test — 18 pairs (no groups)',
  'masters', 'doubles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '12 days',
  36, 'round_robin',
  3, 60, 10, '09:00',
  'Бишкек, Dordoi Tennis Club', 'Bishkek, Dordoi Tennis Club',
  NOW()
);

-- ========== 18 approved doubles pairs (36 players) ==========
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-18', 'mm-asanov-azamat',        'mm-toktogulov-bakyt',     'approved'),
  ('test-doubles-18', 'mm-beishenaliev-damir',   'mm-sultanov-erkin',       'approved'),
  ('test-doubles-18', 'mm-orozbekov-zhanybek',   'mm-ibraev-ilyas',         'approved'),
  ('test-doubles-18', 'mm-kalykov-kanat',        'mm-mamytov-marat',        'approved'),
  ('test-doubles-18', 'mm-nurgaliev-nurlan',     'mm-omurbekov-ruslan',     'approved'),
  ('test-doubles-18', 'mm-tursunov-sanzhar',     'mm-usenov-timur',         'approved'),
  ('test-doubles-18', 'mm-abdyldaev-ulan',       'mm-zhoroev-chyngyz',      'approved'),
  ('test-doubles-18', 'mm-kalmurzaev-eldar',     'mm-sadykov-aibek',        'approved'),
  ('test-doubles-18', 'mm-djumaev-bolot',        'mm-isakov-daniyar',       'approved'),
  ('test-doubles-18', 'mm-tentimishev-esen',     'mm-moldoev-kuban',        'approved'),
  ('test-doubles-18', 'mm-shamshiev-mirlan',     'mm-aitmatov-almaz',       'approved'),
  ('test-doubles-18', 'mm-dzhunusov-seyit',      'mm-osmonov-talant',       'approved'),
  ('test-doubles-18', 'mm-kudaibergenov-nurbek', 'mm-turduev-adilet',       'approved'),
  ('test-doubles-18', 'mm-junusov-maksat',       'mm-eshmatov-sultan',      'approved'),
  ('test-doubles-18', 'mm-mamatov-arsen',        'mm-bakirov-manas',        'approved'),
  ('test-doubles-18', 'mm-saralaev-bektur',      'mm-ermekbaev-argen',      'approved'),
  ('test-doubles-18', 'sultanov-aybek',          'dzhumagulov-kanat',       'approved'),
  ('test-doubles-18', 'bolotov-askar',           'bakirov-ruslan',          'approved')
;

-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.group_count,
  t.qualifiers_per_group,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved_pairs
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id = 'test-doubles-18'
GROUP BY t.id, t.title, t.format, t.group_count, t.qualifiers_per_group;
