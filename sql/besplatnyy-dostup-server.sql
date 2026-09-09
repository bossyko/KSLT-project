-- ============================================================
-- Бесплатный период: чтобы сервер тоже про него знал
-- ============================================================
--
-- Дату мы завели в app_settings, и сайт с приложением её читают. Но часть
-- проверок живёт на сервере: скидки у партнёров выдаёт функция базы, вызов на
-- баттл заводит другая. Они смотрят только в таблицу членств и про
-- бесплатный период не знают — поэтому скидка отвечала «требуется членство».
--
-- Здесь одна общая функция «идёт ли бесплатный период» и две правки: скидки и
-- вызовы. Условие простое — членство есть ИЛИ идёт бесплатный период.
--
-- Запись на турнир и приглашение на игру проверяются не в базе, а в
-- функциях Supabase (tournament-register, send-game-invite) — их правит
-- отдельная выкладка.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Общая проверка ----

CREATE OR REPLACE FUNCTION public.бесплатный_доступ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT (value #>> '{}')::date >= current_date
           FROM public.app_settings
          WHERE key = 'free_access_until'
            AND value IS NOT NULL
            AND value::text <> 'null'),
        false);
$$;

COMMENT ON FUNCTION public.бесплатный_доступ() IS
    'Идёт ли сейчас бесплатный период: дату ставит администратор в админке, Настройки → Доступ.';

GRANT EXECUTE ON FUNCTION public.бесплатный_доступ() TO anon, authenticated, service_role;

COMMIT;

-- ---- Скидки у партнёров ----
--
-- В generate_voucher условие «нет членства → отказ» дополняем бесплатным
-- периодом. Тело функции не переписываем целиком: меняем только проверку.

