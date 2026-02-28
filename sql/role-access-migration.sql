-- ============================================
-- KSLT — Role-based Access Control: RLS Policies
-- Admin: full access to all tables
-- Manager: CRUD on tournaments, news, courts, coaches
--          READ-ONLY on players, profiles, memberships
-- ============================================

-- Helper: check if current user has a specific role
-- Usage in policies: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')

-- ============================================
-- TOURNAMENTS — admin + manager can CRUD
-- ============================================
CREATE POLICY "staff_insert_tournaments" ON tournaments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_update_tournaments" ON tournaments FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_delete_tournaments" ON tournaments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- NEWS — admin + manager can CRUD
-- ============================================
CREATE POLICY "staff_insert_news" ON news FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_update_news" ON news FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_delete_news" ON news FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- COURTS — admin + manager can CRUD
-- ============================================
CREATE POLICY "staff_insert_courts" ON courts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_update_courts" ON courts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_delete_courts" ON courts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- COACHES — admin + manager can CRUD
-- ============================================
CREATE POLICY "staff_insert_coaches" ON coaches FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_update_coaches" ON coaches FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_delete_coaches" ON coaches FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- PLAYERS — admin ONLY can modify
-- ============================================
CREATE POLICY "admin_insert_players" ON players FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_players" ON players FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_players" ON players FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POINTS_RULES — admin ONLY can modify
-- ============================================
CREATE POLICY "admin_insert_points_rules" ON points_rules FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_points_rules" ON points_rules FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_points_rules" ON points_rules FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PROMOTIONS — admin ONLY can modify
-- ============================================
CREATE POLICY "admin_insert_promotions" ON promotions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_promotions" ON promotions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_promotions" ON promotions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- MATCHES — admin + manager (for bracket management)
-- ============================================
CREATE POLICY "staff_insert_matches" ON matches FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "staff_update_matches" ON matches FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================
-- TOURNAMENT_REGISTRATIONS — admin + manager
-- ============================================
CREATE POLICY "staff_update_tournament_registrations" ON tournament_registrations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
