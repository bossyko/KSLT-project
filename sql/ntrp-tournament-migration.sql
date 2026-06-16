-- ============================================
-- NTRP Tournament Validation + Gender Field Migration
-- ============================================

-- Add NTRP range fields to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ntrp_min NUMERIC;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ntrp_max NUMERIC;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS ntrp_combined_max NUMERIC;

-- Add gender field to tournaments (men/women/mixed)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('men', 'women', 'mixed'));
