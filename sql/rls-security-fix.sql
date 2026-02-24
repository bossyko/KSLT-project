-- ============================================
-- KSLT RLS Security Fix
-- Fix overly permissive write policies
-- Restrict writes to admin/manager only
-- ============================================

-- Helper: check if current user is admin or manager
-- Used in all write policies below
-- Pattern: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))

-- ============================================
-- 1. tournament_levels — fix write policy
-- ============================================
DROP POLICY IF EXISTS "tournament_levels_write" ON tournament_levels;

CREATE POLICY "tournament_levels_admin_insert" ON tournament_levels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "tournament_levels_admin_update" ON tournament_levels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "tournament_levels_admin_delete" ON tournament_levels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- 2. points_rules — fix write policy
-- ============================================
DROP POLICY IF EXISTS "points_rules_write" ON points_rules;

CREATE POLICY "points_rules_admin_insert" ON points_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "points_rules_admin_update" ON points_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "points_rules_admin_delete" ON points_rules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- 3. tournament_results — fix write policy
-- ============================================
DROP POLICY IF EXISTS "tournament_results_write" ON tournament_results;

CREATE POLICY "tournament_results_admin_insert" ON tournament_results
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "tournament_results_admin_update" ON tournament_results
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "tournament_results_admin_delete" ON tournament_results
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- 4. player_promotions — fix write policy
-- ============================================
DROP POLICY IF EXISTS "player_promotions_write" ON player_promotions;

CREATE POLICY "player_promotions_admin_insert" ON player_promotions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "player_promotions_admin_update" ON player_promotions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "player_promotions_admin_delete" ON player_promotions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- 5. tournament_registrations — fix update/delete policies
-- ============================================
DROP POLICY IF EXISTS "registrations_update" ON tournament_registrations;
DROP POLICY IF EXISTS "registrations_delete" ON tournament_registrations;

CREATE POLICY "registrations_admin_update" ON tournament_registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "registrations_admin_delete" ON tournament_registrations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
