-- OTP Verification Tables Migration
-- Run in Supabase SQL Editor

-- 1. OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,                          -- email or phone (normalized)
    code TEXT NOT NULL,                                 -- SHA-256 hash of 6-digit code
    flow TEXT NOT NULL CHECK (flow IN ('forgot_password', 'register', 'telegram_register')),
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email')),
    attempts INT DEFAULT 0,                            -- max 3 before invalidation
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,                   -- created_at + 10 min
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. OTP blocks table (progressive blocking)
CREATE TABLE IF NOT EXISTS otp_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    block_key TEXT NOT NULL UNIQUE,                     -- identifier:ip
    request_count INT DEFAULT 1,
    blocked_until TIMESTAMPTZ,
    escalation INT DEFAULT 0,                          -- 0→15min, 1→1hr, 2→24hr
    admin_unblocked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes (identifier, flow, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_blocks_key ON otp_blocks (block_key);
CREATE INDEX IF NOT EXISTS idx_otp_blocks_until ON otp_blocks (blocked_until);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_blocks ENABLE ROW LEVEL SECURITY;

-- No public policies — access only via service_role
-- (Edge Functions use service_role key to bypass RLS)

-- Cleanup function: remove expired codes older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < now() - interval '24 hours';
    DELETE FROM otp_blocks WHERE blocked_until < now() - interval '24 hours' AND admin_unblocked = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
