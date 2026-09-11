-- ============================================
-- Sponsors — contact info & social media fields
-- ============================================

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS telegram TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description_kg TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS phone TEXT;
