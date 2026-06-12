-- Migration: es_fijo en consumos_tarjeta
-- Feature: 03-etiquetas / 04-etiquetado-fijo-variable

ALTER TABLE consumos_tarjeta
  ADD COLUMN IF NOT EXISTS es_fijo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_consumos_es_fijo ON consumos_tarjeta (es_fijo);
