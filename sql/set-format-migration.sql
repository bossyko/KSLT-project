-- Set Format Migration: support standard + short (TB at 5-5) set formats
-- Run in Supabase SQL Editor

-- 1. Add set_format to live_matches
ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS set_format TEXT DEFAULT 'standard'
  CHECK (set_format IN ('standard', 'short'));

-- 2. Add set_format to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS set_format TEXT DEFAULT 'standard'
  CHECK (set_format IN ('standard', 'short'));
