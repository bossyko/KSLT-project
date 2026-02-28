-- Add content_images and poll columns to news table
-- content_images: [{url: "https://...", after_paragraph: 2}, ...]
-- poll: {question: "Who wins?", options: ["A", "B", "C"]} or null

ALTER TABLE news ADD COLUMN IF NOT EXISTS content_images JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN IF NOT EXISTS poll JSONB;
