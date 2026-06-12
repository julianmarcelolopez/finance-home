-- Migration: función RPC para backfill desde la API
-- Feature: 03-etiquetas / 05-gestion-etiquetas
--
-- Permite que el backend llame a supabase.rpc('fn_backfill_autoetiquetado')
-- después de crear un patrón nuevo, sin necesidad de SQL manual.

CREATE OR REPLACE FUNCTION fn_backfill_autoetiquetado()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  WITH matches AS (
    SELECT DISTINCT ON (ct.id)
      ct.id,
      cc.categoria_id,
      cc.es_fijo
    FROM   consumos_tarjeta ct
    JOIN   comercios_categorias cc ON ct.referencia ILIKE '%' || cc.patron || '%'
    WHERE  ct.categoria_id IS NULL
    ORDER  BY ct.id, cc.created_at ASC
  )
  UPDATE consumos_tarjeta ct
  SET
    categoria_id = matches.categoria_id,
    es_fijo      = matches.es_fijo
  FROM matches
  WHERE ct.id = matches.id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;
