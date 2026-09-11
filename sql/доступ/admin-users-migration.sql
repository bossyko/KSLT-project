-- ============================================
-- KSLT — Admin Users Management: RLS Policies
-- Run this migration to allow admin to manage all profiles
-- ============================================

-- Admin can read ALL profiles (regular users can only read their own)
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update ALL profiles
CREATE POLICY "admin_update_all_profiles" ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can read ALL memberships
CREATE POLICY "admin_read_all_memberships" ON memberships FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can insert memberships for any user
CREATE POLICY "admin_insert_memberships" ON memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update any membership
CREATE POLICY "admin_update_memberships" ON memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
