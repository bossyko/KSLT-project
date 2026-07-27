-- ============================================
-- KSLT — Seed: Lady's Cup (PDF format)
-- 19 doubles pairs: 1 group × 4 + 5 groups × 3
-- 6 groups, RR → playoff 16
-- Short set format (TB at 5-5)
-- ============================================

-- ========== Cleanup ==========
DELETE FROM matches WHERE tournament_id = 'test-ladyscup-6x3';
DELETE FROM tournament_registrations WHERE tournament_id = 'test-ladyscup-6x3';
DELETE FROM tournaments WHERE id = 'test-ladyscup-6x3';

-- ========== Tournament ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type, draw_size,
  group_count, qualifiers_per_group,
  court_count, match_duration, buffer_minutes, start_time,
  set_format,
  location, location_en, published_at
) VALUES (
  'test-ladyscup-6x3',
  'Lady''s Cup — 6 групп (4+3+3+3+3+3)',
  'Lady''s Cup — 6 groups (4+3+3+3+3+3)',
  'futures', 'doubles', 'women', 'registration_open',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '12 days',
  19, 'round_robin', 16,
  6, 2,
  3, 60, 10, '09:00',
  'short',
  'Бишкек, Dordoi Tennis Club', 'Bishkek, Dordoi Tennis Club',
  NOW()
);

-- ========== 19 approved doubles pairs (38 players) ==========
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
-- Группа A: 4 пары
  ('test-ladyscup-6x3', 'mm-asanov-azamat',        'mm-toktogulov-bakyt',     'approved'),
  ('test-ladyscup-6x3', 'mm-beishenaliev-damir',   'mm-sultanov-erkin',       'approved'),
  ('test-ladyscup-6x3', 'mm-orozbekov-zhanybek',   'mm-ibraev-ilyas',         'approved'),
  ('test-ladyscup-6x3', 'baisalov-murat',          'sheraliev-mirlan',        'approved'),
-- Группа B: 3 пары
  ('test-ladyscup-6x3', 'mm-kalykov-kanat',        'mm-mamytov-marat',        'approved'),
  ('test-ladyscup-6x3', 'mm-nurgaliev-nurlan',     'mm-omurbekov-ruslan',     'approved'),
  ('test-ladyscup-6x3', 'mm-tursunov-sanzhar',     'mm-usenov-timur',         'approved'),
-- Группа C: 3 пары
  ('test-ladyscup-6x3', 'mm-abdyldaev-ulan',       'mm-zhoroev-chyngyz',      'approved'),
  ('test-ladyscup-6x3', 'mm-kalmurzaev-eldar',     'mm-sadykov-aibek',        'approved'),
  ('test-ladyscup-6x3', 'mm-djumaev-bolot',        'mm-isakov-daniyar',       'approved'),
-- Группа D: 3 пары
  ('test-ladyscup-6x3', 'mm-tentimishev-esen',     'mm-moldoev-kuban',        'approved'),
  ('test-ladyscup-6x3', 'mm-shamshiev-mirlan',     'mm-aitmatov-almaz',       'approved'),
  ('test-ladyscup-6x3', 'mm-dzhunusov-seyit',      'mm-osmonov-talant',       'approved'),
-- Группа E: 3 пары
  ('test-ladyscup-6x3', 'mm-kudaibergenov-nurbek', 'mm-turduev-adilet',       'approved'),
  ('test-ladyscup-6x3', 'mm-junusov-maksat',       'mm-eshmatov-sultan',      'approved'),
  ('test-ladyscup-6x3', 'mm-mamatov-arsen',        'mm-bakirov-manas',        'approved'),
-- Группа F: 3 пары
  ('test-ladyscup-6x3', 'mm-saralaev-bektur',      'mm-ermekbaev-argen',      'approved'),
  ('test-ladyscup-6x3', 'sultanov-aybek',          'dzhumagulov-kanat',       'approved'),
  ('test-ladyscup-6x3', 'bolotov-askar',           'bakirov-ruslan',          'approved')
;

-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.set_format,
  t.bracket_type,
  t.draw_size,
  t.group_count,
  t.qualifiers_per_group,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved_pairs
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id = 'test-ladyscup-6x3'
GROUP BY t.id, t.title, t.format, t.set_format, t.bracket_type, t.draw_size, t.group_count, t.qualifiers_per_group;
