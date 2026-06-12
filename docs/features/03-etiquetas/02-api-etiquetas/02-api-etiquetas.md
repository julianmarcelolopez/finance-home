# 02 — API de etiquetas

## Estado

✅ Completado

## Descripción

Endpoints para gestionar categorías, patrones de autoetiquetado y asignación manual de etiquetas a consumos.

## Endpoints implementados

### Categorías — `apps/api/src/routes/etiquetas.ts`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/etiquetas` | Lista categorías ordenadas por nombre |
| POST | `/api/etiquetas` | Crea categoría nueva (409 si nombre duplicado) |
| GET | `/api/etiquetas/patrones` | Lista patrones con join a categorías |
| POST | `/api/etiquetas/patrones` | Crea patrón + dispara backfill automático |
| DELETE | `/api/etiquetas/patrones/:id` | Elimina patrón |

### Consumos — `apps/api/src/routes/consumos.ts`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/consumos?categoria_id=uuid` | Filtra por categoría |
| GET | `/api/consumos?es_fijo=true` | Filtra fijos o variables |
| PATCH | `/api/consumos/:id` | Actualiza `es_fijo` y/o `categoria_id` |
| POST | `/api/consumos/:id/etiquetas` | Asigna categoría a un consumo (alias) |

## Backfill automático

`POST /api/etiquetas/patrones` crea el patrón y llama a `supabase.rpc('fn_backfill_autoetiquetado')` que actualiza todos los consumos con `categoria_id IS NULL` que matcheen el nuevo patrón. La response incluye `{ patron, afectados: N }`.

## Criterios de aceptación

- [x] `GET /api/etiquetas` retorna categorías ordenadas por nombre
- [x] `POST /api/etiquetas` con nombre duplicado retorna 409
- [x] `POST /api/etiquetas/patrones` dispara backfill automático
- [x] `PATCH /api/consumos/:id` actualiza `es_fijo` y/o `categoria_id`
- [x] Filtros `categoria_id` y `es_fijo` funcionan en `GET /api/consumos`
