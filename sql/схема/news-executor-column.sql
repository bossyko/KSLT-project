-- Add executor column to news table
-- Stores who wrote/prepared the article (staff member name)
ALTER TABLE news ADD COLUMN IF NOT EXISTS executor TEXT;
