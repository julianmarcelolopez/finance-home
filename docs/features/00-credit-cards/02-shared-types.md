# Fase 1 — Tipos compartidos

> **Archivo:** `packages/shared/types/index.ts`
> **Estado:** Implementado

## Tipos agregados

```typescript
export interface Tarjeta {
  id: string
  banco: string
  marca: string       // "Visa" | "Mastercard" | "Amex" (marca familia, no producto)
  nro_cuenta: string  // número completo de cuenta (ej: "001747133")
  titular: string     // "Julian" | "Patricia"
  activo: boolean
  created_at: string
}

export interface TarjetaCreate {
  banco: string
  marca: string
  nro_cuenta: string
  titular: string
}
```

## Notas de campo

| Campo | Decisión |
|---|---|
| `marca` | Familia de red (`Mastercard`), no el producto bancario (`Mastercard Black`). El display usa el valor de `tarjetas.marca`; el resumen tiene el detalle completo en `resumenes_tarjeta.marca_tarjeta`. |
| `nro_cuenta` | Número de cuenta completo, no los últimos 4. Una cuenta puede tener múltiples plásticos (titular + adicionales). El chip muestra `nro_cuenta.slice(-4)`. |
| `titular` | `"Julian"` o `"Patricia"` — valores cortos propios del dominio. Los registros en `resumenes_tarjeta` tienen nombres completos (`"Lopez, Julian Marcelo"`); el vínculo es por FK, no por comparación de strings. |

## Constantes locales (en `NuevaTarjetaModal.tsx`)

```typescript
const BANCOS    = ['Galicia', 'Santander', 'BBVA', 'ICBC', 'Naranja X']
const MARCAS    = ['Visa', 'Mastercard', 'Amex']
const TITULARES = ['Julian', 'Patricia']
```
