-- ============================================
-- KSLT — Auth Telegram Migration
-- Убираем обязательность телефона при регистрации,
-- обновляем check_registration_available (убираем phone_taken)
-- ============================================

-- 1. Обновить функцию check_registration_available: убрать проверку телефона
CREATE OR REPLACE FUNCTION public.check_registration_available(p_email text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_email_taken boolean := false;
BEGIN
  -- Check email in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = lower(p_email)
  ) INTO v_email_taken;

  RETURN jsonb_build_object('email_taken', v_email_taken);
END;
$$;

-- 2. Убрать старую версию с двумя параметрами (если существует)
DROP FUNCTION IF EXISTS public.check_registration_available(text, text);

-- 3. Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.check_registration_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_registration_available(text) TO authenticated;
