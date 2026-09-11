-- ============================================
-- Sponsors table migration
-- ============================================

CREATE TABLE sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  url TEXT,
  is_hero BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "sponsors_read" ON sponsors FOR SELECT USING (true);

-- Admin/Manager write
CREATE POLICY "sponsors_admin_insert" ON sponsors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);
CREATE POLICY "sponsors_admin_update" ON sponsors FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);
CREATE POLICY "sponsors_admin_delete" ON sponsors FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);
