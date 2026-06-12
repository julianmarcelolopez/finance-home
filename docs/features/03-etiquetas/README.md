# Feature 03 — Etiquetas

Sistema de categorización de consumos. Permite etiquetar cada consumo (Supermercado, Restaurantes, Transporte, etc.) de forma manual, automática por patrón de comercio, y marcarlos como Fijo o Variable.

## Objetivo

Tener todos los consumos categorizados para que el Dashboard pueda mostrar breakdowns por categoría y que la Planificación pueda distinguir fijos de variables.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-modelo-datos | ✅ Completado |
| 02-api-etiquetas | ✅ Completado |
| 03-autoetiquetado | ✅ Completado |
| 04-etiquetado-fijo-variable | ✅ Completado |
| 05-gestion-etiquetas | ✅ Completado |

## Dependencias

- Supabase: tablas `categorias`, `comercios_categorias`, columnas `categoria_id` y `es_fijo` en `consumos_tarjeta`
- Feature 01-gastos: fuente de los consumos a etiquetar

## Tareas

- [01-modelo-datos](./01-modelo-datos/01-modelo-datos.md) — Tablas, relaciones y migración SQL
- [02-api-etiquetas](./02-api-etiquetas/02-api-etiquetas.md) — Endpoints CRUD de etiquetas y asignación
- [03-autoetiquetado](./03-autoetiquetado/03-autoetiquetado.md) — Trigger PostgreSQL de autoetiquetado
- [04-etiquetado-fijo-variable](./04-etiquetado-fijo-variable/04-etiquetado-fijo-variable.md) — Marcar consumos como Fijo o Variable
- [05-gestion-etiquetas](./05-gestion-etiquetas/05-gestion-etiquetas.md) — UI de gestión de categorías y patrones
