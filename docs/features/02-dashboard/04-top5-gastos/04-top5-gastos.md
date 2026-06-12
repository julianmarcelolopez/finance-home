# 04 — Top 5 gastos del mes

## Descripción

Lista de los 5 consumos individuales más altos del mes en curso. Sirve para identificar rápidamente los gastos que más impactan en el total.

## Estado

[ ] Pendiente.

## Alcance

**Incluye:**
- Los 5 consumos de `consumos_tarjeta` con mayor monto `pesos` en el mes en curso
- Para cada consumo: fecha, referencia (nombre del comercio), banco/tarjeta, monto ARS
- Si alguno tiene monto en USD, se muestra el USD debajo del ARS
- Consumos de adicionales (Patricia) se identifican con un badge

**No incluye:**
- Gastos de efectivo ni MP en el ranking (hasta que estén implementados)
- Consumos en cuotas: se contabiliza solo la cuota del mes (no el total de la compra)
- Navegación al resumen de tarjeta desde el item (puede ser futuro)

## Modelo de datos

No requiere tabla nueva. Query sobre `consumos_tarjeta`:

```sql
SELECT c.*, r.banco, r.marca_tarjeta
FROM consumos_tarjeta c
JOIN resumenes_tarjeta r ON c.resumen_id = r.id
WHERE c.fecha >= '2026-06-01' AND c.fecha <= '2026-06-30'
ORDER BY c.pesos DESC
LIMIT 5
```

## Endpoints

Se agrega como campo `top5_consumos` en `GET /api/dashboard/resumen`, o como endpoint separado `GET /api/dashboard/top5?mes=2026-06`.

## Criterios de aceptación

- [ ] Se muestran exactamente 5 items (o menos si hay menos consumos en el mes)
- [ ] El ranking es correcto: el de mayor monto aparece primero
- [ ] Los consumos de Patricia muestran badge "Patricia"
- [ ] La fecha se muestra como "dd/MM" (ej: "05/06")
- [ ] Si no hay consumos en el mes, el card muestra estado vacío

## Dependencias

- Tarea 01 de esta feature (base del dashboard)
- Datos de `consumos_tarjeta` del mes actual cargados por n8n
