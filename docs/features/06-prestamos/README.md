# Feature 06 — Préstamos

Módulo para registrar y hacer seguimiento de préstamos (personal, prendario, hipotecario, etc). Expone las cuotas de cada mes en el Dashboard de Gastos para consolidar el gasto mensual total.

## Objetivo

Registrar cualquier tipo de préstamo con su cronograma de cuotas completo, visualizar el estado pagado/pendiente de cada cuota, y sumar la cuota del mes corriente al resumen de gastos del Dashboard.

## Ubicación en la app

- **Sidebar:** sin ítem nuevo — vive dentro de `Gastos`
- **Tab nuevo:** `Gastos > Préstamos` (paralelo a Tarjetas de crédito)
- **Dashboard de Gastos:** fila "Cuotas préstamos" en el resumen mensual
- **Dashboard home:** métrica "Próxima cuota" (monto + fecha)

## Estado actual

**Feature completa — 2026-06-13**

| Fase | Tarea | Estado |
|------|-------|--------|
| 01 | SQL — tablas `prestamos` + `cuotas_prestamo` | Completo |
| 02 | Shared types | Completo |
| 03 | API — endpoints CRUD | Completo |
| 04 | Frontend — tab Préstamos | Completo |
| 05 | Integración Dashboard de Gastos | Completo |

## Datos en producción

- Préstamo Galicia Personal Julian (id: `400621f7-0535-41b6-a303-4cfc76dc7df3`)
  - 12 cuotas cargadas, cuotas 1 y 2 marcadas como pagadas
  - Próxima cuota: #3 · $710.185,95 · 16/06/2026

## Pendientes / mejoras futuras

- **Resumen en la card sin expandir**: `GET /api/prestamos` no devuelve cuotas. El header de cada préstamo muestra "Cuota ? de ?" hasta que el usuario expande. Solución: agregar campos `total_cuotas` y `cuotas_pagadas` calculados al endpoint de lista.
- **Cerrar préstamo desde UI**: no hay botón para setear `activo = false`. Hoy se haría con PATCH manual.
- **Editar capital adeudado desde UI**: útil para actualizar el saldo después de cada pago.
- **Cuotas UVA**: el modal permite cargar una cuota a la vez, pero no hay flujo de "actualizar monto de cuota futura" desde la UI (el endpoint PATCH ya existe).

## Fases

- [01-sql](./01-sql/01-sql.md)
- [02-shared-types](./02-shared-types/02-shared-types.md)
- [03-api](./03-api/03-api.md)
- [04-frontend-tab](./04-frontend-tab/04-frontend-tab.md)
- [05-dashboard-integration](./05-dashboard-integration/05-dashboard-integration.md)

## Dependencias

- Tablas `prestamos` y `cuotas_prestamo` en Supabase
- API Express: `/api/prestamos`, `/api/prestamos/:id/cuotas`
- Feature 01-gastos: se agrega el tab Préstamos a `Gastos.tsx`
- Feature 01-gastos `06-dashboard-gastos-tab`: se incorpora la cuota mensual en `DetalleMes`
- Feature 02-dashboard: se agrega métrica "Próxima cuota" al resumen home
