-- Migration: etiquetas
-- Feature: 03-etiquetas / 01-modelo-datos

-- Catálogo de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#6b7280',
  icono      TEXT        NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO categorias (nombre, color, icono) VALUES
  ('Supermercado',   '#16a34a', 'shopping-cart'),
  ('Restaurantes',   '#ea580c', 'utensils'),
  ('Transporte',     '#2563eb', 'car'),
  ('Salud',          '#dc2626', 'heart'),
  ('Educación',      '#7c3aed', 'book'),
  ('Entretenimiento','#db2777', 'tv'),
  ('Ropa',           '#d97706', 'shirt'),
  ('Hogar',          '#0891b2', 'home'),
  ('Servicios',      '#4f46e5', 'zap'),
  ('Otros',          '#6b7280', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- Reglas de autoetiquetado: patrón de texto → categoría
CREATE TABLE IF NOT EXISTS comercios_categorias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patron      TEXT        NOT NULL,
  categoria_id UUID       NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comercios_patron ON comercios_categorias (patron);

-- FK en consumos_tarjeta
ALTER TABLE consumos_tarjeta
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_consumos_categoria ON consumos_tarjeta (categoria_id);

-- Columnas de cuotas (pueden no existir si n8n no las creó)
ALTER TABLE consumos_tarjeta
  ADD COLUMN IF NOT EXISTS cuota_actual    SMALLINT,
  ADD COLUMN IF NOT EXISTS cantidad_cuotas SMALLINT;

-- RLS
ALTER TABLE categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comercios_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select" ON categorias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_all" ON comercios_categorias
  FOR ALL TO authenticated USING (true);
