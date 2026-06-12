-- ============================================================
-- Migration: catálogo de tarjetas de crédito
-- Tabla: tarjetas
-- ============================================================

CREATE TABLE IF NOT EXISTS tarjetas (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  banco      TEXT        NOT NULL,
  marca      TEXT        NOT NULL,
  ultimos_4  TEXT        NOT NULL CHECK (char_length(ultimos_4) = 4),
  titular    TEXT        NOT NULL CHECK (titular IN ('Julian', 'Patricia')),
  activo     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_lookup
  ON tarjetas (banco, marca, titular);

ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON tarjetas FOR ALL TO authenticated USING (true);
