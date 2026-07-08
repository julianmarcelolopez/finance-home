-- Migration: gastos_mercadopago
-- Feature: 01-gastos / 07-mercadopago-carga-manual
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gastos_mercadopago (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        DATE          NOT NULL,
  descripcion  TEXT          NOT NULL,
  monto        NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda       TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  persona      TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  categoria_id UUID          REFERENCES categorias(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE gastos_mercadopago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON gastos_mercadopago
  FOR ALL TO authenticated USING (true);
