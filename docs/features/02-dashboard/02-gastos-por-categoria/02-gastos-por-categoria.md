# 02 — Gastos por categoría

## Descripción

Gráfico de barras (o torta) que muestra el desglose de gastos del mes por etiqueta. Permite ver de un vistazo en qué categoría se gastó más: Supermercado, Restaurantes, Transporte, etc.

## Estado

[ ] Pendiente. El Dashboard.tsx ya tiene el placeholder del Card con el mensaje "Disponible cuando se configuren las categorías". El endpoint `/api/dashboard/resumen` ya define el tipo `ResumenPorCategoria` en shared/types pero no lo retorna todavía.

## Alcance

**Incluye:**
- Gráfico de barras con recharts (ya importado en Dashboard.tsx): una barra por categoría, valor en ARS
- Porcentaje de cada categoría sobre el total
- Colores de barra tomados de `categorias.color` en Supabase
- Filtrando solo consumos de `consumos_tarjeta` del mes (Mercadopago y efectivo se suman cuando estén disponibles)

**No incluye:**
- Vista de torta (por ahora solo barras; puede ser toggle futuro)
- Drill-down al hacer clic en una barra (ver consumos de esa categoría)
- Comparativa vs mes anterior por categoría

## Modelo de datos

Tipo ya definido en `packages/shared/types/index.ts`:

```ts
interface ResumenPorCategoria {
  categoria: string
  monto: number
  porcentaje: number
}
```

Se agrega al response de `/api/dashboard/resumen` como campo `gastos_por_categoria: ResumenPorCategoria[]`.

La query agrupa `consumos_tarjeta` por `categoria_id` (FK a crear en tarea 03-etiquetas) y hace JOIN con `categorias` para obtener nombre y color.

## Endpoints

Se extiende `GET /api/dashboard/resumen` — no es un endpoint separado.

## Criterios de aceptación

- [ ] El gráfico de barras se renderiza con datos reales cuando al menos un consumo está etiquetado
- [ ] Los consumos sin etiqueta se agrupan en una barra "Sin categoría"
- [ ] La suma de todos los porcentajes es 100%
- [ ] El color de cada barra coincide con `categorias.color` de Supabase

## Dependencias

- Feature 03-etiquetas (tarea 01): `categoria_id` en `consumos_tarjeta` + tabla `categorias`
- recharts: ya instalado en `apps/web`
