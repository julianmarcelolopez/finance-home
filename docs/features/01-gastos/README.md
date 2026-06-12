# Feature 01 — Gastos

Pantalla principal de seguimiento de consumos. Agrupa en tres tabs: Mercadopago, Efectivo y Tarjetas de crédito. Cada tab expone un vector de ingreso de datos distinto (API externa, carga manual, parse de PDF vía n8n).

## Objetivo

Registrar y visualizar todos los gastos de Julian y Patricia, independientemente del medio de pago, en una sola pantalla unificada.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-cargar-tarjetas | Implementado |
| 02-mp-api-julian | Pendiente |
| 03-mp-api-patricia | Pendiente |
| 04-efectivo-carga-manual | Pendiente |
| 05-gastos-fijos-abm | Pendiente (API lista, UI faltante) |

La tab **Tarjetas** está completamente operativa: muestra chips por tarjeta, resúmenes paginados y consumos individuales. Las tabs **Mercadopago** y **Efectivo** muestran un placeholder `"próximamente"`.

## Dependencias

- Supabase: tablas `tarjetas`, `resumenes_tarjeta`, `consumos_tarjeta`, `gastos_fijos`
- n8n: workflows de parse de PDFs para Galicia e ICBC (parseo → Supabase)
- API Express: `/api/tarjetas`, `/api/resumenes`, `/api/consumos`, `/api/gastos-fijos`
- Feature 03-etiquetas: las tareas de Mercadopago y efectivo necesitan etiquetado

## Tareas

- [01-cargar-tarjetas](./01-cargar-tarjetas/01-cargar-tarjetas.md) — ABM de tarjetas de crédito
- [02-mp-api-julian](./02-mp-api-julian/02-mp-api-julian.md) — Conexión MP API cuenta Julián
- [03-mp-api-patricia](./03-mp-api-patricia/03-mp-api-patricia.md) — Conexión MP API cuenta Patricia
- [04-efectivo-carga-manual](./04-efectivo-carga-manual/04-efectivo-carga-manual.md) — Registro manual de gastos en efectivo
- [05-gastos-fijos-abm](./05-gastos-fijos-abm/05-gastos-fijos-abm.md) — ABM de gastos fijos recurrentes
- [06-dashboard-gastos-tab](./06-dashboard-gastos-tab/06-dashboard-gastos-tab.md) — Tab Dashboard con vista semestral y drill-down por mes
