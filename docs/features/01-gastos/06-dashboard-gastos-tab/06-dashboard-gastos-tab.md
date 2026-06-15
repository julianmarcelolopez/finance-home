# 06 — Dashboard de Gastos (tab)

## Descripción

Tab "Dashboard" como primera pantalla dentro de Gastos. Contiene tres sub-tabs: **Mes actual** (navegación mes a mes), **Semestre 1** (ene–jun, tabla pivot) y **Semestre 2** (jul–dic, tabla pivot).

## Estado

**Completo — 2026-06-15**

| Sub-doc | Descripción | Estado |
|---------|-------------|--------|
| [01-mes-actual](./01-mes-actual.md) | Detalle del mes: por origen, categorías, top 5, tabla | Completo |
| [02-navegacion-mes](./02-navegacion-mes.md) | Botones `← [mes] →` en "Mes actual" | Completo |
| [03-fix-periodo-tarjetas](./03-fix-periodo-tarjetas.md) | Período usa vencimiento, no cierre | Completo |
| [04-vista-semestral-pivot](./04-vista-semestral-pivot.md) | Tabla pivot Semestre 1 / Semestre 2 | Completo |

## Estructura de navegación

```
Gastos
└── [Dashboard]  Mercadopago  Efectivo  Tarjetas de crédito
      ├── [Mes actual]   ← sub-tab por defecto
      └── [Semestre]
```

## Sub-tab: Mes actual

Panel de detalle del mes en curso, cargado automáticamente al entrar a Gastos.

**Secciones:**
1. **Totales** — Total ARS y USD del mes
2. **Fijos vs Variables** — barra proporcional con montos absolutos y porcentajes
3. **Por categoría** — barras horizontales con color de cada categoría y porcentaje sobre el total
4. **Top 5 consumos** — los 5 más altos del mes: fecha, comercio, banco, monto

## Sub-tab: Semestre

Vista histórica de los últimos 6 meses.

**Secciones:**
1. **BarChart (recharts)** — barra por mes con el total en ARS. Click en una barra selecciona ese mes.
2. **Panel de detalle** — mismo componente que "Mes actual", cargado con el mes seleccionado

## API necesaria

### `GET /api/gastos-dashboard/semestral`

Últimos 6 meses con total de gastos:

```json
[
  { "mes": "2026-01", "total_pesos": 1200000, "total_dolares": 0 },
  { "mes": "2026-06", "total_pesos": 682929,  "total_dolares": 0 }
]
```

### `GET /api/gastos-dashboard/mes?mes=YYYY-MM`

Detalle completo de un mes:

```json
{
  "mes": "2026-06",
  "total_pesos": 682929,
  "total_dolares": 0,
  "fijos_pesos": 668329,
  "variables_pesos": 14600,
  "por_categoria": [
    { "nombre": "Salud", "color": "#dc2626", "monto": 604329, "porcentaje": 88.5 },
    { "nombre": "Sin categoría", "color": "#6b7280", "monto": 14600, "porcentaje": 2.1 }
  ],
  "top5": [
    { "id": "...", "fecha": "2026-02-12", "referencia": "SWISS MEDICAL", "pesos": 604329, "dolares": 0, "banco": "Galicia", "adicional": false }
  ]
}
```

## Frontend

**Archivos:**
- `apps/web/src/pages/gastos/GastosDashboard.tsx` — tab principal con sub-tabs
- `apps/web/src/pages/gastos/DetalleMes.tsx` — componente reutilizable de detalle (usado en ambos sub-tabs)

## Criterios de aceptación

- [ ] Al abrir Gastos, el sub-tab "Mes actual" está activo y muestra datos del mes en curso
- [ ] Fijos vs Variables usa `es_fijo` de `consumos_tarjeta`
- [ ] Los colores de categoría coinciden con `categorias.color`
- [ ] Los consumos sin categoría se agrupan en "Sin categoría" con color gris
- [ ] El Top 5 está ordenado de mayor a menor monto
- [ ] En Semestre, click en una barra carga el detalle de ese mes
- [ ] Si no hay consumos en un mes, la barra muestra 0 y el detalle muestra vacío

## Dependencias

- Feature 03-etiquetas: `categoria_id` y `es_fijo` en `consumos_tarjeta` ✅
- Recharts 2.x instalado en `apps/web` ✅
- Nuevo router `apps/api/src/routes/gastos-dashboard.ts`
