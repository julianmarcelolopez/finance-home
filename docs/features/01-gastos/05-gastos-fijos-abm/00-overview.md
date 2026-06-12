# 05 — Gastos fijos — ABM

## Descripción

Administración de gastos fijos recurrentes: alquiler, expensas, servicios, suscripciones. Se usan para calcular el flujo de caja mensual en Planificación y para la métrica "Gastos fijos del mes" en el Dashboard.

## Estado

[ ] Pendiente (UI). La API `GET/POST/PATCH /api/gastos-fijos` está implementada. La tabla `gastos_fijos` tiene SQL de migración en `docs/modelo-de-datos.md` pero todavía no está creada en Supabase.

## Alcance

**Incluye:**
- Pantalla de administración de gastos fijos (nueva página o sección dentro de Planificación)
- Tabla con todos los fijos activos: nombre, monto, moneda, día del mes, persona
- Formulario para agregar un gasto fijo nuevo
- Toggle activo/inactivo (no se eliminan, se desactivan)
- Edición de monto y fecha_fin (cuando un fijo cambia de precio)

**No incluye:**
- Historial de cambios de un fijo (no hay tabla de auditoría)
- Prorrateo automático de fijos en cuotas
- Gastos fijos en dólares con tipo de cambio histórico (siempre se convierte al blue actual)

## Modelo de datos

Tabla `gastos_fijos` en Supabase (SQL definido en `docs/modelo-de-datos.md`):

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| nombre | text | Ej: "Expensas", "Netflix", "Alquiler" |
| monto | numeric | Monto mensual |
| moneda | text | "ARS" o "USD" |
| categoria | text | Texto libre (sin FK, puede ser null) |
| dia_del_mes | smallint | Día en que vence (1–31) |
| fecha_inicio | date | Desde cuándo aplica |
| fecha_fin | date | Nullable — hasta cuándo aplica |
| persona | text | "Julian", "Patricia" o "Compartido" |
| activo | boolean | Default true |
| created_at | timestamptz | Auto |

## Endpoints

Ya implementados en `apps/api/src/routes/gastos-fijos.ts`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gastos-fijos` | Lista (query: `activo`, `persona`, `moneda`) |
| POST | `/api/gastos-fijos` | Crea nuevo |
| PATCH | `/api/gastos-fijos/:id` | Actualiza cualquier campo |

Body POST requerido: `nombre`, `monto`, `moneda`, `persona`, `dia_del_mes`, `fecha_inicio`.

## Criterios de aceptación

- [ ] La tabla muestra los fijos ordenados por `dia_del_mes` ascendente
- [ ] El total mensual en ARS (con conversión al blue para los USD) se muestra al pie
- [ ] Al desactivar un fijo desaparece del cálculo de planificación en el mes siguiente
- [ ] `fecha_fin` permite cerrar un fijo que ya no aplica (ej: alquiler que terminó)
- [ ] Los fijos en USD se distinguen visualmente en la tabla (badge "USD")

## Dependencias

- Tabla `gastos_fijos` creada en Supabase (SQL listo, pendiente de ejecutar)
- API `/api/gastos-fijos` ya implementada
- Feature 04-planificacion: consume esta tabla en `GET /api/planificacion/:año`
- Feature 02-dashboard: consume esta tabla en `GET /api/dashboard/resumen`
