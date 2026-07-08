# 01 — Resumen real vs. estimado

## Estado

**Implementado — 2026-07-06.** Migración ejecutada y verificada en Supabase. Con datos reales se detectaron y corrigieron dos gaps: faltaban las cuotas de préstamos, y una tarjeta con ciclo cerrado en $0 (sin resumen del banco) se clasificaba mal como "estimado" — ver sección siguiente.

## Descripción

Vista nueva que, para un mes dado, separa el gasto proyectado en **real** (ya cargado: gastos fijos, Mercadopago, tarjetas con resumen cerrado) y **estimado** (tarjetas con ciclo todavía abierto, proyectadas por promedio histórico), y calcula el saldo proyectado contra los ingresos del mes.

## Decisiones aplicadas

- **Efectivo fuera de la v1.** No hay fila de "Efectivo" — la tab sigue siendo un placeholder (`04-efectivo-carga-manual`, pendiente). Solo se muestra "Mercadopago".
- **`dia_cierre` no reemplaza al resumen como fuente de verdad primaria**, pero sí se usa como señal secundaria: la clasificación real/estimado depende primero de si existe un `resumen_tarjeta` con `vencimiento_actual` dentro del mes consultado. Si no existe, `dia_cierre` se usa para dos cosas: armar el texto "cierra el DD/MM" (ciclo todavía abierto) y, si ya pasó de sobra la fecha esperada de cierre, para detectar "cerró sin consumos" — ver [nota sobre Galicia](#nota--ciclo-cerrado-en-0-sin-resumen-del-banco).
- **Conversión USD → ARS al blue**, igual que `gastos-dashboard.ts` (`/semestre`) y `planificacion.ts`, aplicada a ingresos, fijos, Mercadopago y tarjetas.
- **Montos estimados marcados en la UI** con badge "Estimado" + tooltip aclarando que es una proyección simple basada en el promedio histórico (no un cálculo de intereses ni prorrateo por día del ciclo).

## Cambios

### Schema

`supabase/migrations/20260706100000_tarjetas_dia_cierre.sql` — agrega `tarjetas.dia_cierre SMALLINT CHECK (dia_cierre BETWEEN 1 AND 31)`, nullable.

### Tipos compartidos (`packages/shared/types/index.ts`)

```ts
export interface Tarjeta {
  // ...
  dia_cierre: number | null
}

export interface TarjetaCreate {
  // ...
  dia_cierre?: number
}

export interface ComponenteResumenMensual {
  nombre: string
  tipo: 'real' | 'estimado'
  monto_ars: number
  detalle: string | null
  alerta_desvio: boolean
  porcentaje_desvio: number | null
}

export interface ResumenMensualProyectado {
  mes: string
  ingresos_ars: number
  ingresos_cantidad: number
  gastos_reales_ars: number
  gastos_estimados_ars: number
  gastos_totales_ars: number
  saldo_proyectado_ars: number
  porcentaje_comprometido: number
  componentes: ComponenteResumenMensual[]
}
```

`alerta_desvio` y `porcentaje_desvio` ya están en el tipo pero siempre viajan en `false`/`null` en esta fase — los llena la fase 02.

### API

Nuevo router `apps/api/src/routes/gastos-resumen-mensual.ts`, registrado en `apps/api/src/index.ts` como `/api/gastos-resumen-mensual`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gastos-resumen-mensual?mes=YYYY-MM` | Resumen proyectado del mes: ingresos, gastos reales/estimados, saldo, desglose por componente |

Lógica del endpoint:
1. Ingresos del mes (`ingresos`), convertidos ARS.
2. Gastos fijos activos vigentes ese mes (mismo filtro de `fecha_inicio`/`fecha_fin` que `planificacion.ts`), convertidos ARS — siempre real.
3. Gastos Mercadopago del mes, convertidos ARS — siempre real.
4. **Cuotas de préstamos activos con vencimiento en el mes** (`cuotas_prestamo` + `prestamos!inner`, mismo criterio que `gastos-dashboard.ts`), una fila por cuota — siempre real (monto pactado de antemano). *Corregido el 2026-07-06: esta fase se había implementado sin incluir préstamos; el usuario lo detectó al usar la vista.*
5. Por cada tarjeta activa: si existe un `resumen_tarjeta` con `vencimiento_actual` en el mes → real, monto = `total_pagar_pesos + total_pagar_dolares * blue`. Si no existe → se chequea si el ciclo ya debería haber cerrado (ver nota siguiente); si no → estimado, monto = promedio de hasta 6 resúmenes anteriores de esa tarjeta (0 si no hay histórico, con detalle "Sin histórico suficiente para estimar").
6. Totales y saldo proyectado = ingresos − (reales + estimados).

### Nota — tabla `gastos_fijos` vacía

Al validar contra los datos reales (2026-07-06) se confirmó que la tabla `gastos_fijos` no tiene ninguna fila cargada (0 registros, no es un problema de filtro). Es consistente con el estado del feature `01-gastos/05-gastos-fijos-abm`: **"API lista, UI faltante"** — no hay ninguna pantalla todavía para cargar un gasto fijo, así que nadie insertó datos ahí. El componente "Gastos fijos" del resumen mensual va a mostrar $0 hasta que esa ABM tenga UI y se carguen los gastos (alquiler, seguros, etc.). No es un bug de este endpoint — la consulta y el filtro son correctos y coinciden con `planificacion.ts`.

### Nota — ciclo cerrado en $0 sin resumen del banco

**Corregido el 2026-07-06**, reportado por el usuario en Mastercard Galicia — Patricia (sin consumos en julio). Causa raíz: Galicia (y potencialmente otros bancos) no envía el mail "Resumen de Tarjeta" cuando el ciclo cierra en $0 — confirmado contra Gmail/n8n (`n8n/JULIAN - Mastercard Galicia.json`, workflow busca `subject:"Resumen de Tarjeta MasterCard" has:attachment`, que no matchea nada si el banco no manda el mail). Como consecuencia, `resumenes_tarjeta` nunca recibe una fila para ese ciclo — no es un bug de n8n, no hay nada que parsear.

Sin este fix, la ausencia de resumen se interpretaba siempre como "ciclo abierto" y el mes se proyectaba con el promedio histórico, mostrando un monto estimado en vez de $0 real.

Fix aplicado en `gastos-resumen-mensual.ts`: si no hay resumen para el mes, se calcula la fecha de cierre esperada a partir de `dia_cierre` (el cierre de un ciclo cuyo vencimiento cae en `mes` ocurre típicamente el mes anterior) y se le suma un margen de gracia (`DIAS_GRACIA_SIN_RESUMEN = 10` días) para dar tiempo a que el banco procese y envíe el resumen. Si ya pasó ese margen y sigue sin haber resumen, se clasifica como `real`, `monto_ars: 0`, con `detalle: "cerró sin consumos (el banco no envía resumen si el total es $0)"`. Si `dia_cierre` no está seteado, se mantiene el comportamiento anterior (estimado por promedio).

Se cargó `dia_cierre` para las 9 tarjetas activas, inferido de la mediana de los últimos ~6 cierres de cada una (para no dejarse llevar por un dato suelto — ej. ICBC Julian tenía un "2" aislado entre valores 26-30, se descartó como outlier):

| Tarjeta | `dia_cierre` |
|---|---|
| Mastercard Galicia — Patricia | 21 |
| Mastercard Galicia — Julian | 7 |
| Visa Galicia — Patricia | 22 |
| Visa Galicia — Julian | 28 |
| Mastercard ICBC — Julian | 26 |
| Visa Macro — Julian | 28 |
| Visa MercadoPago — Julian | 5 |
| Visa MercadoPago — Patricia | 5 |
| Visa Santander — Julian | 28 |

Son una aproximación (el cierre real varía ±2-3 días por fin de semana/feriado, y en tarjetas con cierre cerca de fin de mes puede correrse según la duración del mes) — el usuario puede corregirlos vía `PATCH /api/tarjetas/:id` si alguno no coincide con la fecha real que figura en el resumen del banco.

**Limitación conocida:** este fix resuelve la clasificación al vuelo, pero no crea la fila faltante en `resumenes_tarjeta`. El promedio histórico de esa tarjeta para meses futuros seguirá calculándose solo sobre los resúmenes que sí existen (el mes en $0 no participa ni resta del promedio). Una solución más completa a nivel de ingesta (insertar un resumen sintético en $0 desde n8n cuando se detecta que un ciclo cerró sin mail) quedaría como mejora futura, fuera del alcance de este fix.

Cambios adicionales:
- `apps/api/src/routes/tarjetas.ts`: POST y PATCH aceptan `dia_cierre` (valida rango 1-31).
- `apps/api/src/swagger.ts`: schemas `Tarjeta`/`TarjetaCreate` actualizados, `ComponenteResumenMensual` y `ResumenMensualProyectado` agregados.
- `apps/web/src/lib/api.ts`: cliente `api.gastosResumenMensual.mes(mes)`.

### Frontend

Nuevo componente `apps/web/src/pages/gastos/ResumenMensualTab.tsx`:
- Navegación de mes (mismo patrón que `GastosDashboard.tsx`)
- 3 tarjetas: Ingresos del mes, Gastos proyectados (reales + estimados), Saldo proyectado (verde/rojo según signo)
- Barra real vs. estimado con % de ingresos comprometido
- Tabla de desglose por componente con badge Real/Estimado y detalle ("cerró el DD/MM" / "cierra el DD/MM (estimado)")
- Texto aclaratorio fijo sobre qué significa "Estimado"

Registrado en `apps/web/src/pages/Gastos.tsx` como primer tab, `"Resumen mensual"`. El tab por defecto seleccionado sigue siendo `"Dashboard"` — no cambia el comportamiento existente.

## Tareas

- [x] Migración `tarjetas.dia_cierre` — **ejecutada en Supabase y confirmada** (columna `dia_cierre` legible)
- [x] Tipos compartidos
- [x] Endpoint `GET /api/gastos-resumen-mensual`
- [x] Cuotas de préstamos activos incluidas como componente real (fix del 2026-07-06)
- [x] Detección de "cerró sin consumos" cuando el banco no envía resumen en ciclos de $0 (fix del 2026-07-06)
- [x] `tarjetas.ts`: soporte `dia_cierre` en POST/PATCH
- [x] Swagger: schemas nuevos/actualizados
- [x] Cliente `api.gastosResumenMensual.mes()`
- [x] `ResumenMensualTab.tsx` + registro en `Gastos.tsx`
- [x] `npm run typecheck` de `api` y `web` sin errores (corrido en Docker)
- [x] `dia_cierre` cargado para las 9 tarjetas activas, inferido del historial (ver tabla arriba)
- [ ] Verificación manual en vivo: confirmar en el navegador que Mastercard Galicia — Patricia aparece como "Real — $0 — cerró sin consumos" en julio 2026, y que el resto de las tarjetas siguen clasificando bien con su nuevo `dia_cierre`

## Criterios de aceptación

- [ ] La vista muestra ingresos, gastos reales+estimados y saldo proyectado del mes actual
- [ ] Cada tarjeta activa aparece clasificada como real o estimado según si tiene resumen cargado ese mes
- [ ] Los montos estimados están claramente marcados como proyección simple
- [ ] La fila "Efectivo" no aparece mezclada con Mercadopago
- [ ] No se rompe ninguna vista existente (Dashboard, Tarjetas, Mercadopago, Préstamos)
