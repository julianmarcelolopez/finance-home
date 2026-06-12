-- Script: backfill autoetiquetado
-- Propósito: asignar categoria_id Y es_fijo a consumos_tarjeta existentes
--            usando los patrones de comercios_categorias.
--
-- Cuándo correrlo: manualmente desde el SQL Editor de Supabase.
--                  Correrlo cada vez que se agreguen patrones nuevos.
--
-- Comportamiento:
--   - categoria_id: se asigna solo si el consumo no tiene categoría aún
--   - es_fijo: se actualiza siempre según el patrón (para reflejar cambios en el seed)

UPDATE consumos_tarjeta ct
SET
  categoria_id = COALESCE(ct.categoria_id, sub.categoria_id),
  es_fijo      = sub.es_fijo
FROM (
  SELECT DISTINCT ON (ct2.id)
    ct2.id,
    cc.categoria_id,
    cc.es_fijo
  FROM   consumos_tarjeta ct2
  JOIN   comercios_categorias cc ON ct2.referencia ILIKE '%' || cc.patron || '%'
  ORDER  BY ct2.id, cc.created_at ASC
) sub
WHERE ct.id = sub.id;
