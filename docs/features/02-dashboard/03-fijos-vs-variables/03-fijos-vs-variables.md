# 03 — Fijos vs Variables

## Descripción

Comparativa visual en el Dashboard que muestra cuánto del gasto del mes es fijo (predecible) versus variable (consumos de tarjeta, efectivo, MP). Ayuda a entender el margen de maniobra financiero.

## Estado

[ ] Pendiente.

## Alcance

**Incluye:**
- Barra de progreso o gráfico de área dividida: proporción fijos/variables sobre el total de gastos del mes
- Montos absolutos: total fijos en ARS, total variables en ARS
- El total de fijos viene de `gastos_fijos_mes_ars` (ya en el response del dashboard)
- El total de variables = consumos tarjeta + efectivo + MP del mes

**No incluye:**
- Separación por persona (Julian vs Patricia)
- Historial de la proporción fijos/variables mes a mes (eso es Planificación)
- Gastos en USD no convertidos a ARS (siempre se normaliza a ARS al blue)

## Modelo de datos

No requiere nuevas tablas. Suma de datos ya disponibles:

- Fijos: `gastos_fijos_mes_ars` del response de dashboard
- Variables: `total_consumos_pesos` + (cuando estén) movimientos MP + gastos efectivo del mes

Se puede calcular en el mismo endpoint de dashboard o en el frontend directamente con los datos disponibles.

## Criterios de aceptación

- [ ] La barra de progreso muestra la proporción fijos/(fijos+variables) en porcentaje
- [ ] Si los fijos superan el 80% del total, la barra muestra un color de alerta (amber)
- [ ] Los montos se muestran en formato `$1.234.567` (ARS)
- [ ] Cuando los gastos variables están en 0 (sin datos de MP ni efectivo), la barra muestra solo fijos con un badge "Parcial"

## Dependencias

- Tarea 01 de esta feature: datos base del dashboard
- Tabla `gastos_fijos` creada en Supabase
- Feature 01-gastos tareas 02, 03 y 04: para incluir variables de MP y efectivo
