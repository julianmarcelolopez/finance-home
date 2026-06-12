-- ============================================================
-- 1. Crear tarjeta Galicia Visa Julian (nro_socio: 0714240011)
-- ============================================================
INSERT INTO tarjetas (banco, marca, nro_cuenta, nro_socio, titular, activo)
VALUES ('Galicia', 'Visa', '0714240011', '0714240011', 'Julian', true);

-- ============================================================
-- 2. Corregir VI00000000061379146 → apuntar a Galicia Visa Julian
--    (estaba incorrectamente linkeado a ICBC)
-- ============================================================
UPDATE resumenes_tarjeta
SET tarjeta_id = (
  SELECT id FROM tarjetas
  WHERE banco = 'Galicia' AND nro_socio = '0714240011'
  LIMIT 1
)
WHERE nro_resumen = 'VI00000000061379146';

-- ============================================================
-- 3. Corregir 3 resumenes de Galicia MC Patricia (tarjeta_id null)
-- ============================================================
UPDATE resumenes_tarjeta
SET tarjeta_id = 'e4a028ed-4cfa-4b19-b2d1-ccadef72b7f1'
WHERE nro_resumen IN (
  '027032088799',
  '027032037800',
  '027032058899'
)
AND tarjeta_id IS NULL;

-- ============================================================
-- Verificar resultado
-- ============================================================
SELECT
  rt.nro_resumen, rt.banco, rt.marca_tarjeta, rt.vencimiento_actual,
  rt.tarjeta_id,
  t.banco AS tarjeta_banco, t.marca AS tarjeta_marca, t.titular AS tarjeta_titular
FROM resumenes_tarjeta rt
LEFT JOIN tarjetas t ON t.id = rt.tarjeta_id
ORDER BY rt.banco, rt.vencimiento_actual DESC;
