# 05 — Semáforo del mes

## Descripción

Proyección de cierre del mes comparada contra un presupuesto definido. Muestra si el mes va en verde (dentro del presupuesto), amarillo (en el límite) o rojo (superado).

## Estado

[ ] Pendiente.

## Alcance

**Incluye:**
- Presupuesto mensual configurable por persona o compartido (tabla nueva `presupuestos`)
- Gasto proyectado al cierre: proporcional a los días transcurridos del mes
- Semáforo: verde < 80% del presupuesto, amarillo 80–100%, rojo > 100%
- Porcentaje ejecutado y monto restante
- Proyección al 30 del mes basada en la tasa de gasto diaria promedio

**No incluye:**
- Presupuestos por categoría (se trabaja con presupuesto total del mes)
- Alertas por push notification o email (solo visual en dashboard)
- Historial de presupuestos anteriores

## Modelo de datos

Tabla nueva: `presupuestos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| mes | text | "2026-06" |
| persona | text | "Julian", "Patricia" o "Compartido" |
| monto | numeric | Presupuesto en ARS |
| created_at | timestamptz | Auto |

Migración SQL a agregar en `docs/modelo-de-datos.md`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/presupuestos/:mes` | Presupuesto del mes |
| POST | `/api/presupuestos` | Define o actualiza presupuesto |
| GET | `/api/dashboard/semaforo?mes=2026-06` | Estado del semáforo |

El endpoint de semáforo calcula:
- `gastado`: suma de consumos reales hasta hoy
- `proyectado`: `gastado / dias_transcurridos * dias_del_mes`
- `presupuesto`: valor de la tabla `presupuestos`
- `estado`: "verde" | "amarillo" | "rojo"

## Criterios de aceptación

- [ ] Si no hay presupuesto definido para el mes, el semáforo muestra "Sin presupuesto" y un botón para definir uno
- [ ] El porcentaje ejecutado se actualiza cada vez que se carga el dashboard
- [ ] La proyección al cierre usa los días naturales del mes (28/30/31)
- [ ] El color del semáforo es visualmente claro (no solo texto — usar fondo o indicador de color)

## Dependencias

- Tabla `presupuestos` creada en Supabase
- Tarea 01 de esta feature (datos de gastos del mes)
- Feature 01-gastos: para incluir efectivo y MP en el gasto total cuando estén disponibles
