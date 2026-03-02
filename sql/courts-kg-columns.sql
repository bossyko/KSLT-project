-- Add Kyrgyz language columns to courts table
-- Run in Supabase SQL Editor

ALTER TABLE courts ADD COLUMN IF NOT EXISTS name_kg TEXT;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS description_kg TEXT;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS slogan_kg TEXT;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS street_kg TEXT;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS district_kg TEXT;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS city_kg TEXT;
