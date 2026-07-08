# 02 — Alertas de desvío

## Estado

**Pendiente.**

## Descripción

Cuando el resumen real de una tarjeta llega y su monto supera en X% su promedio histórico, marcarlo visualmente en la vista de [01-resumen-real-estimado](../01-resumen-real-estimado/01-resumen-real-estimado.md), con un banner que explique el desvío y una proyección simple de cómo cerraría el mes si la tendencia se mantiene (igual al mockup original).

## Decisión aplicada

**Umbral: 20% hardcodeado en el backend**, como constante con comentario indicando que en el futuro podría pasar a una tabla de configuración. Hoy no existe ninguna tabla de config en el proyecto — no se justifica crear una para un solo número.

## Cambios previstos

### API

En `apps/api/src/routes/gastos-resumen-mensual.ts`, dentro del cálculo de `componentesTarjetas`:

- Agregar constante:
  ```ts
  // Umbral de desvío para marcar una tarjeta con alerta visual. Hardcodeado por ahora;
  // si en el futuro se necesita ajustar por usuario, mover a una tabla de configuración.
  const UMBRAL_ALERTA_DESVIO_PORCENTAJE = 20
  ```
- Para cada tarjeta con `tipo: 'real'` (resumen ya cargado), calcular el mismo promedio histórico usado para las estimadas (hasta 6 resúmenes anteriores, sin contar el actual). Si `monto_ars > promedio * (1 + UMBRAL_ALERTA_DESVIO_PORCENTAJE / 100)`, setear `alerta_desvio: true` y `porcentaje_desvio: Math.round((monto_ars / promedio - 1) * 100)`.
- Si no hay histórico suficiente para comparar, no se marca alerta (no hay base de comparación).

### Frontend

En `apps/web/src/pages/gastos/ResumenMensualTab.tsx`:
- Banner arriba del desglose (estilo amber, como el mockup) listando cada componente con `alerta_desvio: true`: nombre, % de desvío, y una proyección de cierre ("si sigue así, el resumen cerraría en ~$X") usando `monto_ars` real y el ritmo de desvío — mismo texto que ya usa el mockup, calculado en el frontend a partir de `porcentaje_desvio`.
- Si no hay ninguna alerta, no se muestra el banner (no agregar un estado vacío ruidoso).

## Tareas

- [ ] Constante `UMBRAL_ALERTA_DESVIO_PORCENTAJE` + cálculo de desvío en el endpoint
- [ ] Poblar `alerta_desvio` / `porcentaje_desvio` en los componentes de tipo tarjeta real
- [ ] Banner de alerta en `ResumenMensualTab.tsx`
- [ ] Verificación manual: cargar un resumen de prueba 25% arriba del promedio y confirmar que se marca

## Criterios de aceptación

- [ ] Una tarjeta cuyo resumen real supera en 20%+ su promedio histórico se marca visualmente
- [ ] Sin desvíos, no aparece ningún banner
- [ ] El % de desvío mostrado coincide con `(monto_real / promedio - 1) * 100`
