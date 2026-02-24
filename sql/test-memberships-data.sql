-- ============================================
-- KSLT — Test Memberships Data
-- Run in Supabase SQL Editor
-- DELETE after testing!
-- ============================================

-- Get existing profile ID
DO $$
DECLARE
  pid UUID;
  mem_id UUID;
BEGIN
  SELECT id INTO pid FROM profiles LIMIT 1;

  -- 1. Active + paid + expiring in 5 days
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'active', NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', 'Тест: скоро истекает')
  RETURNING id INTO mem_id;

  INSERT INTO payments (profile_id, membership_id, amount, payment_method, currency, status)
  VALUES (pid, mem_id, 1000, 'cash', 'KGS', 'completed');

  -- 2. Active + unpaid (долг)
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'active', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'Тест: долг');

  -- 3. Active + paid + expiring in 3 days (critical)
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'active', NOW() - INTERVAL '27 days', NOW() + INTERVAL '3 days', 'Тест: критично')
  RETURNING id INTO mem_id;

  INSERT INTO payments (profile_id, membership_id, amount, payment_method, currency, status)
  VALUES (pid, mem_id, 1000, 'transfer', 'KGS', 'completed');

  -- 4. Expired
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'expired', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', 'Тест: истекло');

  -- 5. Cancelled
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'cancelled', NOW() - INTERVAL '30 days', NOW() + INTERVAL '1 day', 'Тест: отменено');

  -- 6. Active + paid + 58 days left (normal)
  INSERT INTO memberships (id, profile_id, status, starts_at, expires_at, note)
  VALUES (gen_random_uuid(), pid, 'active', NOW(), NOW() + INTERVAL '58 days', 'Тест: нормальный')
  RETURNING id INTO mem_id;

  INSERT INTO payments (profile_id, membership_id, amount, payment_method, currency, status)
  VALUES (pid, mem_id, 1000, 'card', 'KGS', 'completed');

END $$;
