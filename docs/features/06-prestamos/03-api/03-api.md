# 06-03 — API — Endpoints préstamos

## Descripción

Endpoints Express para CRUD de préstamos y cuotas. Nuevo archivo `apps/api/src/routes/prestamos.ts` montado en `/api/prestamos`.

## Estado

- [ ] Pendiente

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/prestamos` | Lista préstamos activos (query: `persona`, `activo`) |
| POST | `/api/prestamos` | Da de alta un préstamo + cronograma completo de cuotas en una sola operación |
| GET | `/api/prestamos/:id` | Detalle del préstamo con sus cuotas ordenadas por número |
| PATCH | `/api/prestamos/:id` | Actualiza campos del préstamo (capital_adeudado, activo, etc.) |
| PATCH | `/api/prestamos/:id/cuotas/:cuotaId` | Marca una cuota como pagada o actualiza su monto (para cuotas UVA) |
| GET | `/api/prestamos/cuotas-mes` | Cuotas que vencen en un mes dado (query: `mes=YYYY-MM`) — usado por el Dashboard |

## Detalle por endpoint

### POST /api/prestamos

Recibe `PrestamoConCuotasCreate`. Inserta el préstamo y todas las cuotas en una transacción.

Body:
```json
{
  "prestamo": {
    "numero": "808128032344",
    "banco": "Galicia",
    "tipo": "Personal",
    "tasa": 54,
    "sistema_amortizacion": "Francés",
    "monto_solicitado": 6000000,
    "capital_adeudado": 5189596.81,
    "moneda": "ARS",
    "persona": "Julian",
    "cuenta_debito": "CA $ N° 4041144-2 236-1"
  },
  "cuotas": [
    { "numero_cuota": 1, "fecha_vencimiento": "2026-04-13", "monto_total": 679718.14, "interes_nominal": 221917.81, "sellos": 4931.51, "iva_interes": 46602.74, "amortizacion": 406266.08, "pagada": true },
    { "numero_cuota": 2, "fecha_vencimiento": "2026-05-13", "monto_total": 714233.04, "pagada": true },
    { "numero_cuota": 3, "fecha_vencimiento": "2026-06-16", "monto_total": 710185.95 }
    // ...resto de cuotas
  ]
}
```

Respuesta 201: `{ prestamo: Prestamo, cuotas: CuotaPrestamo[] }`

### GET /api/prestamos/cuotas-mes?mes=2026-06

Devuelve las cuotas con vencimiento en el mes indicado, con datos del préstamo joinados.
Respuesta: `CuotaMesResumen[]`

Usado por `GET /api/gastos/resumen-mes` y `GET /api/dashboard/resumen`.

### PATCH /api/prestamos/:id/cuotas/:cuotaId

Permite:
- Marcar como pagada: `{ "pagada": true }`
- Actualizar monto (préstamos UVA): `{ "monto_total": 725000 }`

## Archivo a crear

`apps/api/src/routes/prestamos.ts` — registrar en `apps/api/src/index.ts` como:

```typescript
import prestamosRouter from './routes/prestamos'
app.use('/api/prestamos', authMiddleware, prestamosRouter)
```

## Criterios de aceptación

- [ ] POST crea préstamo + cuotas en una sola llamada (transacción atómica)
- [ ] GET lista solo préstamos activos por defecto
- [ ] GET /:id devuelve el préstamo con `cuotas` ordenadas por `numero_cuota` ASC
- [ ] GET /cuotas-mes?mes=2026-06 devuelve solo las cuotas del mes solicitado
- [ ] PATCH /:id/cuotas/:cuotaId permite actualizar `pagada` y `monto_total`
- [ ] Todos los endpoints requieren auth (middleware existente)
