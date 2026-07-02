# 07-02 — Shared Types

## Estado

- [x] Completado — 2026-06-30

## Tipos existentes (ya en index.ts)

```typescript
export type TipoIngreso = 'sueldo' | 'freelance' | 'renta' | 'otro'

export interface Ingreso {
  id: string
  descripcion: string
  monto: number
  moneda: Moneda
  persona: Persona
  tipo: TipoIngreso
  fecha: string
  created_at: string
}
```

## Tipo a agregar

```typescript
export interface IngresoCreate {
  descripcion: string
  monto: number
  moneda: Moneda
  persona: Persona
  tipo: TipoIngreso
  fecha: string
}
```

Agregar en `packages/shared/types/index.ts` debajo de la interfaz `Ingreso`.

## Criterios de aceptación

- [ ] `IngresoCreate` exportado desde `@financehome/shared`
- [ ] `Moneda` se restringe a `ARS | USD` en la UI (el tipo acepta `UVA` pero el formulario no lo ofrece)
