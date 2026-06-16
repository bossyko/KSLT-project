-- Migration: add 'club' to entity_payments.entity_type CHECK constraint
-- Run this in Supabase SQL Editor

ALTER TABLE entity_payments
  DROP CONSTRAINT IF EXISTS entity_payments_entity_type_check;

ALTER TABLE entity_payments
  ADD CONSTRAINT entity_payments_entity_type_check
  CHECK (entity_type IN ('court', 'coach', 'player', 'club'));
