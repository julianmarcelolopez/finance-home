-- Enlaza resumenes_tarjeta con el catálogo de tarjetas
ALTER TABLE resumenes_tarjeta
  ADD COLUMN tarjeta_id UUID REFERENCES tarjetas(id);

-- Backfill: resumenes existentes al momento de la migración
UPDATE resumenes_tarjeta
SET tarjeta_id = '662288be-a3ff-4f63-9fb7-c69a5f46232b'
WHERE banco = 'ICBC' AND titular ILIKE '%Julian%';

UPDATE resumenes_tarjeta
SET tarjeta_id = 'c937ea8c-17d1-4906-b335-37664c40b087'
WHERE banco = 'Galicia' AND titular ILIKE '%Julian%';

UPDATE resumenes_tarjeta
SET tarjeta_id = 'e4a028ed-4cfa-4b19-b2d1-ccadef72b7f1'
WHERE banco = 'Galicia' AND titular ILIKE '%Patricia%';

CREATE INDEX IF NOT EXISTS idx_resumenes_tarjeta_id
  ON resumenes_tarjeta (tarjeta_id);
