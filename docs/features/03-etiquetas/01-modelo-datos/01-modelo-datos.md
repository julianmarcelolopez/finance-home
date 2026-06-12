# 01 — Modelo de datos de etiquetas

## Estado

✅ Completado

## Descripción

Tablas y columnas creadas en Supabase para el sistema de etiquetado.

## Migrations ejecutadas

- `supabase/migrations/20260607110000_etiquetas.sql` — crea `categorias`, `comercios_categorias`, agrega `categoria_id`, `es_fijo`, `cuota_actual`, `cantidad_cuotas` a `consumos_tarjeta`
- `supabase/migrations/20260608100000_consumos_es_fijo.sql` — columna `es_fijo` e índice
- `supabase/migrations/20260608110000_comercios_es_fijo.sql` — columna `es_fijo` en `comercios_categorias` + trigger actualizado
- `supabase/migrations/20260608120000_fn_backfill_rpc.sql` — función RPC `fn_backfill_autoetiquetado()`
- `supabase/migrations/20260608130000_categorias_nombre_unique.sql` — unique constraint en `categorias.nombre`

## Modelo de datos

### categorias

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| nombre | text UNIQUE | Ej: "Supermercado", "Deporte" |
| color | text | Hex color (ej: "#16a34a") |
| icono | text | Nombre de ícono lucide-react |
| created_at | timestamptz | Auto |

### comercios_categorias

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| patron | text | Texto para `ILIKE '%patron%'` en referencia |
| categoria_id | uuid FK | Categoría asociada |
| es_fijo | boolean | Si el consumo es recurrente mensual |
| created_at | timestamptz | Auto |

### consumos_tarjeta — columnas agregadas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| categoria_id | uuid FK nullable | Categoría del consumo |
| es_fijo | boolean DEFAULT false | Fijo o variable |
| cuota_actual | smallint nullable | Número de cuota |
| cantidad_cuotas | smallint nullable | Total de cuotas |

## Scripts de datos

- `supabase/scripts/seed_comercios_categorias.sql` — ~50 patrones con es_fijo por categoría
- `supabase/scripts/backfill_autoetiquetado.sql` — reetiquetado manual de históricos

## Criterios de aceptación

- [x] Las categorías se pueden consultar con `SELECT * FROM categorias`
- [x] `consumos_tarjeta.categoria_id` es nullable con FK ON DELETE SET NULL
- [x] `es_fijo` existe en `consumos_tarjeta` y `comercios_categorias`
- [x] No se pueden crear categorías con el mismo nombre (unique constraint)
- [x] El trigger `trg_autoetiquetado` asigna `categoria_id` y `es_fijo` en cada INSERT
