# 02 — Navegación mes a mes en Dashboard de Gastos

## Descripción

El sub-tab "Mes actual" dentro de Dashboard de Gastos permite navegar hacia atrás y adelante por mes con botones `←` y `→`. Por defecto muestra el mes en curso; la flecha derecha se deshabilita al llegar al mes actual.

## Estado

**Completo — 2026-06-13**

## Comportamiento

- Al entrar a Dashboard → Mes actual, el mes seleccionado es el mes en curso (`mesActual()`).
- `← [Nombre mes] →` — flecha izquierda siempre activa, flecha derecha deshabilitada cuando el mes visible es el actual.
- Cuando se navega a un mes anterior, aparece el link **"Volver al mes actual"** que resetea el estado.
- El nombre del mes se muestra capitalizado en español (`formatMes()`), p.ej. "junio 2026".

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/pages/gastos/GastosDashboard.tsx` | `useState(mesActual())`, helper `agregarMeses()`, barra de navegación |

## Lógica clave

```ts
function agregarMeses(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}
```

El estado `mes` se pasa directamente a `<DetalleMes mes={mes} />`, que ya hacía el fetch al endpoint `/api/gastos-dashboard/mes?mes=YYYY-MM`.
