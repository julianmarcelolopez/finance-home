-- Reemplaza ultimos_4 (4 dígitos) por nro_cuenta (número completo de cuenta)
ALTER TABLE tarjetas RENAME COLUMN ultimos_4 TO nro_cuenta;
ALTER TABLE tarjetas DROP CONSTRAINT IF EXISTS tarjetas_ultimos_4_check;
