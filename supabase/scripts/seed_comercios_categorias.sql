-- Script: patrones de autoetiquetado
-- Propósito: cargar/actualizar los patrones de comercios_categorias.
--
-- Cuándo correrlo: manualmente desde el SQL Editor de Supabase.
--                  Se puede correr múltiples veces (ON CONFLICT DO NOTHING).
--                  Para modificar un patrón existente: UPDATE o DELETE + INSERT.
--
-- Criterio de match: referencia ILIKE '%' || patron || '%'
-- Ejemplo: patron 'CARREFOUR' matchea 'CARREFOUR EXPRESS', 'CARREFOUR MARKET', etc.
--
-- es_fijo = true → consumo recurrente mensual (streaming, servicios, salud plan)
-- es_fijo = false → compra variable / esporádica

INSERT INTO comercios_categorias (patron, categoria_id, es_fijo) VALUES

  -- Supermercados (variable)
  ('CARREFOUR',   (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('COTO',        (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('DISCO',       (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('JUMBO',       (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('DIA ',        (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('CHANGOMAS',   (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('WALMART',     (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),
  ('LA ANONIMA',  (SELECT id FROM categorias WHERE nombre = 'Supermercado'), false),

  -- Restaurantes y delivery (variable)
  ('MCDONALDS',   (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('BURGER KING', (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('MOSTAZA',     (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('SUBWAY',      (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('STARBUCKS',   (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('RAPPI',       (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),
  ('PEDIDOS YA',  (SELECT id FROM categorias WHERE nombre = 'Restaurantes'), false),

  -- Transporte y combustible (variable)
  ('UBER',        (SELECT id FROM categorias WHERE nombre = 'Transporte'), false),
  ('CABIFY',      (SELECT id FROM categorias WHERE nombre = 'Transporte'), false),
  ('YPF',         (SELECT id FROM categorias WHERE nombre = 'Transporte'), false),
  ('SHELL',       (SELECT id FROM categorias WHERE nombre = 'Transporte'), false),
  ('AXION',       (SELECT id FROM categorias WHERE nombre = 'Transporte'), false),

  -- Salud — planes fijos
  ('SWISS MEDICAL',(SELECT id FROM categorias WHERE nombre = 'Salud'), true),
  ('OSDE',         (SELECT id FROM categorias WHERE nombre = 'Salud'), true),
  ('MEDICUS',      (SELECT id FROM categorias WHERE nombre = 'Salud'), true),
  ('GALENO',       (SELECT id FROM categorias WHERE nombre = 'Salud'), true),
  -- Salud — compras variables
  ('FARMACITY',    (SELECT id FROM categorias WHERE nombre = 'Salud'), false),
  ('DR AHORRO',    (SELECT id FROM categorias WHERE nombre = 'Salud'), false),
  ('FARMACIA',     (SELECT id FROM categorias WHERE nombre = 'Salud'), false),

  -- Entretenimiento / streaming (fijo)
  ('NETFLIX',     (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('SPOTIFY',     (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('DISNEY',      (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('HBO',         (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('AMAZON',      (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('APPLE',       (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('YOUTUBE',     (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),
  ('DEEZER',      (SELECT id FROM categorias WHERE nombre = 'Entretenimiento'), true),

  -- Ropa (variable)
  ('ZARA',        (SELECT id FROM categorias WHERE nombre = 'Ropa'), false),
  ('H&M',         (SELECT id FROM categorias WHERE nombre = 'Ropa'), false),
  ('NIKE',        (SELECT id FROM categorias WHERE nombre = 'Ropa'), false),
  ('ADIDAS',      (SELECT id FROM categorias WHERE nombre = 'Ropa'), false),
  ('FALABELLA',   (SELECT id FROM categorias WHERE nombre = 'Ropa'), false),

  -- Hogar (variable)
  ('EASY',        (SELECT id FROM categorias WHERE nombre = 'Hogar'), false),
  ('SODIMAC',     (SELECT id FROM categorias WHERE nombre = 'Hogar'), false),

  -- Servicios — fijos (telefonía, internet, utilities)
  ('MOVISTAR',    (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('PERSONAL',    (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('CLARO',       (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('FIBERTEL',    (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('TELECENTRO',  (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('EDENOR',      (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('EDESUR',      (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('METROGAS',    (SELECT id FROM categorias WHERE nombre = 'Servicios'), true),
  ('AYSA',        (SELECT id FROM categorias WHERE nombre = 'Servicios'), true)

ON CONFLICT DO NOTHING;
