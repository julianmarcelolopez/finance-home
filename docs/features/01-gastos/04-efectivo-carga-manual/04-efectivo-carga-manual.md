# 04 — Efectivo — carga manual

## Descripción

Pantalla para registrar gastos pagados en efectivo. No hay API externa: el usuario carga cada gasto manualmente con fecha, descripción, monto y categoría.

## Estado

[ ] Pendiente — la tab Efectivo en `Gastos.tsx` muestra un placeholder.

## Alcance

**Incluye:**
- Formulario de carga: fecha, descripción, monto ARS, persona (Julian / Patricia / Compartido), categoría
- Lista de gastos en efectivo del mes seleccionado
- Edición y eliminación de un gasto ya cargado
- Total del mes en ARS al pie de la lista

**No incluye:**
- Gastos en efectivo en USD (se cargan en ARS siempre)
- Importación desde foto o ticket (OCR) — fuera de scope
- Gastos compartidos con split automático (se carga el monto total y se indica "Compartido")

## Modelo de datos

Tabla nueva a crear: `gastos_efectivo`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Auto-generado |
| fecha | date | Fecha del gasto |
| descripcion | text | Texto libre (ej: "Verdulería feria") |
| monto | numeric | Monto en ARS, siempre positivo |
| persona | text | "Julian", "Patricia" o "Compartido" |
| categoria_id | uuid FK → categorias.id | Nullable |
| created_at | timestamptz | Auto |

Migración SQL a agregar en `docs/modelo-de-datos.md`.

## Endpoints nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gastos-efectivo` | Lista (query: `mes`, `persona`, `categoria_id`) |
| POST | `/api/gastos-efectivo` | Crea gasto |
| PATCH | `/api/gastos-efectivo/:id` | Edita gasto |
| DELETE | `/api/gastos-efectivo/:id` | Elimina gasto |

Body POST/PATCH:
```json
{
  "fecha": "2026-06-05",
  "descripcion": "Verdulería feria",
  "monto": 4500,
  "persona": "Julian",
  "categoria_id": "uuid-de-categoria"
}
```

## Criterios de aceptación

- [ ] El formulario valida que fecha, descripción y monto sean obligatorios
- [ ] Los gastos se listan ordenados por fecha descendente
- [ ] El total del mes se recalcula al agregar/editar/eliminar
- [ ] Se puede seleccionar el mes a ver (no solo el mes actual)
- [ ] La categoría es opcional — un gasto sin categoría se puede cargar igual

## Dependencias

- Tabla `gastos_efectivo` creada en Supabase
- Feature 03-etiquetas (tarea 01): tabla `categorias` para el selector de categoría
