-- ============================================
-- Ответ на приглашение поиграть и обмен контактами
-- ============================================
--
-- До сих пор ответить можно было только кнопками в Телеграм-боте, и он же
-- раздавал ссылки на переписку. Решили иначе: бот присылает оповещение со
-- ссылкой, а принимают на сайте или в приложении — там, где человек видит,
-- на что соглашается. Через Телеграм личные данные больше не ходят.
--
-- Обмен взаимный. Отправляя приглашение, человек уже раскрыл себя: имя
-- видно получателю, и тот решает, зная, кто перед ним. Если бы контакты
-- получал только отправитель, второй остался бы в подвешенном состоянии —
-- ему написали, а ответить некуда.
--
-- Отдаём все заполненные контакты, не глядя на галочки «показывать
-- другим». Те галочки про открытый показ всему клубу, а здесь согласие
-- дано адресно, одному человеку. Иначе вышла бы глупость: согласился, а
-- собеседник увидел пустую карточку.

BEGIN;

-- ============================================
-- 1. Ответить на приглашение
-- ============================================
-- Отвечает только получатель и только на своё приглашение, ждущее ответа.
-- Возвращает контакты второй стороны — при согласии.

CREATE OR REPLACE FUNCTION public.respond_game_invite(p_invite_id uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite    game_invites%ROWTYPE;
  v_me        uuid := auth.uid();
  v_contacts  jsonb;
BEGIN
  IF v_me IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT * INTO v_invite FROM game_invites WHERE id = p_invite_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Отвечает тот, кому написали. Отправитель ответить за него не может
  IF v_invite.receiver_profile_id IS DISTINCT FROM v_me THEN
    RETURN jsonb_build_object('error', 'not_yours');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'already_answered', 'status', v_invite.status);
  END IF;

  UPDATE game_invites
     SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
         responded_at = now()
   WHERE id = p_invite_id;

  IF NOT p_accept THEN
    RETURN jsonb_build_object('success', true, 'status', 'declined');
  END IF;

  -- Согласился — отдаём контакты отправителя
  SELECT jsonb_build_object(
           'full_name', pr.full_name,
           'avatar_url', pr.avatar_url,
           'phone', NULLIF(pr.phone, ''),
           'whatsapp', NULLIF(COALESCE(pr.whatsapp_phone, pr.phone), ''),
           'telegram', NULLIF(pr.telegram, ''),
           'instagram', NULLIF(pr.instagram, '')
         )
    INTO v_contacts
    FROM profiles pr
   WHERE pr.id = v_invite.sender_id;

  RETURN jsonb_build_object('success', true, 'status', 'accepted', 'contacts', v_contacts);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_game_invite(uuid, boolean) TO authenticated;

-- ============================================
-- 2. Контакты по принятому приглашению
-- ============================================
-- Чтобы обе стороны могли открыть карточку позже, из истории. Отдаём
-- только участникам и только если приглашение принято.

CREATE OR REPLACE FUNCTION public.get_invite_contacts(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite  game_invites%ROWTYPE;
  v_me      uuid := auth.uid();
  v_other   uuid;
  v_result  jsonb;
BEGIN
  IF v_me IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT * INTO v_invite FROM game_invites WHERE id = p_invite_id;

  IF NOT FOUND OR v_invite.status <> 'accepted' THEN
    RETURN jsonb_build_object('error', 'not_available');
  END IF;

  -- Собеседник — тот из двоих, кто не я
  IF v_invite.sender_id = v_me THEN
    v_other := v_invite.receiver_profile_id;
  ELSIF v_invite.receiver_profile_id = v_me THEN
    v_other := v_invite.sender_id;
  ELSE
    RETURN jsonb_build_object('error', 'not_yours');
  END IF;

  SELECT jsonb_build_object(
           'full_name', pr.full_name,
           'avatar_url', pr.avatar_url,
           'phone', NULLIF(pr.phone, ''),
           'whatsapp', NULLIF(COALESCE(pr.whatsapp_phone, pr.phone), ''),
           'telegram', NULLIF(pr.telegram, ''),
           'instagram', NULLIF(pr.instagram, '')
         )
    INTO v_result
    FROM profiles pr
   WHERE pr.id = v_other;

  RETURN jsonb_build_object('success', true, 'contacts', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_contacts(uuid) TO authenticated;

COMMIT;

-- ============================================
-- Проверка
-- ============================================
-- Чужое приглашение отвечать нельзя — должно вернуть not_yours:
-- SELECT public.respond_game_invite('00000000-0000-0000-0000-000000000000', true);
