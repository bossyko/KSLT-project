-- ============================================
-- KSLT — Seed: Test 9 doubles pairs, SHORT set format (TB at 5-5)
-- Нечётное количество пар, формат сета «короткий»
-- ============================================

-- ========== Cleanup ==========
DELETE FROM matches WHERE tournament_id = 'test-doubles-9-short';
DELETE FROM tournament_registrations WHERE tournament_id = 'test-doubles-9-short';
DELETE FROM tournaments WHERE id = 'test-doubles-9-short';

-- ========== Tournament ==========
INSERT INTO tournaments (
  id, title, title_en, category_id, format, gender, status,
  date_start, date_end, registration_start, registration_end,
  max_participants, bracket_type, draw_size,
  court_count, match_duration, buffer_minutes, start_time,
  set_format,
  location, location_en, published_at
) VALUES (
  'test-doubles-9-short',
  'Тест — 9 пар, короткий формат',
  'Test — 9 pairs, short format',
  'masters', 'doubles', 'men', 'registration_open',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '12 days',
  18, 'single_elimination', 16,
  2, 60, 10, '09:00',
  'short',
  'Бишкек, Dordoi Tennis Club', 'Bishkek, Dordoi Tennis Club',
  NOW()
);

-- ========== 9 approved doubles pairs (18 players) ==========
INSERT INTO tournament_registrations (tournament_id, player_id, partner_id, status) VALUES
  ('test-doubles-9-short', 'mm-asanov-azamat',        'mm-toktogulov-bakyt',     'approved'),
  ('test-doubles-9-short', 'mm-beishenaliev-damir',   'mm-sultanov-erkin',       'approved'),
  ('test-doubles-9-short', 'mm-orozbekov-zhanybek',   'mm-ibraev-ilyas',         'approved'),
  ('test-doubles-9-short', 'mm-kalykov-kanat',        'mm-mamytov-marat',        'approved'),
  ('test-doubles-9-short', 'mm-nurgaliev-nurlan',     'mm-omurbekov-ruslan',     'approved'),
  ('test-doubles-9-short', 'mm-tursunov-sanzhar',     'mm-usenov-timur',         'approved'),
  ('test-doubles-9-short', 'mm-abdyldaev-ulan',       'mm-zhoroev-chyngyz',      'approved'),
  ('test-doubles-9-short', 'mm-kalmurzaev-eldar',     'mm-sadykov-aibek',        'approved'),
  ('test-doubles-9-short', 'mm-djumaev-bolot',        'mm-isakov-daniyar',       'approved')
;

-- ========== VERIFY ==========
SELECT
  t.id,
  t.title,
  t.format,
  t.set_format,
  t.bracket_type,
  t.draw_size,
  COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved_pairs
FROM tournaments t
LEFT JOIN tournament_registrations r ON r.tournament_id = t.id
WHERE t.id = 'test-doubles-9-short'
GROUP BY t.id, t.title, t.format, t.set_format, t.bracket_type, t.draw_size;
