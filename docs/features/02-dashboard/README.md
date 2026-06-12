# Feature 02 — Dashboard

Pantalla de inicio con métricas del mes en curso. Muestra el estado financiero consolidado de Julian y Patricia: consumos de tarjeta, gastos fijos, proyecciones y alertas de vencimiento.

## Objetivo

Dar una lectura rápida del mes en curso sin tener que navegar a ninguna otra pantalla. Todo lo relevante del período en una sola vista.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-metricas-principales | Implementado (consumos + fijos + vencimientos + tipo de cambio) |
| 02-gastos-por-categoria | Pendiente (placeholder en `/` — requiere Feature 03) |
| 03-fijos-vs-variables | Pendiente |
| 04-top5-gastos | Pendiente |
| 05-semaforo-mes | Pendiente |

El endpoint `GET /api/dashboard/resumen` ya retorna `total_consumos_pesos`, `total_consumos_dolares`, `gastos_fijos_mes_ars`, `proximos_vencimientos` y `tipo_cambio`. El front lo muestra en cuatro MetricCards más una lista de vencimientos.

## Dependencias

- API: `/api/dashboard/resumen` (ya implementado)
- Feature 03-etiquetas: necesaria para las tareas 02, 03 y 05
- Feature 01-gastos: datos de consumos y gastos fijos
- bluelytics.com.ar: tipo de cambio cacheado 5 min en memoria

## Tareas

- [01-metricas-principales](./01-metricas-principales/01-metricas-principales.md) — Totales del mes en ARS/USD
- [02-gastos-por-categoria](./02-gastos-por-categoria/02-gastos-por-categoria.md) — Gráfico por etiqueta
- [03-fijos-vs-variables](./03-fijos-vs-variables/03-fijos-vs-variables.md) — Comparativa fijos vs variables
- [04-top5-gastos](./04-top5-gastos/04-top5-gastos.md) — Los 5 consumos más altos del mes
- [05-semaforo-mes](./05-semaforo-mes/05-semaforo-mes.md) — Proyección vs presupuesto