CREATE OR REPLACE FUNCTION public.voucher_membership_ok(p_profile uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.бесплатный_доступ()
        OR EXISTS (SELECT 1 FROM memberships
                    WHERE profile_id = p_profile
                      AND status = 'active'
                      AND expires_at > now());
$$;

COMMENT ON FUNCTION public.voucher_membership_ok(uuid) IS
    'Можно ли выдавать скидку: есть членство или идёт бесплатный период.';

GRANT EXECUTE ON FUNCTION public.voucher_membership_ok(uuid) TO anon, authenticated, service_role;

-- ---- Скидки: функция целиком, с новой проверкой ----

CREATE OR REPLACE FUNCTION generate_voucher(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_service_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_player_name TEXT;
    v_entity_name TEXT;
    v_service RECORD;
    v_existing INT;
    v_voucher RECORD;
    v_is_member BOOLEAN;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'not_authenticated');
    END IF;

    -- Членство или бесплатный период: в бесплатный период скидки доступны
    -- всем, кто вошёл, — так решает администратор в Настройках → Доступ.
    SELECT public.voucher_membership_ok(v_user_id) INTO v_is_member;

    IF NOT v_is_member THEN
        RETURN json_build_object('error', 'not_member');
    END IF;

    -- Get player name from profile
    SELECT COALESCE(full_name, 'Member')
    INTO v_player_name
    FROM profiles WHERE id = v_user_id;

    -- Check service exists and is active
    SELECT * INTO v_service
    FROM partner_services
    WHERE id = p_service_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND is_active = true;

    IF v_service IS NULL THEN
        RETURN json_build_object('error', 'service_not_found');
    END IF;

    -- Get entity name
    IF p_entity_type = 'court' THEN
        SELECT name INTO v_entity_name FROM courts WHERE id = p_entity_id AND partner = true;
    ELSE
        SELECT COALESCE(last_name || ' ' || first_name, name) INTO v_entity_name
        FROM coaches WHERE id = p_entity_id AND partner = true;
    END IF;

    IF v_entity_name IS NULL THEN
        RETURN json_build_object('error', 'entity_not_partner');
    END IF;

    -- Auto-expire old vouchers for this specific service
    UPDATE discount_vouchers
    SET status = 'expired'
    WHERE profile_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND service_id = p_service_id
      AND status = 'active'
      AND expires_at < NOW();

    -- Check 1: Block if active voucher exists for this exact service
    SELECT COUNT(*) INTO v_existing
    FROM discount_vouchers
    WHERE profile_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND service_id = p_service_id
      AND status = 'active'
      AND expires_at > NOW();

    IF v_existing > 0 THEN
        RETURN json_build_object('error', 'active_voucher_exists');
    END IF;

    -- Check 2: Daily limit per service (prevents use-and-repeat abuse)
    SELECT COUNT(*) INTO v_existing
    FROM discount_vouchers
    WHERE profile_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND service_id = p_service_id
      AND created_at > NOW() - INTERVAL '24 hours'
      AND status IN ('active', 'used');

    IF v_existing > 0 THEN
        RETURN json_build_object('error', 'daily_limit');
    END IF;

    -- Create voucher
    INSERT INTO discount_vouchers (
        profile_id, player_name, entity_type, entity_id, entity_name,
        service_id, service_name, discount_percent
    ) VALUES (
        v_user_id, v_player_name, p_entity_type, p_entity_id, v_entity_name,
        p_service_id, v_service.service_name, v_service.discount_percent
    )
    RETURNING * INTO v_voucher;

    RETURN json_build_object(
        'success', true,
        'voucher', json_build_object(
            'id', v_voucher.id,
            'qr_token', v_voucher.qr_token,
            'player_name', v_voucher.player_name,
            'entity_name', v_voucher.entity_name,
            'service_name', v_voucher.service_name,
            'discount_percent', v_voucher.discount_percent,
            'expires_at', v_voucher.expires_at,
            'created_at', v_voucher.created_at
        )
    );
END;
$$;

-- ---- Вызов на баттл: функция целиком, с новой проверкой ----

CREATE OR REPLACE FUNCTION "public"."create_challenge"(
    "p_opponent_player_id" "text", "p_message" "text" DEFAULT NULL)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    me            profiles%ROWTYPE;
    opp_profile   uuid;
    pending_count int;
    new_id        uuid;
BEGIN
    SELECT * INTO me FROM profiles WHERE id = auth.uid();
    IF me.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;
    IF me.player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'no_player');
    END IF;
    IF me.player_id = p_opponent_player_id THEN
        RETURN jsonb_build_object('error', 'self_challenge');
    END IF;

    -- Вызов на баттл — привилегия членства, а не всякой учётной записи.
    -- Сотрудникам клуба разрешено без членства: им заводить показательные
    -- матчи по должности
    IF me.role NOT IN ('admin', 'manager')
       AND NOT public.бесплатный_доступ()
       AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.profile_id = me.id AND m.status = 'active'
          AND (m.expires_at IS NULL OR m.expires_at >= current_date)
    ) THEN
        RETURN jsonb_build_object('error', 'not_member');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_opponent_player_id) THEN
        RETURN jsonb_build_object('error', 'opponent_not_found');
    END IF;

    -- Спам — это не «много вызовов», а много неотвеченных разом. Ответили
    -- или срок вышел — место освободилось
    SELECT count(*) INTO pending_count
    FROM challenges
    WHERE challenger_id = me.id AND status = 'active' AND expires_at > now();

    IF pending_count >= 3 THEN
        RETURN jsonb_build_object('error', 'too_many_pending', 'pending', pending_count);
    END IF;

    -- Один неотвеченный вызов на человека: второй — это уже напоминание.
    -- Смотрим в обе стороны: если он уже позвал тебя, встречный вызов —
    -- это тот же матч, только заведённый дважды
    IF EXISTS (
        SELECT 1 FROM challenges
        WHERE status = 'active' AND expires_at > now()
          AND ((challenger_player_id = me.player_id AND opponent_player_id = p_opponent_player_id)
            OR (challenger_player_id = p_opponent_player_id AND opponent_player_id = me.player_id))
    ) THEN
        RETURN jsonb_build_object('error', 'already_pending');
    END IF;

    -- Вызов принят, но матч ещё не сыгран — звать снова некуда: игра уже
    -- назначена. Отказ, наоборот, ничего не запрещает: человек мог нажать
    -- случайно или передумать
    IF EXISTS (
        SELECT 1 FROM challenges
        WHERE status = 'accepted'
          AND ((challenger_player_id = me.player_id AND opponent_player_id = p_opponent_player_id)
            OR (challenger_player_id = p_opponent_player_id AND opponent_player_id = me.player_id))
    ) THEN
        RETURN jsonb_build_object('error', 'match_pending');
    END IF;

    SELECT id INTO opp_profile FROM profiles WHERE player_id = p_opponent_player_id LIMIT 1;

    INSERT INTO challenges (challenger_id, challenger_player_id,
                            opponent_player_id, opponent_profile_id,
                            message, status, expires_at)
    VALUES (me.id, me.player_id, p_opponent_player_id, opp_profile,
            nullif(btrim(coalesce(p_message, '')), ''), 'active',
            now() + interval '10 days')
    RETURNING id INTO new_id;

    RETURN jsonb_build_object('ok', true, 'challenge_id', new_id,
                              'opponent_profile_id', opp_profile);
END;
$$;

-- ---- Проверка ----

SELECT public.бесплатный_доступ() AS идёт_бесплатный_период;

