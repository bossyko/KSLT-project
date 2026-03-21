-- ============================================
-- Voucher System Migration
-- Run in Supabase SQL Editor
-- ============================================

-- 1. New columns on courts & coaches
ALTER TABLE courts ADD COLUMN IF NOT EXISTS partner_pin TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS partner BOOLEAN DEFAULT false;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS partner_pin TEXT;

-- 2. Partner services (unified table, entity_type pattern)
CREATE TABLE IF NOT EXISTS partner_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('court', 'coach')),
    entity_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_name_en TEXT,
    service_name_kg TEXT,
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Discount vouchers
CREATE TABLE IF NOT EXISTS discount_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES auth.users(id),
    player_name TEXT,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('court', 'coach')),
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    service_id UUID REFERENCES partner_services(id),
    service_name TEXT NOT NULL,
    discount_percent INT NOT NULL,
    qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','used','expired','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ,
    confirmed_by_ip TEXT
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_qr_token ON discount_vouchers(qr_token);
CREATE INDEX IF NOT EXISTS idx_vouchers_profile_status ON discount_vouchers(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_vouchers_entity ON discount_vouchers(entity_type, entity_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_services_entity ON partner_services(entity_type, entity_id);

-- 5. RLS for partner_services (public read, staff write)
ALTER TABLE partner_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_services_public_read" ON partner_services
    FOR SELECT USING (true);

CREATE POLICY "partner_services_staff_insert" ON partner_services
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

CREATE POLICY "partner_services_staff_update" ON partner_services
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

CREATE POLICY "partner_services_staff_delete" ON partner_services
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

-- 6. RLS for discount_vouchers (user reads own, staff reads all)
ALTER TABLE discount_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_user_read_own" ON discount_vouchers
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "vouchers_staff_read_all" ON discount_vouchers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

CREATE POLICY "vouchers_user_insert_own" ON discount_vouchers
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "vouchers_staff_update" ON discount_vouchers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

-- ============================================
-- RPC: generate_voucher
-- Called by authenticated member to create a voucher
-- ============================================
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

    -- Check active membership
    SELECT EXISTS (
        SELECT 1 FROM memberships
        WHERE profile_id = v_user_id
          AND status = 'active'
          AND expires_at > NOW()
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RETURN json_build_object('error', 'not_member');
    END IF;

    -- Get player name from profile
    SELECT COALESCE(full_name, first_name || ' ' || last_name, 'Member')
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

-- ============================================
-- RPC: verify_voucher
-- Public — called from verify page (no auth required)
-- ============================================
CREATE OR REPLACE FUNCTION verify_voucher(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v RECORD;
BEGIN
    SELECT * INTO v
    FROM discount_vouchers
    WHERE qr_token = p_token;

    IF v IS NULL THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Auto-expire
    IF v.status = 'active' AND v.expires_at < NOW() THEN
        UPDATE discount_vouchers SET status = 'expired' WHERE id = v.id;
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status = 'used' THEN
        RETURN json_build_object(
            'status', 'already_used',
            'used_at', v.used_at
        );
    END IF;

    IF v.status = 'expired' THEN
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status = 'cancelled' THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Active voucher
    RETURN json_build_object(
        'status', 'valid',
        'player_name', v.player_name,
        'entity_type', v.entity_type,
        'entity_name', v.entity_name,
        'service_name', v.service_name,
        'discount_percent', v.discount_percent,
        'expires_at', v.expires_at,
        'created_at', v.created_at
    );
END;
$$;

-- ============================================
-- RPC: confirm_voucher
-- Called from verify page by court/coach admin with PIN
-- ============================================
CREATE OR REPLACE FUNCTION confirm_voucher(p_token TEXT, p_pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v RECORD;
    v_correct_pin TEXT;
BEGIN
    SELECT * INTO v
    FROM discount_vouchers
    WHERE qr_token = p_token;

    IF v IS NULL THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Auto-expire
    IF v.status = 'active' AND v.expires_at < NOW() THEN
        UPDATE discount_vouchers SET status = 'expired' WHERE id = v.id;
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status <> 'active' THEN
        RETURN json_build_object('status', v.status);
    END IF;

    -- Check PIN
    IF v.entity_type = 'court' THEN
        SELECT partner_pin INTO v_correct_pin FROM courts WHERE id = v.entity_id;
    ELSE
        SELECT partner_pin INTO v_correct_pin FROM coaches WHERE id = v.entity_id;
    END IF;

    IF v_correct_pin IS NULL OR p_pin <> v_correct_pin THEN
        RETURN json_build_object('status', 'wrong_pin');
    END IF;

    -- Mark as used
    UPDATE discount_vouchers
    SET status = 'used', used_at = NOW()
    WHERE id = v.id;

    RETURN json_build_object('status', 'confirmed');
END;
$$;

-- Grant execute to anon (verify_voucher needs public access)
GRANT EXECUTE ON FUNCTION verify_voucher(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_voucher(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_voucher(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION confirm_voucher(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_voucher(TEXT, TEXT, UUID) TO authenticated;
