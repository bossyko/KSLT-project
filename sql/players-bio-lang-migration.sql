-- ============================================
-- Players Bio multilingual columns
-- ============================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS bio_en TEXT DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS bio_kg TEXT DEFAULT NULL;
