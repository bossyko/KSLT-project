-- Add social media and privacy fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS telegram TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS show_socials BOOLEAN DEFAULT false;
