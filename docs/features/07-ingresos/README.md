# Feature 07 — Ingresos

Módulo para registrar manualmente los ingresos mensuales de Julian y Patricia. Permite cargar sueldos, ingresos freelance, rentas u otros, en pesos o dólares, por persona.

## Objetivo

Tener visibilidad de los ingresos reales del hogar para calcular el saldo mensual (ingresos − gastos) y alimentar la planificación de flujo de caja. Carga manual por ahora; en el futuro podría conectarse a fuentes automáticas (liquidaciones de sueldo, etc.).

## Ubicación en la app

- **Sidebar:** nuevo ítem `Ingresos` (entre Gastos Fijos y Planificación)
- **Página:** `/ingresos` — lista de ingresos agrupada por mes con totales ARS / USD por persona
- **Futuro:** integrar al Dashboard home como métrica "Ingresos del mes" y al flujo de caja de Planificación

## Estado actual

**En planificación — 2026-06-15**

| Fase | Tarea | Estado |
|------|-------|--------|
| 01 | SQL — tabla `ingresos` + RLS | Pendiente |
| 02 | Shared types — `IngresoCreate` | Pendiente |
| 03 | API — endpoints CRUD | Pendiente |
| 04 | Frontend — página Ingresos | Pendiente |

## Diseño de la UI

### Vista principal `/ingresos`

```
┌─────────────────────────────────────────────────────┐
│ Ingresos                          [+ Nuevo ingreso] │
├─────────────────────────────────────────────────────┤
│ Filtros: [Todas las personas ▼]                     │
├─────────────────────────────────────────────────────┤
│ Junio 2026                                          │
│  Julian: $X.XXX ARS  •  USDx,xxx                   │
│  Patricia: $X.XXX ARS                               │
│ ┌──────────────────────────────────────────────┐    │
│ │ Sueldo Julian    Sueldo   01/06  $1.200.000  │    │
│ │ Freelance API    Freelance 15/06  USD 500    │    │
│ └──────────────────────────────────────────────┘    │
│                                                     │
│ Mayo 2026                                           │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Modal "Nuevo / Editar ingreso"

Campos: descripción, monto, moneda (ARS/USD), persona, tipo, fecha.

## Pendientes / mejoras futuras

- Integrar totales de ingresos al Dashboard home (métrica "Ingresos del mes")
- Conectar con la tabla de planificación/flujo de caja para calcular saldo mensual automáticamente
- Ingresos recurrentes: flag `recurrente` para auto-sugerir el próximo mes

## Fases

- [01-sql](./01-sql/01-sql.md)
- [02-shared-types](./02-shared-types/02-shared-types.md)
- [03-api](./03-api/03-api.md)
- [04-frontend](./04-frontend/04-frontend.md)

## Dependencias

- Tabla `ingresos` en Supabase (nueva)
- API Express: `/api/ingresos`
- Shared types: `Ingreso` (ya existe), `IngresoCreate` (agregar)
- Layout.tsx: nuevo ítem en sidebar
- App.tsx: nueva ruta `/ingresos`
- api.ts: cliente para ingresos
