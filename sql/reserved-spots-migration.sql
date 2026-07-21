-- Reserved Spots Migration
-- Adds reserved_spots column to tournaments table
-- Reserved spots reduce available slots for online registration

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reserved_spots INTEGER DEFAULT 0;
