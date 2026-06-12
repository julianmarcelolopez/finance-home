# 03 — Autoetiquetado por patrón de comercio

## Descripción

Cuando se inserta un consumo en `consumos_tarjeta`, un trigger de PostgreSQL busca automáticamente en `comercios_categorias` si la `referencia` del consumo matchea algún patrón conocido (ILIKE). Si hay match, el consumo queda con `categoria_id` asignado en el mismo INSERT, sin intervención externa.

No requiere n8n ni ningún servicio adicional — la lógica vive en la base de datos.

## Estado

[ ] Pendiente — ejecutar migration en Supabase SQL Editor.

## Implementación

### Trigger: `fn_autoetiquetado` + `trg_autoetiquetado`

- **Función** `fn_autoetiquetado()`: busca en `comercios_categorias` el primer patrón donde `referencia ILIKE '%' || patron || '%'` y asigna `categoria_id` al row entrante.
- **Trigger** `trg_autoetiquetado`: se ejecuta `BEFORE INSERT` en `consumos_tarjeta`. No corre en UPDATE, para respetar etiquetas asignadas manualmente.
- Si el consumo ya trae `categoria_id` (asignado a mano o por la API), el trigger no lo pisa.
- Si no hay match en `comercios_categorias`, `categoria_id` queda `NULL` (sin error).

**Migration:** `supabase/migrations/20260607120000_autoetiquetado_trigger.sql`

### Backfill de consumos existentes

Para etiquetar consumos que ya existen en la tabla (anteriores al trigger), correr manualmente:

**Script:** `supabase/scripts/backfill_autoetiquetado.sql`

```sql
UPDATE consumos_tarjeta ct
SET    categoria_id = (
  SELECT cc.categoria_id
  FROM   comercios_categorias cc
  WHERE  ct.referencia ILIKE '%' || cc.patron || '%'
  ORDER  BY cc.created_at ASC
  LIMIT  1
)
WHERE  ct.categoria_id IS NULL;
```

Correrlo desde el SQL Editor de Supabase cada vez que se agreguen patrones nuevos a `comercios_categorias` y se quiera reetiquetado retroactivo.

## Alcance

**Incluye:**
- Función + trigger en PostgreSQL (sin servicios externos)
- Script de backfill para consumos existentes (ejecución manual)
- La tabla `comercios_categorias` ya existe (tarea 01)

**No incluye:**
- Reetiquetado automático al agregar un patrón nuevo (se hace con el backfill manual)
- Fuzzy matching / ML (solo ILIKE)
- Gestión de `comercios_categorias` desde la UI (se administra con SQL directo por ahora)

## Criterios de aceptación

- [ ] Un consumo con `referencia = 'CARREFOUR EXPRESS'` se inserta con categoría Supermercado (si el patrón 'CARREFOUR' está en `comercios_categorias`)
- [ ] Un consumo sin patrón conocido se inserta con `categoria_id = NULL` sin error
- [ ] Una categoría asignada manualmente (PATCH) no es pisada si el consumo se actualiza
- [ ] El backfill script etiqueta los consumos históricos existentes

## Dependencias

- Tarea 01: tablas `categorias` y `comercios_categorias` creadas
- Tarea 02: columna `categoria_id` existe en `consumos_tarjeta`
- Acceso al Supabase SQL Editor para ejecutar la migration y el backfill
