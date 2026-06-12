-- Agrega nro_socio (número de socio sin guiones) como llave de matching con n8n
ALTER TABLE tarjetas ADD COLUMN nro_socio TEXT;

UPDATE tarjetas SET nro_socio = '01500174713300'
WHERE id = '662288be-a3ff-4f63-9fb7-c69a5f46232b';

UPDATE tarjetas SET nro_socio = '20125207'
WHERE id = 'c937ea8c-17d1-4906-b335-37664c40b087';

UPDATE tarjetas SET nro_socio = '227902500'
WHERE id = 'e4a028ed-4cfa-4b19-b2d1-ccadef72b7f1';

ALTER TABLE tarjetas ALTER COLUMN nro_socio SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tarjetas_nro_socio ON tarjetas (nro_socio);
