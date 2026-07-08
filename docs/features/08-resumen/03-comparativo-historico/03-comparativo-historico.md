# 03 — Comparativo histórico (6 meses)

## Estado

**Pendiente.**

## Descripción

Vista comparativa de los últimos 6 meses (ingresos vs. gastos vs. saldo), usando únicamente datos ya cargados — sin proyección ni estimación, a diferencia de la fase 01. Complementa al resumen del mes actual dentro de la misma tab "Resumen mensual".

## Relación con lo existente

Este endpoint es parecido a `GET /api/gastos-dashboard/semestral` (`apps/api/src/routes/gastos-dashboard.ts`), que ya suma tarjetas + Mercadopago por mes para el gráfico de 6 meses del Dashboard. La diferencia es que acá hace falta sumar también ingresos y gastos fijos, y calcular el saldo — no conviene tocar `/semestral` porque alimenta al Dashboard existente, así que se crea un endpoint propio.

## Cambios previstos

### API

Nuevo endpoint en `apps/api/src/routes/gastos-resumen-mensual.ts`:

`GET /api/gastos-resumen-mensual/historico` → últimos 6 meses (incluye el actual), cada uno con:

```ts
export interface ResumenMensualHistorico {
  mes: string
  ingresos_ars: number
  gastos_ars: number
  saldo_ars: number
}
```

Ya está definido en `packages/shared/types/index.ts` (agregado en la fase 01, sin usar todavía).

Cálculo por mes (todo con datos ya cargados, sin distinción real/estimado):
- Ingresos: suma de `ingresos` del mes, convertidos ARS.
- Gastos: gastos fijos vigentes ese mes + Mercadopago del mes + tarjetas con resumen cuyo `vencimiento_actual` cae en ese mes (`total_pagar_pesos + total_pagar_dolares * blue`) — mismo criterio de asignación por `vencimiento_actual` que usa `/mes` y `/semestre` en `gastos-dashboard.ts`.
- Saldo: ingresos − gastos.

### Frontend

En `apps/web/src/lib/api.ts`: `api.gastosResumenMensual.historico()`.

En `apps/web/src/pages/gastos/ResumenMensualTab.tsx`: sección nueva debajo del desglose, con una tabla o barras (reutilizando el estilo de `TablaSemestre.tsx` en lo posible) comparando ingresos/gastos/saldo de los últimos 6 meses.

## Tareas

- [ ] Endpoint `GET /api/gastos-resumen-mensual/historico`
- [ ] Cliente `api.gastosResumenMensual.historico()`
- [ ] Vista comparativa en `ResumenMensualTab.tsx`
- [ ] Verificación manual: los totales de cada mes coinciden con lo que ya muestra la tab Dashboard para ese mes

## Criterios de aceptación

- [ ] El comparativo de 6 meses coincide con los totales ya visibles en la tab Dashboard existente
- [ ] No se rompe ninguna vista existente
