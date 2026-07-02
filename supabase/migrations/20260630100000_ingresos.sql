-- Migration: ingresos
-- Feature: 07-ingresos / 01-sql
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ingresos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT          NOT NULL,
  monto       NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  moneda      TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  persona     TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  tipo        TEXT          NOT NULL CHECK (tipo IN ('sueldo', 'freelance', 'renta', 'otro')),
  fecha       DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON ingresos
  FOR ALL TO authenticated USING (true);
