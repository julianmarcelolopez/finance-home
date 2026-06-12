-- Migration: autoetiquetado trigger
-- Feature: 03-etiquetas / 03-autoetiquetado
--
-- Crea una función PL/pgSQL que busca en comercios_categorias el primer patrón
-- que matchee la referencia del consumo (ILIKE) y lo asigna automáticamente.
-- El trigger se dispara BEFORE INSERT para que el valor quede en el mismo row.
-- No se dispara en UPDATE, preservando cualquier categoría asignada manualmente.

CREATE OR REPLACE FUNCTION fn_autoetiquetado()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo intentar si el consumo no viene ya con categoria_id
  IF NEW.categoria_id IS NULL THEN
    SELECT cc.categoria_id
    INTO   NEW.categoria_id
    FROM   comercios_categorias cc
    WHERE  NEW.referencia ILIKE '%' || cc.patron || '%'
    ORDER  BY cc.created_at ASC
    LIMIT  1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger solo en INSERT (no en UPDATE, para respetar etiquetas manuales)
DROP TRIGGER IF EXISTS trg_autoetiquetado ON consumos_tarjeta;

CREATE TRIGGER trg_autoetiquetado
  BEFORE INSERT ON consumos_tarjeta
  FOR EACH ROW
  EXECUTE FUNCTION fn_autoetiquetado();
