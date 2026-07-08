# 07-01 — SQL — Tabla ingresos

## Estado

- [x] Completado — 2026-06-30

## Diseño

### Decisiones

- `moneda` acepta `ARS` y `USD` únicamente. `UVA` queda excluido porque no tiene sentido práctico para ingresos.
- `tipo` usa CHECK constraint con los valores del shared type: `sueldo`, `freelance`, `renta`, `otro`.
- `monto` siempre positivo (CHECK > 0). No hay ingresos negativos; las correcciones se hacen editando o eliminando el registro.
- No hay soft delete: los ingresos se eliminan físicamente. Son pocos registros y con baja frecuencia de error.
- RLS habilitado con policy `auth_all` para usuarios autenticados — misma estrategia que el resto de las tablas. El backend usa `service_role_key` que bypasea RLS; la policy protege acceso directo desde el cliente.

### Tabla `ingresos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| descripcion | text | Texto libre (ej: "Sueldo junio", "Proyecto X") |
| monto | numeric(14,2) | Monto positivo |
| moneda | text | `ARS` o `USD` |
| persona | text | `Julian`, `Patricia` o `Compartido` |
| tipo | text | `sueldo`, `freelance`, `renta`, `otro` |
| fecha | date | Fecha de acreditación / percepción |
| created_at | timestamptz | Auto |

## SQL de migración

```sql
-- Migration: ingresos
-- Feature: 07-ingresos / 01-sql
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ingresos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT          NOT NULL,
  monto       NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  moneda      TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  persona     TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  tipo        TEXT          NOT NULL CHECK (tipo IN ('sueldo', 'freelance', 'renta', 'otro')),
  fecha       DATE          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON ingresos
  FOR ALL TO authenticated USING (true);
```

## Criterios de aceptación

- [ ] Tabla `ingresos` creada con todos los campos y constraints
- [ ] RLS habilitado
- [ ] Policy `auth_all` para usuarios autenticados
- [ ] Se puede insertar un ingreso de prueba desde Supabase SQL Editor
- [ ] El backend puede hacer SELECT, INSERT, PATCH y DELETE via `service_role_key`
