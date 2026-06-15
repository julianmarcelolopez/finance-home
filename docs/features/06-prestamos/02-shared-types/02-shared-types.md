# 06-02 — Shared Types

## Descripción

Tipos TypeScript compartidos entre API y frontend para `prestamos` y `cuotas_prestamo`. Se agregan a `packages/shared/types/index.ts`.

## Estado

- [ ] Pendiente

## Tipos a agregar

```typescript
// ---- Préstamos ----

export type Moneda = 'ARS' | 'USD' | 'UVA'
export type Persona = 'Julian' | 'Patricia' | 'Compartido'

export interface CuotaPrestamo {
  id: string
  prestamo_id: string
  numero_cuota: number
  fecha_vencimiento: string       // ISO date YYYY-MM-DD
  monto_total: number
  interes_nominal: number | null
  sellos: number | null
  iva_interes: number | null
  amortizacion: number | null
  pagada: boolean
  created_at: string
}

export interface Prestamo {
  id: string
  numero: string
  banco: string
  tipo: string                    // texto libre: "Personal", "Prendario", etc.
  tasa: number | null
  sistema_amortizacion: string | null
  monto_solicitado: number
  capital_adeudado: number | null
  moneda: Moneda
  persona: Persona
  cuenta_debito: string | null
  activo: boolean
  created_at: string
  cuotas?: CuotaPrestamo[]        // incluido cuando se pide con detalle
}

export interface PrestamoCreate {
  numero: string
  banco: string
  tipo: string
  tasa?: number
  sistema_amortizacion?: string
  monto_solicitado: number
  capital_adeudado?: number
  moneda: Moneda
  persona: Persona
  cuenta_debito?: string
}

export interface CuotaPrestamoCreate {
  numero_cuota: number
  fecha_vencimiento: string
  monto_total: number
  interes_nominal?: number
  sellos?: number
  iva_interes?: number
  amortizacion?: number
  pagada?: boolean
}

// Payload para dar de alta un préstamo completo con su cronograma
export interface PrestamoConCuotasCreate {
  prestamo: PrestamoCreate
  cuotas: CuotaPrestamoCreate[]
}

// Para el resumen del Dashboard de Gastos (cuota del mes corriente)
export interface CuotaMesResumen {
  prestamo_id: string
  banco: string
  tipo: string
  persona: Persona
  numero_cuota: number
  fecha_vencimiento: string
  monto_total: number
  pagada: boolean
}
```

## Criterios de aceptación

- [ ] Los tipos compilan sin errores en API y web
- [ ] `PrestamoConCuotasCreate` permite dar de alta en un solo POST el préstamo + todas las cuotas
- [ ] `CuotaMesResumen` es suficiente para que el Dashboard de Gastos muestre la fila de préstamos
