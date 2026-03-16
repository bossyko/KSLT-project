-- ============================================
-- KSLT — NTRP Rating
-- ============================================
-- Run in Supabase SQL Editor.

-- 1. Add ntrp_rating column to players (1.0 - 7.0 scale)
ALTER TABLE players ADD COLUMN IF NOT EXISTS ntrp_rating NUMERIC(3,1);

-- 2. Add NTRP history columns to rating_history
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS ntrp_before NUMERIC(4,2);
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS ntrp_after NUMERIC(4,2);
