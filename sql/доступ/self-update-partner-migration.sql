-- Migration: Allow players to add partner to their own tournament registration
-- This lets a player who registered solo (without partner) add a partner later
-- via the public tournament page, without needing admin intervention.

-- Policy: player can UPDATE only their own registrations
-- (player_id must match the player_id linked to the authenticated user's profile)
CREATE POLICY "registrations_self_add_partner" ON tournament_registrations
  FOR UPDATE
  USING (
    player_id IN (SELECT player_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    player_id IN (SELECT player_id FROM profiles WHERE id = auth.uid())
  );
