-- ============================================
-- KSLT — Seed: Test Direct Playoff — 15 doubles pairs (3 groups × 5)
--
-- Расклад: 15 пар → 3 группы по 5
-- direct = 3 × 2 = 6, draw_size = 8, free = 2
-- Лучшие 2 из 3 третьих мест добираются по статистике (wins → set% → game%)
-- IG не нужен (группы по 5 → 3-е место сыграло 4 матча)
-- BYE = 0 (8 - 8 = 0)
-- ============================================

-- ========== Cleanup ==========
DELETE FROM matches WHERE tournament_id = 'test-direct-doubles-15';
DELETE FROM tournament_registrations WHERE tournament_id = 'test-direct-doubles-15';
DELETE FROM tournaments WHERE id = 'test-direct-doubles-15';


-- ========== Tournament ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type,
  court_count, match_duration, buffer_minutes, start_time,
  group_count, qualifiers_per_group,
  location, location_en, published_at
) VALUES (
  'test-direct-doubles-15',
  'Тест прямой плей-офф — 15 пар (3×5, добор 3-х мест)',
  'Test direct playoff — 15 pairs (3×5, best 3rds qualify)',
  'masters', 'doubles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '12 days',
  30, 'round_robin',
  3, 60, 10, '09:00',
  3, 2,
  'Бишкек, Dordoi Tennis Club', 'Bishkek, Dordoi Tennis Club',
  NOW()
);


-- ========== 15 approved doubles pairs (30 players) ==========
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-direct-doubles-15', 'mm-asanov-azamat',        'mm-toktogulov-bakyt',     'approved'),
  ('test-direct-doubles-15', 'mm-beishenaliev-damir',   'mm-sultanov-erkin',       'approved'),
  ('test-direct-doubles-15', 'mm-orozbekov-zhanybek',   'mm-ibraev-ilyas',         'approved'),
  ('test-direct-doubles-15', 'mm-kalykov-kanat',        'mm-mamytov-marat',        'approved'),
  ('test-direct-doubles-15', 'mm-nurgaliev-nurlan',     'mm-omurbekov-ruslan',     'approved'),
  ('test-direct-doubles-15', 'mm-tursunov-sanzhar',     'mm-usenov-timur',         'approved'),
  ('test-direct-doubles-15', 'mm-abdyldaev-ulan',       'mm-zhoroev-chyngyz',      'approved'),
  ('test-direct-doubles-15', 'mm-kalmurzaev-eldar',     'mm-sadykov-aibek',        'approved'),
  ('test-direct-doubles-15', 'mm-djumaev-bolot',        'mm-isakov-daniyar',       'approved'),
  ('test-direct-doubles-15', 'mm-tentimishev-esen',     'mm-moldoev-kuban',        'approved'),
  ('test-direct-doubles-15', 'mm-shamshiev-mirlan',     'mm-aitmatov-almaz',       'approved'),
  ('test-direct-doubles-15', 'mm-dzhunusov-seyit',      'mm-osmonov-talant',       'approved'),
  ('test-direct-doubles-15', 'mm-kudaibergenov-nurbek', 'mm-turduev-adilet',       'approved'),
  ('test-direct-doubles-15', 'mm-junusov-maksat',       'mm-eshmatov-sultan',      'approved'),
  ('test-direct-doubles-15', 'mm-mamatov-arsen',        'mm-bakirov-manas',        'approved')
;


-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.group_count || ' groups × ' || (COUNT(CASE WHEN r.status = 'approved' THEN 1 END) / t.group_count) || ' pairs' AS layout,
  t.qualifiers_per_group AS q_per_grp,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id = 'test-direct-doubles-15'
GROUP BY t.id, t.title, t.format, t.group_count, t.qualifiers_per_group;
