-- ============================================
-- KSLT Membership Admin Migration
-- Manager access + new columns for manual management
-- ============================================

-- 1. Helper function: is_staff() — admin OR manager
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. New columns for memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS note TEXT;

-- 3. New columns for payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note TEXT;

-- 4. Drop old admin-only policies for memberships and payments
DROP POLICY IF EXISTS "Admin full access memberships" ON memberships;
DROP POLICY IF EXISTS "Admin full access payments" ON payments;

-- 5. Staff (admin + manager) full access to memberships
CREATE POLICY "Staff full access memberships" ON memberships
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 6. Staff (admin + manager) full access to payments
CREATE POLICY "Staff full access payments" ON payments
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- NOTE: "Users read own membership" and "Users read own payments" policies
-- remain intact — regular users still see only their own data.
