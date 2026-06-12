-- Migration: unique constraint en categorias.nombre
-- Elimina duplicados existentes y agrega constraint

-- Eliminar duplicados, conservando el primero creado
DELETE FROM categorias
WHERE id NOT IN (
  SELECT DISTINCT ON (nombre) id
  FROM categorias
  ORDER BY nombre, created_at ASC
);

-- Agregar constraint único
ALTER TABLE categorias
  ADD CONSTRAINT categorias_nombre_unique UNIQUE (nombre);
