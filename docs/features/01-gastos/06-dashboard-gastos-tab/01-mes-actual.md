# 01 — Mes Actual

## Descripción

Sub-tab "Mes actual" dentro del tab Dashboard de Gastos. Vista consolidada del mes en curso: totales por origen, fijos vs variables, breakdown por categoría, top 5 y tabla completa de todos los gastos.

## Estado

[ ] Pendiente

## Layout visual

```
Gastos → Dashboard → [Mes actual]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Junio 2026

Totales por origen
┌─────────────────────────────┬──────────────┬─────────┐
│ MC Galicia — Julian         │  $682.929    │         │
│ MC Galicia — Patricia       │  $0          │         │
│ MC ICBC — Julian            │  $0          │         │
│ Mercadopago Julian          │  —           │ pending │
│ Mercadopago Patricia        │  —           │ pending │
│ Efectivo                    │  —           │ pending │
├─────────────────────────────┼──────────────┼─────────┤
│ TOTAL                       │  $682.929    │         │
└─────────────────────────────┴──────────────┴─────────┘

Fijos vs Variables
Fijo ████████████████████░░ Variable
$668.329 (97.9%)               $14.600 (2.1%)

Por categoría
● Salud      ████████████████████  88.5%   $604.329
● Deporte    ██░░░░░░░░░░░░░░░░░░   9.4%    $64.000
● Sin categ. █░░░░░░░░░░░░░░░░░░░   2.1%    $14.600

Top 5 del mes
12/02  SWISS MEDICAL       MC Galicia Julian   $604.329
05/02  MERPAGO SPORTCLU    MC Galicia Julian    $64.000
13/05  WWW JULERIAQUE      MC Galicia Julian    $14.600

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Todos los gastos del mes

Fecha   Comercio            Origen              Categoría    Tipo      ARS
12/02   SWISS MEDICAL       MC Galicia Julian   ● Salud      Fijo    $604.329
05/02   MERPAGO SPORTCLU    MC Galicia Julian   ● Deporte    Fijo     $64.000
13/05   WWW JULERIAQUE      MC Galicia Julian   —            Variable $14.600
```

## Orden de desarrollo

1. Shared types
2. API — endpoint `GET /api/gastos-dashboard/mes`
3. API client
4. Frontend — `DetalleMes.tsx` + `GastosDashboard.tsx` + actualizar `Gastos.tsx`

---

## Fase 1 — Shared types

Agregar a `packages/shared/types/index.ts`:

```ts
export interface ResumenOrigen {
  nombre: string        // "MC Galicia — Julian"
  pesos: number
  dolares: number
  disponible: boolean   // false = fuente no implementada aún (MP, Efectivo)
}

export interface ResumenCategoriaMes {
  nombre: string        // "Salud", "Sin categoría"
  color: string         // hex
  monto: number
  porcentaje: number
}

export interface Top5Consumo {
  id: string
  fecha: string
  referencia: string
  pesos: number
  dolares: number
  origen: string        // "MC Galicia — Julian"
  adicional: boolean
}

export interface ConsumoMes {
  id: string
  fecha: string
  referencia: string
  pesos: number
  dolares: number
  origen: string
  categoria_nombre: string | null
  categoria_color: string | null
  es_fijo: boolean
  adicional: boolean
}

export interface DetalleMes {
  mes: string                          // "2026-06"
  por_origen: ResumenOrigen[]
  total_pesos: number
  total_dolares: number
  fijos_pesos: number
  variables_pesos: number
  por_categoria: ResumenCategoriaMes[]
  top5: Top5Consumo[]
  consumos: ConsumoMes[]
}
```

---

## Fase 2 — API

**Archivo:** `apps/api/src/routes/gastos-dashboard.ts`

**Endpoint:** `GET /api/gastos-dashboard/mes?mes=YYYY-MM`

Lógica interna:
1. Calcular `lastDay` del mes pedido
2. Query a `consumos_tarjeta` con join `!inner` a `resumenes_tarjeta` filtrando por `vencimiento_actual` del resumen (no por `fecha` de la transacción). Un consumo "pertenece" al mes en que hay que pagarlo, no en que se realizó.
3. Calcular en JS:
   - `por_origen`: agrupar por `banco + titular`, sumar pesos/dolares
   - `total_pesos`, `total_dolares`: suma total
   - `fijos_pesos`, `variables_pesos`: filtrar por `es_fijo`
   - `por_categoria`: agrupar por `categoria_id`, calcular monto y porcentaje (sin categoría → "Sin categoría", color `#6b7280`)
   - `top5`: los mismos consumos ordenados por `pesos DESC`, tomar los primeros 5
   - `consumos`: todos los consumos del mes con los campos mapeados para la tabla

**Registrar** en `apps/api/src/index.ts`:
```ts
import gastosDashboardRouter from './routes/gastos-dashboard'
app.use('/api/gastos-dashboard', gastosDashboardRouter)
```

---

## Fase 3 — API client

Agregar a `apps/web/src/lib/api.ts`:

```ts
gastosDashboard: {
  mes: (mes: string) =>
    http.get<DetalleMes>(`/api/gastos-dashboard/mes`, { params: { mes } }).then(r => r.data),
},
```

---

## Fase 4 — Frontend

### `DetalleMes.tsx`
**Props:** `{ mes: string }`
- Llama a `api.gastosDashboard.mes(mes)` en `useEffect`
- Renderiza las 5 secciones: por origen, fijos/variables, por categoría, top5, tabla completa
- Barra fijos/variables: CSS puro (`flex`, width calculado por porcentaje)
- Barras por categoría: `div` con `width: X%` y `backgroundColor: color`
- Tabla de consumos: componente `<Table>` de shadcn/ui

### `GastosDashboard.tsx`
- Sub-tabs: `[ Mes actual ] [ Semestre ]`
- "Mes actual" → `<DetalleMes mes={mesActual()} />`
- "Semestre" → placeholder por ahora

### `Gastos.tsx`
- Agregar "Dashboard" como primer tab (antes de Mercadopago)
- Cambiar tab activo por defecto a `'dashboard'`

---

## Criterios de aceptación

- [ ] Al abrir Gastos, el tab Dashboard → Mes actual está activo por defecto
- [ ] Se ven los totales por tarjeta con el banco y titular
- [ ] Orígenes sin implementar (MP, Efectivo) aparecen con `—` en gris
- [ ] La barra Fijos/Variables muestra proporciones correctas
- [ ] Las barras de categoría tienen el color de `categorias.color`
- [ ] Los consumos sin categoría se agrupan en "Sin categoría"
- [ ] El Top 5 está ordenado de mayor a menor
- [ ] La tabla inferior muestra todos los consumos del mes con categoría y tipo

## Dependencias

- Feature 03-etiquetas: `categoria_id`, `es_fijo` en `consumos_tarjeta` ✅
- Tablas `resumenes_tarjeta` y `categorias` en Supabase ✅
- `mesActual()` helper ya en `apps/web/src/lib/utils.ts` ✅
