# Modelo de datos — Gastos Fijos

## SQL — Ejecutar en Supabase SQL Editor

```sql
CREATE TABLE IF NOT EXISTS gastos_fijos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  categoria TEXT,
  dia_del_mes SMALLINT NOT NULL CHECK (dia_del_mes BETWEEN 1 AND 31),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  persona TEXT NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON gastos_fijos FOR ALL TO authenticated USING (true);
```

## Columnas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| nombre | text | Ej: "Expensas", "Netflix", "Alquiler" |
| monto | numeric(12,2) | Monto mensual, siempre positivo |
| moneda | text | "ARS" o "USD" |
| categoria | text | Texto libre, nullable |
| dia_del_mes | smallint | Día de vencimiento (1–31) |
| fecha_inicio | date | Desde cuándo aplica |
| fecha_fin | date | Nullable — hasta cuándo aplica |
| persona | text | "Julian", "Patricia" o "Compartido" |
| activo | boolean | Default true — soft delete |
| created_at | timestamptz | Auto |

## Datos iniciales a cargar

Después de crear la tabla, cargar los gastos fijos reales de la familia con INSERTs manuales o desde la UI una vez implementada.
