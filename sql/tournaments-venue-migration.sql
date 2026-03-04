-- Tournaments Venue & Registration Migration
-- Adds court_id reference, registration_start, renames registration_deadline → registration_end
-- Run in Supabase SQL Editor

-- 1. Add court_id column (references courts table)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS court_id text REFERENCES courts(id);

-- 2. Add registration_start date
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_start date;

-- 3. Rename registration_deadline → registration_end
ALTER TABLE tournaments RENAME COLUMN registration_deadline TO registration_end;

-- 4. Add description_kg column for Kyrgyz language
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS description_kg text;

-- 5. Add published_at for draft/publish workflow
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 6. Backfill: existing tournaments are considered published
UPDATE tournaments SET published_at = created_at WHERE published_at IS NULL;
