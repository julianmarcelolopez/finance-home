# Fase 3 — Frontend

> **Estado:** Implementado

## Estructura de archivos

```
apps/web/src/pages/
├── Gastos.tsx                      ← refactorizado
└── gastos/
    ├── NuevaTarjetaModal.tsx
    ├── TarjetasTab.tsx
    ├── TarjetaResumenes.tsx
    └── TarjetaConsumos.tsx
```

---

## `Gastos.tsx`

Contenedor con 3 tabs. Estado: `tab: 'mercadopago' | 'efectivo' | 'tarjetas'` (default: `'tarjetas'`).

- Mercadopago → `<PlaceholderTab>`
- Efectivo → `<PlaceholderTab>`
- Tarjetas de crédito → `<TarjetasTab>`

---

## `NuevaTarjetaModal.tsx`

Patrón idéntico a `AporteModal` en `Proyectos.tsx`: backdrop `fixed inset-0 bg-black/40`, click fuera cierra.

**Campos:**
- Banco → `<Select>` con BANCOS
- Producto → `<Select>` con MARCAS
- Número de cuenta → `<Input>` solo dígitos, sin límite de longitud
- Titular → `<Select>` con `['Julian', 'Patricia']`

**Lógica clave:**
```typescript
// onChange del input — strip no-numéricos
const handleNroCuenta = (value: string) => {
  setNroCuenta(value.replace(/\D/g, ''))
}

// Habilitación del botón guardar
const puedeGuardar = banco && marca && nroCuenta.length > 0 && titular
```

Muestra error del servidor si el POST devuelve 4xx (ej: tarjeta duplicada).

---

## `TarjetasTab.tsx`

Orquesta la vista completa del tab.

**Estado:** `tarjetas[]`, `seleccionada`, `subtab`, `modalAbierto`, `loading`

**Chip de tarjeta:** color de fondo según marca (azul Visa, rojo MC, verde Amex). Muestra `nro_cuenta.slice(-4)` precedido de `···`.

**Al crear tarjeta nueva:**
```typescript
const handleTarjetaCreada = (nueva: Tarjeta) => {
  setTarjetas(prev => [...prev, nueva])
  setSeleccionada(nueva)
  setModalAbierto(false)
}
```

**Chip "Nueva tarjeta":** borde dashed, icono `<Plus>`.

---

## `TarjetaResumenes.tsx`

Props: `tarjeta: Tarjeta`

Llama `api.resumenes.listar({ tarjeta_id: tarjeta.id })` — filtro exacto por FK.

**Cards de totales (del resumen más reciente):**
- Total ARS + mes/año del cierre
- Total USD
- Vencimiento + "en X días" / "hoy" / "vencido"

**Estado del resumen** — derivado de `vencimiento_actual` vs fecha actual (la tabla no tiene campo de estado):
- `vencimiento < hoy` → "Pagado"
- `vencimiento >= hoy` → "Recibido"

---

## `TarjetaConsumos.tsx`

Props: `tarjeta: Tarjeta`

Llama `api.consumos.listar({ mes, tarjeta_id: tarjeta.id, page })` — el backend filtra por join con `resumenes_tarjeta.tarjeta_id`.

Estado local: `mes` (input month), `page`.

Tabla: Fecha, Comercio, ARS, USD, Adicional. Paginación simple (← / →).
