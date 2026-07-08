-- Migration: tarjetas_dia_cierre
-- Feature: 08-resumen / 01-resumen-real-estimado
-- Ejecutar en Supabase SQL Editor

-- Día del mes en que cierra el ciclo de la tarjeta. Es solo para mostrar
-- "cierra el DD/MM" en tarjetas sin resumen cargado todavía -- la clasificación
-- real/estimado del resumen mensual se deriva de la existencia del resumen,
-- no de este campo (el cierre real puede correrse por fin de semana/feriado).
ALTER TABLE tarjetas
  ADD COLUMN dia_cierre SMALLINT CHECK (dia_cierre BETWEEN 1 AND 31);
