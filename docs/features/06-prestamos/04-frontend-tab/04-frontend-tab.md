# 06-04 — Frontend — Tab Préstamos

## Descripción

Nuevo tab "Préstamos" dentro de la página `Gastos`. Permite ver todos los préstamos activos, el detalle de cuotas de cada uno, dar de alta un nuevo préstamo con su cronograma, y marcar cuotas como pagadas.

## Estado

- [ ] Pendiente

## Ubicación

```
apps/web/src/pages/gastos/PrestamosTab.tsx   ← componente principal del tab
apps/web/src/pages/Gastos.tsx                ← agregar tab "Préstamos"
```

## Pantallas

### Vista principal — lista de préstamos activos

```
Préstamos                                        [+ Nuevo préstamo]

  Galicia · Personal                    Julian
  Cuota 3 de 12 · vence 16/06/2026
  Capital adeudado: $5.189.596,81       $710.185,95   [Ver cuotas ▾]

  Santander · Prendario                 Patricia
  Cuota 8 de 36 · vence 20/06/2026
  Capital adeudado: $2.300.000          $98.400,00    [Ver cuotas ▾]
```

Cada fila muestra:
- banco · tipo
- número de cuota actual / total · fecha de vencimiento próxima cuota
- capital adeudado
- monto de la próxima cuota
- botón para expandir el cronograma

### Vista expandida — cronograma de cuotas

Al hacer click en "Ver cuotas" se expande un panel debajo de la fila:

```
  # | Vencimiento  | Monto        | Interés      | Amortiz.     | Estado
  1 | 13/04/2026   | $679.718,14  | $221.917,81  | $406.266,08  | ✓ Pagada
  2 | 13/05/2026   | $714.233,04  | —            | —            | ✓ Pagada
  3 | 16/06/2026   | $710.185,95  | —            | —            | Pendiente  [Marcar pagada]
  4 | 13/07/2026   | $705.607,85  | —            | —            | —
  ...
```

### Modal — Nuevo préstamo

Formulario en dos secciones:

**Datos del préstamo:**
- Banco (text input)
- Número (text input)
- Tipo (select con opciones comunes + texto libre: Personal / Prendario / Hipotecario / Otro)
- Tasa (number, opcional)
- Sistema amortización (select: Francés / Alemán / UVA / Otro, opcional)
- Monto solicitado
- Capital adeudado (opcional)
- Moneda (ARS / USD / UVA)
- Persona (Julian / Patricia / Compartido)
- Cuenta débito (text, opcional)

**Cronograma de cuotas:**
- Tabla editable donde se ingresan las cuotas: número, fecha vencimiento, monto total
- Campos de desglose (interés, sellos, IVA, amortización) opcionales y colapsables
- Botón "Agregar fila" para cada cuota
- Opción de marcar cuotas ya pagadas al momento del alta

## Cambios en Gastos.tsx

```typescript
// Agregar tab
const TABS = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'mercadopago', label: 'Mercadopago' },
  { id: 'efectivo',    label: 'Efectivo' },
  { id: 'tarjetas',    label: 'Tarjetas de crédito' },
  { id: 'prestamos',   label: 'Préstamos' },   // ← nuevo
]

// Agregar render
{tab === 'prestamos' && <PrestamosTab />}
```

## Criterios de aceptación

- [ ] La lista muestra todos los préstamos activos con la próxima cuota pendiente destacada
- [ ] El cronograma expandido muestra todas las cuotas con su estado
- [ ] Las cuotas pagadas se distinguen visualmente (verde / tachado)
- [ ] El modal de alta valida que haya al menos 1 cuota antes de guardar
- [ ] "Marcar pagada" actualiza el estado sin recargar la página completa
- [ ] Si un préstamo no tiene desglose (solo monto_total), las columnas de desglose se ocultan
- [ ] Préstamos UVA muestran badge "UVA" y permiten editar el monto de la próxima cuota
