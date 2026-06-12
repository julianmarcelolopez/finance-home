# 01 — Métricas principales del mes

## Descripción

Cuatro MetricCards en la parte superior del Dashboard: consumos de tarjeta del mes en ARS y USD, gastos fijos totales convertidos al blue, proyectos activos y vencimientos del mes. Más el tipo de cambio oficial y blue en tiempo real.

## Estado

Implementado. Ver `apps/web/src/pages/Dashboard.tsx` y `apps/api/src/routes/dashboard.ts`.

## Alcance

**Incluye:**
- `total_consumos_pesos`: suma de `consumos_tarjeta.pesos` del mes en curso
- `total_consumos_dolares`: suma de `consumos_tarjeta.dolares` del mes en curso
- `gastos_fijos_mes_ars`: suma de todos los fijos activos, USD convertidos al blue
- `proximos_vencimientos`: resúmenes de tarjeta cuyo `vencimiento_actual` cae en el mes
- `tipo_cambio`: oficial y blue de bluelytics.com.ar, cacheado 5 minutos en memoria
- Fecha del mes en español (ej: "junio 2026") debajo del título

**No incluye:**
- Comparativa vs mes anterior (pendiente — faltaría un campo `delta_pct` en el response)
- Consumos de efectivo y Mercadopago (dependen de features pendientes)
- Ingresos del mes en el resumen

## Modelo de datos

Respuesta de `GET /api/dashboard/resumen` — tipo `DashboardResumen` en `packages/shared/types/index.ts`:

```ts
interface DashboardResumen {
  mes_actual: string           // "2026-06"
  total_consumos_pesos: number
  total_consumos_dolares: number
  gastos_fijos_mes_ars: number
  proyectos_activos: number
  proximos_vencimientos: ResumenTarjeta[]
  tipo_cambio: TipoCambio
}
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/resumen` | Resumen del mes en curso |

Combina 5 queries en paralelo (`Promise.all`): consumos, gastos fijos, resúmenes, proyectos (count), tipo de cambio.

## Criterios de aceptación

- [x] Las cuatro MetricCards se renderizan con datos reales al cargar el Dashboard
- [x] El tipo de cambio se muestra con dos decimales en formato ARS
- [x] Si no hay vencimientos en el mes, la card "Vencimientos este mes" muestra 0
- [ ] Comparativa vs mes anterior con flecha y porcentaje de cambio (pendiente)
- [x] El tipo de cambio no genera una request por cada carga — está cacheado

## Dependencias

- Tabla `gastos_fijos` creada en Supabase (pendiente — sin eso `gastos_fijos_mes_ars` da 0)
- bluelytics.com.ar disponible (si cae, el endpoint responde 500)
