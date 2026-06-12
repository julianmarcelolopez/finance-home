-- Enlaza los 6 resúmenes de Santander que quedaron con tarjeta_id = NULL
-- La tarjeta Santander Visa Julian tiene id: 59f7c307-e899-49cb-88e3-19c16839838d

UPDATE resumenes_tarjeta
SET tarjeta_id = '59f7c307-e899-49cb-88e3-19c16839838d'
WHERE banco = 'Santander'
  AND tarjeta_id IS NULL;

-- Verificar
SELECT nro_resumen, banco, marca_tarjeta, vencimiento_actual, tarjeta_id
FROM resumenes_tarjeta
WHERE banco = 'Santander'
ORDER BY vencimiento_actual DESC;
