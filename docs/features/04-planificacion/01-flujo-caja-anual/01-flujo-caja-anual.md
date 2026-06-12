# 01 — Flujo de caja anual

## Descripción

Vista mes a mes de enero a diciembre con ingresos reales (tabla `ingresos`), gastos fijos activos (tabla `gastos_fijos`) y gastos variables reales (tabla `consumos_tarjeta`). Muestra saldo del mes y saldo acumulado. Los meses futuros sin datos de consumos muestran 0 en variables.

## Estado

Implementado. Ver `apps/api/src/routes/planificacion.ts` y `apps/web/src/pages/Planificacion.tsx`.

## Alcance

**Incluye:**
- 12 filas, una por mes: Ingresos | Gastos Fijos | Gastos Variables | Saldo | Saldo Acumulado
- Gastos fijos: solo los activos cuyo rango `fecha_inicio`–`fecha_fin` incluye el mes
- Conversión ARS/USD al tipo de cambio blue actual (cacheado 5 min)
- Saldo acumulado: suma rodante desde enero
- El año se puede cambiar (query param o selector en la UI)

**No incluye:**
- Proyección de variables en meses futuros basada en historia (eso es tarea 02)
- Ingresos proyectados (solo ingresos ya cargados en la tabla)
- Desglose por persona dentro de la tabla

## Modelo de datos

Respuesta por mes — tipo `FlujoCajaMes` en `packages/shared/types/index.ts`:

```ts
interface FlujoCajaMes {
  mes: string           // "2026-06"
  ingresos: number      // suma de ingresos.monto del mes (ARS)
  gastos_fijos: number  // suma de gastos_fijos activos del mes (ARS)
  gastos_variables: number  // suma de consumos_tarjeta.pesos del mes
  saldo: number         // ingresos - gastos_fijos - gastos_variables
  saldo_acumulado: number  // suma rodante desde mes 1
}
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/planificacion/:año` | Flujo de los 12 meses del año |

Ejemplo: `GET /api/planificacion/2026`

La respuesta es un array de 12 objetos `FlujoCajaMes`.

## Criterios de aceptación

- [x] La tabla muestra los 12 meses del año seleccionado
- [x] Los gastos fijos en USD se convierten al blue actual
- [x] El saldo acumulado de diciembre es la suma de todos los saldos mensuales
- [ ] Los meses con saldo negativo se resaltan en rojo en la UI
- [x] El año se puede cambiar con un selector o campo numérico

## Dependencias

- Tabla `gastos_fijos` creada en Supabase (SQL listo, pendiente de ejecutar)
- Tabla `ingresos` creada en Supabase (SQL listo, pendiente de ejecutar)
- bluelytics.com.ar para conversión USD → ARS
