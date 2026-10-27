-- ============================================
-- Entity Payments — Promoted / Sponsorship / Rental payments
-- ============================================

CREATE TABLE IF NOT EXISTS entity_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- СПИСОК ПОЛНЫЙ, А НЕ ИСТОРИЧЕСКИЙ (правка 27.10, кусок 197).
    -- `club` добавлен `entity-payments-add-club.sql`; в базе четыре
    -- (`schema-snapshot.sql:1040`). Создатель не должен отставать:
    -- на чистой базе он отработает первым.
    entity_type TEXT NOT NULL CHECK (entity_type IN ('court', 'coach', 'player', 'club')),
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'KGS',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
    purpose TEXT NOT NULL CHECK (purpose IN ('promoted', 'sponsorship', 'rental', 'other')),
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entity_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff full access entity_payments" ON entity_payments
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE INDEX idx_entity_payments_entity ON entity_payments(entity_type, entity_id);
CREATE INDEX idx_entity_payments_promoted ON entity_payments(purpose, period_start, period_end);
