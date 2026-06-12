-- Migration: es_fijo en comercios_categorias + trigger actualizado
-- Feature: 03-etiquetas / 04-etiquetado-fijo-variable

-- Agregar columna es_fijo a comercios_categorias
ALTER TABLE comercios_categorias
  ADD COLUMN IF NOT EXISTS es_fijo BOOLEAN NOT NULL DEFAULT false;

-- Marcar como fijo los patrones de servicios recurrentes ya cargados
UPDATE comercios_categorias
SET es_fijo = true
WHERE patron IN (
  'NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO', 'AMAZON', 'APPLE', 'DEEZER',
  'MOVISTAR', 'PERSONAL', 'CLARO', 'FIBERTEL', 'TELECENTRO',
  'EDENOR', 'EDESUR', 'METROGAS', 'AYSA', 'OSDE'
);

-- Actualizar trigger para que también asigne es_fijo desde el patrón
CREATE OR REPLACE FUNCTION fn_autoetiquetado()
RETURNS TRIGGER AS $$
DECLARE
  v_categoria_id UUID;
  v_es_fijo      BOOLEAN;
BEGIN
  IF NEW.categoria_id IS NULL THEN
    SELECT cc.categoria_id, cc.es_fijo
    INTO   v_categoria_id, v_es_fijo
    FROM   comercios_categorias cc
    WHERE  NEW.referencia ILIKE '%' || cc.patron || '%'
    ORDER  BY cc.created_at ASC
    LIMIT  1;

    IF v_categoria_id IS NOT NULL THEN
      NEW.categoria_id := v_categoria_id;
      NEW.es_fijo      := v_es_fijo;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
