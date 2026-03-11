-- ============================================
-- Tournament Waitlist Migration
-- Adds 'waitlist' status to tournament_registrations
-- ============================================

-- Update CHECK constraint to include 'waitlist' status
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_status_check;
ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'waitlist'));
