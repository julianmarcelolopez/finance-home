# Modelo de datos — Mercadopago (carga manual)

## SQL — Ejecutar en Supabase SQL Editor

```sql
CREATE TABLE IF NOT EXISTS gastos_mercadopago (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        DATE          NOT NULL,
  descripcion  TEXT          NOT NULL,
  monto        NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda       TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  persona      TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  categoria_id UUID          REFERENCES categorias(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE gastos_mercadopago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON gastos_mercadopago
  FOR ALL TO authenticated USING (true);
```

## Columnas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| fecha | date | Fecha del gasto |
| descripcion | text | Texto libre (ej: "Verdulería feria", "Farmacity") |
| monto | numeric(12,2) | Siempre positivo |
| moneda | text | "ARS" o "USD" |
| persona | text | "Julian", "Patricia" o "Compartido" |
| categoria_id | uuid FK → categorias.id | Nullable — un gasto se puede cargar sin categorizar |
| created_at | timestamptz | Auto |

## Por qué no hay `activo` (soft delete)

A diferencia de `gastos_fijos` — que son recurrentes y se desactivan cuando dejan de aplicar — cada fila de `gastos_mercadopago` es un gasto puntual de una fecha concreta. No tiene sentido "desactivarlo": si se cargó mal, se edita o se elimina (DELETE real). Ver `02-api.md`.

## Relación con `movimientos_mp` (tareas 02/03, bloqueadas)

Si en el futuro se retoma la sync automática por API, el diseño de `movimientos_mp` documentado en esas tareas es independiente de esta tabla — no hay migración prevista de `gastos_mercadopago` hacia `movimientos_mp`. Son dos fuentes de datos separadas; se definiría en ese momento cómo evitar duplicados si conviven.

## Datos iniciales

No aplica — la tabla arranca vacía. Los gastos se cargan desde la UI a medida que ocurren (no hay carga retroactiva masiva prevista en esta tarea).
