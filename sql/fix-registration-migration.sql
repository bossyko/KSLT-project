-- ============================================
-- KSLT — Fix Registration: Trigger + Uniqueness Check
-- 1. Update handle_new_user to copy DOB, phone, gender
-- 2. RPC to check email/phone availability before signUp
-- ============================================

-- ============================================
-- 1. Update handle_new_user trigger function
--    Copy phone, gender, birth_day/month/year from metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    gender,
    birth_day,
    birth_month,
    birth_year,
    role,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    (NEW.raw_user_meta_data->>'birth_day')::int,
    (NEW.raw_user_meta_data->>'birth_month')::int,
    (NEW.raw_user_meta_data->>'birth_year')::int,
    'user',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger should already exist, but recreate just in case:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. RPC: check_registration_available
--    Returns { email_taken: bool, phone_taken: bool }
--    Called BEFORE signUp to prevent duplicates
-- ============================================

CREATE OR REPLACE FUNCTION public.check_registration_available(
  p_email text,
  p_phone text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_email_exists boolean := false;
  v_phone_exists boolean := false;
BEGIN
  -- Check email in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = lower(p_email)
  ) INTO v_email_exists;

  -- Check phone in profiles (if provided)
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE phone = p_phone
    ) INTO v_phone_exists;
  END IF;

  RETURN json_build_object(
    'email_taken', v_email_exists,
    'phone_taken', v_phone_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anonymous (not-yet-authenticated) users
GRANT EXECUTE ON FUNCTION public.check_registration_available(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_registration_available(text, text) TO authenticated;
