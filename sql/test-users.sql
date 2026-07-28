-- ============================================
-- Test users for testing user→player flow
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- Step 1: Clean up previous test users (if any)
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('azamat.test@kslt.kg', 'elena.test@kslt.kg', 'nurlan.test@kslt.kg')
);
DELETE FROM memberships WHERE profile_id IN (
  SELECT id FROM profiles WHERE email IN ('azamat.test@kslt.kg', 'elena.test@kslt.kg', 'nurlan.test@kslt.kg')
);
DELETE FROM profiles WHERE email IN ('azamat.test@kslt.kg', 'elena.test@kslt.kg', 'nurlan.test@kslt.kg');
DELETE FROM auth.users WHERE email IN ('azamat.test@kslt.kg', 'elena.test@kslt.kg', 'nurlan.test@kslt.kg');

-- Step 2: Create fresh test users
-- Auth trigger auto-creates profiles, so we UPDATE after INSERT

DO $$
DECLARE
  uid1 uuid := gen_random_uuid();
  uid2 uuid := gen_random_uuid();
  uid3 uuid := gen_random_uuid();
BEGIN
  -- Test User 1: Азамат Бекболотов (male)
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (uid1, '00000000-0000-0000-0000-000000000000', 'azamat.test@kslt.kg',
    crypt('Test123456!', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated');
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), uid1, uid1, jsonb_build_object('sub', uid1, 'email', 'azamat.test@kslt.kg'), 'email', now(), now(), now());
  UPDATE profiles SET full_name = 'Азамат Бекболотов', gender = 'male' WHERE id = uid1;

  -- Test User 2: Елена Петрова (female)
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (uid2, '00000000-0000-0000-0000-000000000000', 'elena.test@kslt.kg',
    crypt('Test123456!', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated');
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), uid2, uid2, jsonb_build_object('sub', uid2, 'email', 'elena.test@kslt.kg'), 'email', now(), now(), now());
  UPDATE profiles SET full_name = 'Елена Петрова', gender = 'female' WHERE id = uid2;

  -- Test User 3: Нурлан Исаков (male)
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
  VALUES (uid3, '00000000-0000-0000-0000-000000000000', 'nurlan.test@kslt.kg',
    crypt('Test123456!', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated');
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), uid3, uid3, jsonb_build_object('sub', uid3, 'email', 'nurlan.test@kslt.kg'), 'email', now(), now(), now());
  UPDATE profiles SET full_name = 'Нурлан Исаков', gender = 'male' WHERE id = uid3;

  RAISE NOTICE 'Created 3 test users: %, %, %', uid1, uid2, uid3;
END $$;
