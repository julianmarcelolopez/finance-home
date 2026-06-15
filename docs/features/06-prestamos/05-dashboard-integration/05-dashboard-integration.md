# 06-05 — Integración Dashboard

## Descripción

Dos integraciones: (1) fila "Cuotas préstamos" en el resumen mensual de `Gastos > Dashboard`, y (2) métrica "Próxima cuota" en el Dashboard home.

## Estado

- [ ] Pendiente

## 1 — Dashboard de Gastos (Gastos > Dashboard > Mes actual)

### Objetivo

Sumar las cuotas del mes corriente al consolidado mensual que ya muestra tarjetas y gastos fijos.

### Endpoint a extender o crear

`GET /api/gastos/resumen-mes?mes=YYYY-MM`

Actualmente devuelve consumos de tarjeta. Se extiende para incluir:

```typescript
{
  mes: string,
  consumos_tarjeta_pesos: number,
  consumos_tarjeta_dolares: number,
  gastos_fijos_ars: number,
  cuotas_prestamos: CuotaMesResumen[],   // ← nuevo
  cuotas_prestamos_total_ars: number     // ← nuevo (suma de monto_total del mes)
}
```

La query suma `cuotas_prestamo.monto_total` donde `fecha_vencimiento` esté dentro del mes solicitado y el préstamo esté activo.

### Vista en DetalleMes

```
Junio 2026
──────────────────────────────────────────────
Tarjetas de crédito              $684.044,99
Cuotas préstamos                 $710.185,95   ← nuevo
  Galicia Personal · cuota 3/12 · 16/06
Gastos fijos                     $XXX.XXX,XX
──────────────────────────────────────────────
Total estimado                 $X.XXX.XXX,XX
```

Las cuotas del mes se listan como sub-filas debajo del total de préstamos (igual que los consumos por tarjeta).

### Archivo a modificar

`apps/web/src/pages/gastos/DetalleMes.tsx` — agregar sección de cuotas_prestamos entre tarjetas y gastos fijos.

---

## 2 — Dashboard home

### Objetivo

Mostrar la próxima cuota pendiente como métrica en el Dashboard home, para que sea visible de un vistazo.

### Endpoint a extender

`GET /api/dashboard/resumen` — agregar campo:

```typescript
proxima_cuota_prestamo: {
  banco: string
  tipo: string
  numero_cuota: number
  total_cuotas: number
  fecha_vencimiento: string
  monto_total: number
  persona: Persona
} | null
```

La query busca la cuota más próxima no pagada de todos los préstamos activos (MIN fecha_vencimiento WHERE pagada = false).

### Vista en Dashboard.tsx

Nueva MetricCard:

```
┌─────────────────────────────┐
│ Próxima cuota préstamo  💳  │
│ $710.185,95                 │
│ Galicia Personal 3/12       │
│ vence 16/06/2026            │
└─────────────────────────────┘
```

Si no hay préstamos activos, la card no se renderiza.

### Archivo a modificar

`apps/web/src/pages/Dashboard.tsx` — agregar MetricCard condicional después de "Gastos fijos del mes".

---

## Criterios de aceptación

- [x] `Gastos > Dashboard` suma las cuotas del mes al total mensual
- [x] Las cuotas del mes aparecen como sub-filas expandibles con banco, tipo, número de cuota y fecha
- [x] El total del mes = tarjetas + cuotas préstamos (gastos fijos es sección aparte)
- [x] Dashboard home muestra la próxima cuota pendiente con monto, banco y fecha
- [x] Si no hay préstamos activos, la MetricCard de próxima cuota no aparece
- [ ] Cuotas en moneda USD se convierten al blue para el total en ARS — pendiente (todos los préstamos actuales son ARS)

## Notas de implementación

- La cuota pertenece al mes de su `fecha_vencimiento` (consistente con `vencimiento_actual` de tarjetas)
- El `useState(cuotasExpandidas)` debe declararse antes de los early returns del componente — Rules of Hooks
