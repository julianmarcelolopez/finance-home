# 04 — Vista semestral pivot

## Descripción

Dos sub-tabs fijos dentro de Dashboard de Gastos: **Semestre 1** (ene–jun) y **Semestre 2** (jul–dic). Cada uno muestra una tabla pivot con filas = orígenes de gasto y columnas = meses del semestre, todos los montos en ARS.

## Estado

**Completo — 2026-06-15**

## Layout visual

```
                        Ene     Feb     Mar     Abr     May     Jun
TARJETAS DE CRÉDITO
Mastercard Black Galicia — Lopez, Julian
                         —       —       —       —    $534.950  $684.044
PRÉSTAMOS
Galicia Personal         —       —       —    $679.718 $714.233 $710.185
GASTOS FIJOS
Gastos fijos          $50.000 $50.000 $50.000 $50.000 $50.000  $50.000
─────────────────────────────────────────────────────────────────────
Total                 $50.000 $50.000 $50.000 $729.718 $1.299.183 $1.444.229
```

Celdas sin dato muestran `—` en gris. Filas agrupadas por tipo con encabezado de sección.

## Criterio de atribución de mes

| Fuente | Campo que determina el mes |
|--------|---------------------------|
| Tarjetas | `vencimiento_actual` del resumen |
| Préstamos | `fecha_vencimiento` de la cuota |
| Gastos fijos | mismo monto replicado en todos los meses del semestre |

## Archivos creados / modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `apps/web/src/pages/gastos/TablaSemestre.tsx` | Nuevo | Componente pivot; props: `{ semestre: 1 \| 2 }` |
| `apps/web/src/pages/gastos/GastosDashboard.tsx` | Modificado | Sub-tabs `semestre-1` y `semestre-2` reemplazan el placeholder `semestre` |
| `apps/api/src/routes/gastos-dashboard.ts` | Modificado | Nuevo endpoint `GET /semestre` |
| `packages/shared/types/index.ts` | Modificado | Tipos `FilaSemestre`, `SemestreResumen` |
| `apps/web/src/lib/api.ts` | Modificado | `api.gastosDashboard.semestre(año, semestre)` |

## API

### `GET /api/gastos-dashboard/semestre?año=YYYY&semestre=1|2`

```json
{
  "año": 2026,
  "semestre": 1,
  "meses": ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"],
  "filas": [
    {
      "nombre": "Mastercard Black Galicia — Lopez, Julian",
      "tipo": "tarjeta",
      "meses": { "2026-05": 534950, "2026-06": 684044 }
    },
    {
      "nombre": "Galicia Personal",
      "tipo": "prestamo",
      "meses": { "2026-04": 679718, "2026-05": 714233, "2026-06": 710185 }
    },
    {
      "nombre": "Gastos fijos",
      "tipo": "gastos_fijos",
      "meses": { "2026-01": 50000, "2026-02": 50000, "2026-03": 50000,
                 "2026-04": 50000, "2026-05": 50000, "2026-06": 50000 }
    }
  ],
  "totales": {
    "2026-01": 50000,
    "2026-04": 729718,
    "2026-05": 1299183,
    "2026-06": 1444229
  }
}
```

Lógica del endpoint:
1. Calcula los 6 meses `YYYY-MM` del semestre pedido.
2. Corre 4 queries en paralelo: consumos tarjeta (por `vencimiento_actual`), cuotas préstamo (por `fecha_vencimiento`), gastos fijos activos, tipo de cambio.
3. Agrupa tarjetas por `{marca_tarjeta} {banco} — {titular}` y suma pesos del mes (USD convertido a ARS con tipo de cambio blue).
4. Agrupa préstamos por `{banco} {tipo}` y suma `monto_total` de cuotas.
5. Gastos fijos: suma todos los activos y replica el total en los 6 meses.
6. Calcula `totales` sumando todas las filas por mes.

## Shared types

```ts
export interface FilaSemestre {
  nombre: string
  tipo: 'tarjeta' | 'prestamo' | 'gastos_fijos'
  meses: Record<string, number>  // YYYY-MM → ARS
}

export interface SemestreResumen {
  año: number
  semestre: 1 | 2
  meses: string[]                   // lista ordenada de YYYY-MM del semestre
  filas: FilaSemestre[]
  totales: Record<string, number>   // YYYY-MM → total ARS
}
```

## Dependencias

- Feature 06-préstamos: tabla `cuotas_prestamo` con campo `fecha_vencimiento` ✅
- Feature 01-gastos `05-gastos-fijos-abm`: tabla `gastos_fijos` con campo `activo` ✅
- Tarjetas: `resumenes_tarjeta` con `vencimiento_actual` ✅
