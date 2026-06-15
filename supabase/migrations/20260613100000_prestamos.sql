-- Migration: prestamos
-- Feature: 06-prestamos / 01-sql
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS prestamos (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                TEXT          NOT NULL,
  banco                 TEXT          NOT NULL,
  tipo                  TEXT          NOT NULL,
  tasa                  NUMERIC(5,2),
  sistema_amortizacion  TEXT,
  monto_solicitado      NUMERIC(14,2) NOT NULL,
  capital_adeudado      NUMERIC(14,2),
  moneda                TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD', 'UVA')),
  persona               TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  cuenta_debito         TEXT,
  activo                BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuotas_prestamo (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id       UUID          NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  numero_cuota      SMALLINT      NOT NULL,
  fecha_vencimiento DATE          NOT NULL,
  monto_total       NUMERIC(14,2) NOT NULL,
  interes_nominal   NUMERIC(14,2),
  sellos            NUMERIC(14,2),
  iva_interes       NUMERIC(14,2),
  amortizacion      NUMERIC(14,2),
  pagada            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (prestamo_id, numero_cuota)
);

ALTER TABLE prestamos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_prestamo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON prestamos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "auth_all" ON cuotas_prestamo
  FOR ALL TO authenticated USING (true);
