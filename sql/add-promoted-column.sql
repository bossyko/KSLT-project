-- ========================================
-- Add promoted column to courts and coaches
-- Promoted = paid advertising, fixed top positions on services page
-- Run in Supabase SQL Editor
-- ========================================

-- Add promoted column
ALTER TABLE courts ADD COLUMN IF NOT EXISTS promoted boolean DEFAULT false;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS promoted boolean DEFAULT false;

-- Mark 3 courts as promoted (adjust IDs to real data as needed)
UPDATE courts SET promoted = true
WHERE id IN ('grand-slam-bishkek', 'ala-archa-tennis', 'dordoy-sport');

-- Mark 3 coaches as promoted
UPDATE coaches SET promoted = true
WHERE id IN ('smirnov-aleksey', 'kim-anna', 'orozov-timur');
