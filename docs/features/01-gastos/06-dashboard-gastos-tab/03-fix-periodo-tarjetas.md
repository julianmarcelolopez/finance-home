# 03 — Fix: Período de tarjetas usa vencimiento, no cierre

## Descripción

En `Gastos > Tarjetas > (tabla de resúmenes)`, la columna "Período" mostraba el mes de `cierre_actual`. Se corrigió para que muestre el mes de `vencimiento_actual`, que es el mes en que realmente hay que pagar.

## Motivación

Un resumen con cierre el 21/05/2026 y vencimiento el 01/06/2026 se debe mostrar como "junio 2026", no "mayo 2026". El usuario paga en junio, entonces el período es junio.

Esta convención es consistente con el criterio ya establecido para los consumos: un gasto "pertenece" al mes de su `fecha_vencimiento` / `vencimiento_actual`, no al mes de la transacción o del cierre.

## Archivos modificados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `apps/web/src/pages/gastos/TarjetaResumenes.tsx` | 78, 144 | `cierre_actual` → `vencimiento_actual` en el label del header card y en la columna Período de la tabla |
