-- ============================================
-- FIX: Infinite recursion in profiles RLS
-- ============================================

-- 1. Создаём функцию проверки админа (обходит RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Удаляем старые проблемные политики
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full access categories" ON categories;
DROP POLICY IF EXISTS "Admin full access players" ON players;
DROP POLICY IF EXISTS "Admin full access tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admin full access matches" ON matches;
DROP POLICY IF EXISTS "Admin full access memberships" ON memberships;
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
DROP POLICY IF EXISTS "Admin full access coaches" ON coaches;
DROP POLICY IF EXISTS "Admin full access courts" ON courts;
DROP POLICY IF EXISTS "Admin full access news" ON news;

-- 3. Создаём новые политики через функцию is_admin()
CREATE POLICY "Admin full access categories" ON categories FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access players" ON players FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access tournaments" ON tournaments FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access matches" ON matches FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access memberships" ON memberships FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access payments" ON payments FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access coaches" ON coaches FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access courts" ON courts FOR ALL
    USING (public.is_admin());
CREATE POLICY "Admin full access news" ON news FOR ALL
    USING (public.is_admin());
