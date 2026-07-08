# Feature 01 — Gastos

Pantalla principal de seguimiento de consumos. Agrupa en tres tabs: Mercadopago, Efectivo y Tarjetas de crédito. Cada tab expone un vector de ingreso de datos distinto (carga manual, parse de PDF vía n8n). El sync automático por API (Mercadopago) quedó bloqueado a favor de la carga manual — ver tarea 07.

## Objetivo

Registrar y visualizar todos los gastos de Julian y Patricia, independientemente del medio de pago, en una sola pantalla unificada.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-cargar-tarjetas | Implementado |
| 02-mp-api-julian | Bloqueada (se prioriza la carga manual, tarea 07) |
| 03-mp-api-patricia | Bloqueada (se prioriza la carga manual, tarea 07) |
| 04-efectivo-carga-manual | Pendiente |
| 05-gastos-fijos-abm | Pendiente (API lista, UI faltante) |
| 07-mercadopago-carga-manual | Implementado (pendiente de verificación en vivo) |

La tab **Tarjetas** está completamente operativa: muestra chips por tarjeta, resúmenes paginados y consumos individuales. La tab **Mercadopago** ya tiene carga manual funcional (tarea 07). La tab **Efectivo** todavía muestra un placeholder `"próximamente"`.

## Dependencias

- Supabase: tablas `tarjetas`, `resumenes_tarjeta`, `consumos_tarjeta`, `gastos_fijos`, `gastos_mercadopago`
- n8n: workflows de parse de PDFs para Galicia e ICBC (parseo → Supabase)
- API Express: `/api/tarjetas`, `/api/resumenes`, `/api/consumos`, `/api/gastos-fijos`, `/api/gastos-mercadopago`
- Feature 03-etiquetas: las tareas de Mercadopago y efectivo necesitan etiquetado

## Tareas

- [01-cargar-tarjetas](./01-cargar-tarjetas/01-cargar-tarjetas.md) — ABM de tarjetas de crédito
- [02-mp-api-julian](./02-mp-api-julian/02-mp-api-julian.md) — Conexión MP API cuenta Julián (bloqueada)
- [03-mp-api-patricia](./03-mp-api-patricia/03-mp-api-patricia.md) — Conexión MP API cuenta Patricia (bloqueada)
- [04-efectivo-carga-manual](./04-efectivo-carga-manual/04-efectivo-carga-manual.md) — Registro manual de gastos en efectivo
- [05-gastos-fijos-abm](./05-gastos-fijos-abm/05-gastos-fijos-abm.md) — ABM de gastos fijos recurrentes
- [06-dashboard-gastos-tab](./06-dashboard-gastos-tab/06-dashboard-gastos-tab.md) — Tab Dashboard con vista semestral y drill-down por mes
- [07-mercadopago-carga-manual](./07-mercadopago-carga-manual/00-overview.md) — Carga manual de gastos Mercadopago (reemplaza 02/03 por ahora)
