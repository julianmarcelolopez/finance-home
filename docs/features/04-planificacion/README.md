# Feature 04 — Planificación

Vista financiera anual con proyección mes a mes. Consolida ingresos, gastos fijos activos y gastos variables históricos para mostrar saldo y saldo acumulado de enero a diciembre.

## Objetivo

Responder la pregunta "¿cómo terminamos el año?" con datos reales y proyecciones, sin necesidad de planillas externas.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-flujo-caja-anual | Implementado (API + UI básica) |
| 02-proyeccion-variables | Pendiente |
| 03-what-if | Pendiente |

El endpoint `GET /api/planificacion/:año` calcula mes a mes: ingresos del período, gastos fijos activos (con conversión ARS/USD al blue) y consumos de tarjeta reales. La página `Planificacion.tsx` muestra la tabla con saldo y saldo acumulado. Los meses futuros no tienen proyección de variables todavía, quedan en 0.

## Dependencias

- API: `/api/planificacion/:año` (implementado)
- Supabase: `gastos_fijos`, `ingresos`, `consumos_tarjeta`
- bluelytics.com.ar: conversión USD → ARS para fijos en dólar
- Feature 03-etiquetas: la tarea 02 necesita consumos etiquetados por categoría para proyectar variables

## Tareas

- [01-flujo-caja-anual](./01-flujo-caja-anual/01-flujo-caja-anual.md) — Vista mes a mes con ingresos, fijos y variables
- [02-proyeccion-variables](./02-proyeccion-variables/02-proyeccion-variables.md) — Estimación de gastos variables futuros por etiqueta
- [03-what-if](./03-what-if/03-what-if.md) — Simulador de impacto de un gasto nuevo
