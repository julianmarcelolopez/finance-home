# 03 — Simulador What-If

## Descripción

Simulador interactivo en la página de Planificación: el usuario ingresa un gasto hipotético (monto, moneda, tipo fijo/variable) y la tabla del flujo anual se recalcula al instante mostrando el impacto en el saldo de cada mes.

## Estado

[ ] Pendiente.

## Alcance

**Incluye:**
- Panel colapsable o sidebar en Planificación con un formulario de simulación
- Campos: nombre del gasto, monto, moneda (ARS/USD), tipo (fijo recurrente desde N mes / único en mes M)
- Recálculo en el frontend sin llamada al backend: el gasto hipotético se suma al flujo ya cargado
- Resaltado visual de las filas del mes afectado (o todos los meses si es fijo)
- Badge "Simulado" en la tabla mientras la simulación está activa
- Botón para limpiar la simulación y volver a los datos reales

**No incluye:**
- Guardar la simulación como gasto real (el usuario tiene que hacer eso manualmente en gastos-fijos o efectivo)
- Múltiples gastos hipotéticos simultáneos (un solo gasto a la vez)
- Comparativa lado a lado del flujo real vs simulado

## Implementación

Todo en el frontend (`Planificacion.tsx`). No requiere endpoint nuevo.

```ts
// Estado local del simulador
const [simulacion, setSimulacion] = useState<{
  monto: number
  moneda: 'ARS' | 'USD'
  esFijo: boolean
  mesDesde: string  // "2026-06"
} | null>(null)

// El flujo simulado se calcula derivado de los datos reales
const flujoSimulado = useMemo(() => {
  if (!simulacion) return flujoReal
  return flujoReal.map(mes => {
    if (!aplica(mes, simulacion)) return mes
    const impactoARS = simulacion.moneda === 'ARS'
      ? simulacion.monto
      : simulacion.monto * tipoCambio.blue.venta
    return {
      ...mes,
      gastos_fijos: simulacion.esFijo ? mes.gastos_fijos + impactoARS : mes.gastos_fijos,
      gastos_variables: !simulacion.esFijo ? mes.gastos_variables + impactoARS : mes.gastos_variables,
      saldo: mes.saldo - impactoARS,
      simulado: true
    }
  })
}, [flujoReal, simulacion, tipoCambio])
```

El saldo acumulado se recalcula aplicando la suma rodante sobre `flujoSimulado`.

## Criterios de aceptación

- [ ] Al ingresar un gasto fijo de $50.000 ARS desde junio, todos los meses de junio a diciembre muestran el saldo reducido
- [ ] Un gasto único en agosto solo afecta la fila de agosto y el saldo acumulado de agosto en adelante
- [ ] Los gastos en USD se convierten al blue (ya disponible en el contexto del componente)
- [ ] Limpiar la simulación restaura todos los valores originales sin recargar datos del servidor
- [ ] El formulario de simulación tiene validación: monto > 0, mes válido

## Dependencias

- Tarea 01 de esta feature (datos del flujo cargados)
- Tipo de cambio disponible en el componente (viene del `GET /api/dashboard/resumen` o de un store)
