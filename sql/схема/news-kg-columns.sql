-- Add KG language columns to news table
ALTER TABLE news ADD COLUMN IF NOT EXISTS content_kg TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_kg TEXT;
