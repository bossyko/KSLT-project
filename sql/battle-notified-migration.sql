-- Add battle_notified_at column to challenges table
-- Tracks when broadcast notification was sent for the battle

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS battle_notified_at TIMESTAMPTZ;
