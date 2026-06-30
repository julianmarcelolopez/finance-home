# 07-03 — API — /api/ingresos

## Estado

- [ ] Pendiente — crear `apps/api/src/routes/ingresos.ts` y registrar en `index.ts`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ingresos` | Lista todos los ingresos (con filtros opcionales) |
| POST | `/api/ingresos` | Crea un nuevo ingreso |
| PATCH | `/api/ingresos/:id` | Actualiza un ingreso existente |
| DELETE | `/api/ingresos/:id` | Elimina un ingreso |

Todos los endpoints están bajo `/api` que ya tiene `authMiddleware`.

## GET /api/ingresos

### Query params opcionales

| Param | Tipo | Descripción |
|-------|------|-------------|
| persona | string | Filtrar por `Julian`, `Patricia` o `Compartido` |
| año | number | Filtrar por año (ej: `2026`) |
| mes | number | Filtrar por mes 1-12 (requiere `año`) |

### Respuesta

```json
[
  {
    "id": "uuid",
    "descripcion": "Sueldo junio",
    "monto": 1200000,
    "moneda": "ARS",
    "persona": "Julian",
    "tipo": "sueldo",
    "fecha": "2026-06-01",
    "created_at": "2026-06-15T10:00:00Z"
  }
]
```

Ordenado por `fecha DESC`.

## POST /api/ingresos

### Body

```json
{
  "descripcion": "Sueldo junio",
  "monto": 1200000,
  "moneda": "ARS",
  "persona": "Julian",
  "tipo": "sueldo",
  "fecha": "2026-06-01"
}
```

### Respuesta: `201` con el ingreso creado.

## PATCH /api/ingresos/:id

### Body: cualquier campo de `IngresoCreate` (parcial).

### Respuesta: `200` con el ingreso actualizado.

## DELETE /api/ingresos/:id

### Respuesta: `204` sin body.

## Implementación

Archivo: `apps/api/src/routes/ingresos.ts`

```typescript
import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'

const router = Router()

router.get('/', async (req, res) => {
  const { persona, año, mes } = req.query
  let query = supabaseAdmin
    .from('ingresos')
    .select('*')
    .order('fecha', { ascending: false })

  if (persona) query = query.eq('persona', persona)
  if (año && mes) {
    const desde = `${año}-${String(mes).padStart(2, '0')}-01`
    const hasta = new Date(Number(año), Number(mes), 0).toISOString().split('T')[0]
    query = query.gte('fecha', desde).lte('fecha', hasta)
  } else if (año) {
    query = query.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`)
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ingresos')
    .insert(req.body)
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ingresos')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('ingresos')
    .delete()
    .eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
```

Registrar en `apps/api/src/index.ts`:
```typescript
import ingresosRouter from './routes/ingresos'
// ...
app.use('/api/ingresos', ingresosRouter)
```

## Criterios de aceptación

- [ ] `GET /api/ingresos` devuelve array vacío si no hay registros
- [ ] `GET /api/ingresos?persona=Julian&año=2026&mes=6` filtra correctamente
- [ ] `POST /api/ingresos` crea y devuelve el registro con id y created_at
- [ ] `PATCH /api/ingresos/:id` actualiza parcialmente
- [ ] `DELETE /api/ingresos/:id` devuelve 204
- [ ] Todos los endpoints requieren JWT válido (authMiddleware)
