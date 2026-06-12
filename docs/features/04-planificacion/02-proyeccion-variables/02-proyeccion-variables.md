# 02 — Proyección de gastos variables

## Descripción

Para los meses futuros del año, proyectar cuánto se va a gastar en variables basándose en el promedio histórico de los últimos N meses, opcionalmente desglosado por etiqueta de categoría.

## Estado

[ ] Pendiente — actualmente los meses futuros muestran `gastos_variables: 0`.

## Alcance

**Incluye:**
- Cálculo del promedio de `consumos_tarjeta.pesos` por mes de los últimos 3 meses con datos
- Para meses futuros: reemplazar el 0 con el promedio calculado, marcado como "proyectado"
- Campo adicional en `FlujoCajaMes`: `variables_proyectadas: boolean` para distinguir proyección de dato real
- Proyección opcionalmente por categoría: si los consumos están etiquetados, se puede proyectar Supermercado, Restaurantes, etc. por separado

**No incluye:**
- Modelos de regresión o estacionalidad (promedio simple de los últimos 3 meses)
- Proyección de ingresos futuros (el usuario los carga manualmente)
- Proyección de gastos fijos (esos ya son determinísticos)

## Modelo de datos

Extensión de `FlujoCajaMes`:

```ts
interface FlujoCajaMes {
  // campos existentes...
  variables_proyectadas?: boolean  // true si gastos_variables es proyectado, no real
}
```

No requiere tabla nueva. La proyección se calcula en el endpoint de planificación en memoria.

## Endpoints

Se extiende `GET /api/planificacion/:año`. Lógica interna:

1. Calcular promedio de `consumos_tarjeta.pesos` de los últimos 3 meses con registros
2. Para cada mes futuro donde `gastos_variables === 0` y no hay consumos reales, usar el promedio
3. Marcar el mes con `variables_proyectadas: true`

Query para el promedio:
```sql
SELECT AVG(total_mes) as promedio
FROM (
  SELECT DATE_TRUNC('month', fecha) as mes, SUM(pesos) as total_mes
  FROM consumos_tarjeta
  WHERE fecha >= NOW() - INTERVAL '3 months'
  GROUP BY 1
) t
```

## Criterios de aceptación

- [ ] Los meses futuros muestran el promedio en lugar de 0
- [ ] El promedio se calcula sobre los últimos 3 meses con datos (si hay menos, usa los disponibles)
- [ ] Los meses proyectados tienen una indicación visual diferente (ej: valor en gris con sufijo "~")
- [ ] El mes actual (con datos parciales) NO se proyecta — se muestra el real hasta hoy

## Dependencias

- Tarea 01 de esta feature (flujo base implementado)
- Datos de `consumos_tarjeta` de al menos 1 mes anterior cargados por n8n
- Feature 03-etiquetas (opcional): para proyección por categoría
