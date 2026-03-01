-- Add gallery column to news table (array of image URLs, like courts)
ALTER TABLE news ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
