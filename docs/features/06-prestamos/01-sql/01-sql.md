# 06-01 — SQL — Tablas prestamos + cuotas_prestamo

## Descripción

Dos tablas nuevas en Supabase. `prestamos` guarda los datos del préstamo (cabecera). `cuotas_prestamo` guarda el cronograma completo de cuotas con su estado pagado/pendiente.

## Estado

- [ ] Pendiente — ejecutar en Supabase SQL Editor

## Diseño

### Decisiones

- `tipo` es TEXT libre para soportar cualquier producto bancario ("Personal", "Prendario", "Hipotecario", "Comercial", etc.) sin necesidad de migración al agregar uno nuevo.
- `moneda` en `prestamos` define la moneda base del préstamo (ARS / USD / UVA). Las cuotas heredan esta moneda.
- Los campos de desglose en `cuotas_prestamo` (`interes_nominal`, `sellos`, `iva_interes`, `amortizacion`) son todos nullable: algunos bancos no exponen este detalle, solo el monto total.
- Las cuotas se cargan manualmente con el cronograma completo al dar de alta el préstamo. Excepción: préstamos UVA donde el monto varía mes a mes — en esos casos se carga solo la cuota del mes actual y se actualiza mensualmente.
- No se eliminan préstamos ni cuotas: `prestamos.activo = false` para cerrar, y el campo `pagada` en cuotas para marcar el estado.

### Tabla `prestamos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| numero | text | Número de préstamo del banco (ej: "808128032344") |
| banco | text | Nombre comercial (ej: "Galicia", "Santander") |
| tipo | text | Texto libre: "Personal", "Prendario", "Hipotecario", etc. |
| tasa | numeric(5,2) | Tasa nominal anual en % (ej: 54.00) |
| sistema_amortizacion | text | "Francés", "Alemán", "Otro" — nullable |
| monto_solicitado | numeric(14,2) | Capital original del préstamo |
| capital_adeudado | numeric(14,2) | Capital pendiente al momento de la carga — nullable, actualizable |
| moneda | text | "ARS", "USD" o "UVA" — default "ARS" |
| persona | text | "Julian", "Patricia" o "Compartido" |
| cuenta_debito | text | Cuenta de débito del banco — nullable |
| activo | boolean | Default true — false cuando el préstamo está cancelado |
| created_at | timestamptz | Auto |

### Tabla `cuotas_prestamo`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| prestamo_id | uuid FK | Referencia a `prestamos.id` |
| numero_cuota | smallint | Número de cuota (1, 2, 3...) |
| fecha_vencimiento | date | Fecha de vencimiento de la cuota |
| monto_total | numeric(14,2) | Monto total a pagar de la cuota |
| interes_nominal | numeric(14,2) | nullable |
| sellos | numeric(14,2) | nullable |
| iva_interes | numeric(14,2) | nullable |
| amortizacion | numeric(14,2) | nullable |
| pagada | boolean | Default false |
| created_at | timestamptz | Auto |

## SQL de migración

```sql
-- Migration: prestamos
-- Feature: 06-prestamos / 01-sql
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS prestamos (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                TEXT          NOT NULL,
  banco                 TEXT          NOT NULL,
  tipo                  TEXT          NOT NULL,
  tasa                  NUMERIC(5,2),
  sistema_amortizacion  TEXT,
  monto_solicitado      NUMERIC(14,2) NOT NULL,
  capital_adeudado      NUMERIC(14,2),
  moneda                TEXT          NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD', 'UVA')),
  persona               TEXT          NOT NULL CHECK (persona IN ('Julian', 'Patricia', 'Compartido')),
  cuenta_debito         TEXT,
  activo                BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuotas_prestamo (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id       UUID          NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  numero_cuota      SMALLINT      NOT NULL,
  fecha_vencimiento DATE          NOT NULL,
  monto_total       NUMERIC(14,2) NOT NULL,
  interes_nominal   NUMERIC(14,2),
  sellos            NUMERIC(14,2),
  iva_interes       NUMERIC(14,2),
  amortizacion      NUMERIC(14,2),
  pagada            BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (prestamo_id, numero_cuota)
);

ALTER TABLE prestamos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_prestamo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON prestamos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "auth_all" ON cuotas_prestamo
  FOR ALL TO authenticated USING (true);
```

## Datos de ejemplo — Préstamo Galicia Personal (Julian)

Alta del préstamo para validar el flujo completo:

```sql
-- 1. Insertar préstamo
INSERT INTO prestamos (numero, banco, tipo, tasa, sistema_amortizacion, monto_solicitado, capital_adeudado, moneda, persona, cuenta_debito)
VALUES ('808128032344', 'Galicia', 'Personal', 54.00, 'Francés', 6000000, 5189596.81, 'ARS', 'Julian', 'CA $ N° 4041144-2 236-1');

-- 2. Insertar cuotas (guardar el UUID del paso anterior como :prestamo_id)
-- Reemplazar :prestamo_id con el UUID generado
INSERT INTO cuotas_prestamo (prestamo_id, numero_cuota, fecha_vencimiento, monto_total, interes_nominal, sellos, iva_interes, amortizacion, pagada)
VALUES
  (:prestamo_id, 1,  '2026-04-13', 679718.14, 221917.81, 4931.51, 46602.74, 406266.08, true),
  (:prestamo_id, 2,  '2026-05-13', 714233.04, NULL, NULL, NULL, NULL, true),
  (:prestamo_id, 3,  '2026-06-16', 710185.95, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 4,  '2026-07-13', 705607.85, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 5,  '2026-08-13', 701144.24, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 6,  '2026-09-14', 696315.99, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 7,  '2026-10-13', 691159.24, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 8,  '2026-11-13', 685997.88, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 9,  '2026-12-14', 680410.69, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 10, '2027-01-13', 674730.26, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 11, '2027-02-15', 668713.37, NULL, NULL, NULL, NULL, false),
  (:prestamo_id, 12, '2027-03-13', 662363.72, NULL, NULL, NULL, NULL, false);
```

## Criterios de aceptación

- [ ] `prestamos` creada con RLS habilitado
- [ ] `cuotas_prestamo` creada con FK a `prestamos` y constraint UNIQUE (prestamo_id, numero_cuota)
- [ ] El préstamo Galicia Personal de Julian se puede insertar correctamente
- [ ] Las 12 cuotas se insertan correctamente y las 2 primeras quedan como `pagada = true`
