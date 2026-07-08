# 08 — Resumen mensual con proyección de gastos

## Descripción

Nueva vista dentro de Gastos que muestra, para el mes en curso (o cualquier mes navegable), el total de ingresos, el total de gastos separado en **real** (ya cargado) y **estimado** (proyectado por promedio histórico), y el saldo proyectado resultante. Resuelve el problema de no saber cómo se viene el mes mientras el resumen de una tarjeta todavía no llegó.

Fuente del pedido: análisis de factibilidad hecho el 2026-07-06 sobre el mockup "Resumen mensual". Este documento registra las decisiones tomadas después de ese análisis y el plan de implementación fase a fase.

## Decisiones de diseño (post-análisis)

1. **Efectivo queda afuera de la v1.** La tab Efectivo sigue siendo un placeholder (tarea `01-gastos/04-efectivo-carga-manual`, sin implementar). La fila de desglose que en el mockup dice "Efectivo + Mercadopago" se muestra solo como **"Mercadopago"** hasta que exista la carga de efectivo. No se inventa un monto de efectivo.
2. **`dia_cierre` se agrega a `tarjetas`, pero solo para display.** La clasificación real/estimado de una tarjeta para un mes dado **no** depende de este campo — se deriva de si ya existe un `resumen_tarjeta` cargado con `vencimiento_actual` dentro de ese mes (mismo criterio que ya usa `gastos-dashboard.ts` para asignar consumos a un mes). `dia_cierre` solo se usa para mostrar textos como "cierra el 18/07" en tarjetas todavía sin resumen. Esto evita que un cierre corrido por feriado/fin de semana rompa la clasificación.
3. **Umbral de alerta: 20% hardcodeado en el backend**, como constante con comentario indicando que en el futuro podría pasar a una tabla de configuración (hoy no existe ninguna tabla de config en el proyecto, no se justifica crearla para un solo número).
4. **Conversión USD → ARS:** se usa el tipo de cambio blue (`getTipoCambio().blue.venta`), la misma lógica que ya aplican `gastos-dashboard.ts` (`/semestre`) y `planificacion.ts`, aplicada de forma consistente en todo el resumen mensual (ingresos, fijos, Mercadopago y tarjetas).
5. **En la UI**, todo monto con `tipo: 'estimado'` muestra un texto/tooltip aclarando que es una proyección simple basada en el promedio histórico de la tarjeta (no un cálculo de intereses ni prorrateo por día del ciclo — eso queda como mejora futura).

## No incluye (v1)

- Carga o estimación de gastos en efectivo.
- Prorrateo de la estimación por día transcurrido del ciclo ("día 6 de 30") — mencionado como opcional en el pedido original, se deja para una iteración futura si en algún momento se cargan consumos parciales de tarjetas con ciclo abierto.
- Tabla de configuración para el umbral de alerta — queda hardcodeado.
- Cambios en la tab "Dashboard" existente (`GastosDashboard.tsx` / `/api/gastos-dashboard/*`) — esta es una vista nueva y separada, no reemplaza al dashboard actual.

## Dependencias

- Tablas existentes: `tarjetas`, `resumenes_tarjeta`, `consumos_tarjeta`, `gastos_fijos`, `gastos_mercadopago`, `ingresos`
- Servicio `getTipoCambio()` (`apps/api/src/services/tipo-cambio.ts`)
- Nueva columna `tarjetas.dia_cierre`

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-resumen-real-estimado | Implementado — migración corrida y verificada, incluye cuotas de préstamos |
| 02-alertas-desvio | Pendiente |
| 03-comparativo-historico | Pendiente |

## Fases

- [01-resumen-real-estimado](./01-resumen-real-estimado/01-resumen-real-estimado.md) — resumen del mes con gastos reales (fijos, Mercadopago, tarjetas con resumen cargado) vs. estimados (tarjetas con ciclo abierto, proyectadas por promedio histórico), y saldo proyectado
- [02-alertas-desvio](./02-alertas-desvio/02-alertas-desvio.md) — marca visualmente una tarjeta cuyo resumen real supera en 20%+ su promedio histórico
- [03-comparativo-historico](./03-comparativo-historico/03-comparativo-historico.md) — tabla/gráfico de ingresos vs. gastos vs. saldo de los últimos 6 meses, con datos ya cargados

## Criterios de aceptación (feature completa)

- [ ] La vista muestra ingresos, gastos reales+estimados y saldo proyectado del mes actual
- [ ] Cada tarjeta activa aparece clasificada como real o estimado según si tiene resumen cargado ese mes
- [ ] Los montos estimados están claramente marcados como proyección simple (no se confunden con datos reales)
- [ ] La fila "Efectivo" no aparece mezclada con Mercadopago
- [ ] Una tarjeta cuyo resumen real supera en 20%+ su promedio histórico se marca visualmente
- [ ] El comparativo de 6 meses coincide con los totales ya visibles en la tab Dashboard existente
- [ ] No se rompe ninguna vista existente (Dashboard, Tarjetas, Mercadopago, Préstamos)
