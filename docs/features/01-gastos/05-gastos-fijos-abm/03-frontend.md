# Frontend — Gastos Fijos

## Estado

[ ] Pendiente.

## Ubicación en la app

Nueva página `GastosFijos.tsx` accesible desde el menú lateral, entre Gastos y Planificación.
Agregar entrada en `Layout.tsx` y ruta en `App.tsx`.

## Componentes a crear

### GastosFijos.tsx (página)

- Tabla de gastos fijos activos ordenados por `dia_del_mes`
- Botón "Agregar gasto fijo" que abre el modal
- Total mensual en ARS al pie (fijos ARS + fijos USD convertidos al blue)
- Filtro por persona (Julian / Patricia / Compartido / Todos)

### GastoFijoRow

Fila de la tabla con:
- Nombre
- Badge de moneda ("ARS" / "USD")
- Monto
- Día del mes (ej: "día 10")
- Persona
- Toggle activo/inactivo (switch o botón)

### GastoFijoModal

Formulario para crear y editar:

| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | text input | Sí |
| monto | number input | Sí |
| moneda | select ARS/USD | Sí |
| persona | select Julian/Patricia/Compartido | Sí |
| dia_del_mes | number input (1-31) | Sí |
| fecha_inicio | date input | Sí |
| fecha_fin | date input | No |
| categoria | text input | No |

## Integración con api.ts

Usar los métodos ya definidos en `apps/web/src/lib/api.ts`:

```ts
api.gastosFijos.listar({ activo: true })
api.gastosFijos.crear(body)
api.gastosFijos.actualizar(id, { activo: false })
api.gastosFijos.actualizar(id, { monto: 95000 })
```

## Criterios de aceptación

- [ ] La tabla carga los fijos activos al entrar a la página
- [ ] Los fijos en USD tienen badge "USD" y monto en dólares
- [ ] El total mensual al pie convierte USD al blue correctamente
- [ ] Crear un fijo nuevo lo agrega a la tabla sin recargar la página
- [ ] El toggle desactiva el fijo y lo saca de la vista (activo=true por defecto)
- [ ] El modal valida campos requeridos antes de hacer POST
- [ ] Si hay fijos en USD y el tipo de cambio no carga, muestra el monto USD sin convertir

## Dependencias

- `api.md`: endpoints verificados y funcionando
- Tipo de cambio: disponible en el contexto de la página (llamada a `GET /api/dashboard/resumen` o endpoint propio)
- shadcn/ui: `Table`, `Badge`, `Input`, `Select`, `Button` — ya instalados
