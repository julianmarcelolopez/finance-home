# API — Gastos Fijos

## Estado

Implementada. Archivo: `apps/api/src/routes/gastos-fijos.ts`

## Endpoints

### GET /api/gastos-fijos

Lista gastos fijos. Soporta filtros por query params.

| Query param | Tipo | Descripción |
|-------------|------|-------------|
| activo | boolean | `true` = solo activos, `false` = solo inactivos |
| persona | string | "Julian", "Patricia" o "Compartido" |
| moneda | string | "ARS" o "USD" |

Respuesta: `GastoFijo[]` ordenado por `dia_del_mes` ASC.

### POST /api/gastos-fijos

Crea un gasto fijo nuevo. Campos requeridos: `nombre`, `monto`, `moneda`, `persona`, `dia_del_mes`, `fecha_inicio`.

```json
{
  "nombre": "Expensas",
  "monto": 85000,
  "moneda": "ARS",
  "persona": "Compartido",
  "dia_del_mes": 10,
  "fecha_inicio": "2026-01-01"
}
```

Respuesta: `GastoFijo` creado (201).

### PATCH /api/gastos-fijos/:id

Actualiza cualquier campo. Usado para:
- Desactivar: `{ "activo": false }`
- Cambiar monto: `{ "monto": 95000 }`
- Cerrar vigencia: `{ "fecha_fin": "2026-12-31" }`

No hay DELETE — el soft delete es `activo: false`.

## Tipo compartido

Definido en `packages/shared/types/index.ts`:

```ts
interface GastoFijo {
  id: string
  nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  categoria: string | null
  dia_del_mes: number
  fecha_inicio: string
  fecha_fin: string | null
  persona: 'Julian' | 'Patricia' | 'Compartido'
  activo: boolean
  created_at: string
}
```

## Verificación

Con la tabla ya creada en Supabase, probar los tres endpoints antes de arrancar el frontend:

- [ ] `GET /api/gastos-fijos` retorna `[]` (tabla vacía, sin error 500)
- [ ] `POST /api/gastos-fijos` crea un registro correctamente
- [ ] `PATCH /api/gastos-fijos/:id` con `{ activo: false }` desactiva el registro
- [ ] `GET /api/gastos-fijos?activo=true` filtra correctamente
