-- Migration: gastos_fijos
-- Feature: 01-gastos / 05-gastos-fijos-abm
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gastos_fijos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT          NOT NULL,
  monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda      TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  categoria   TEXT,
  dia_del_mes SMALLINT      NOT NULL CHECK (dia_del_mes BETWEEN 1 AND 31),
  fecha_inicio DATE         NOT NULL,
  fecha_fin   DATE,
  persona     TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  activo      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON gastos_fijos
  FOR ALL TO authenticated USING (true);
