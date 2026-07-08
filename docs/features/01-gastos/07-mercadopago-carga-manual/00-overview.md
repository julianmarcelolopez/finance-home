# 07 — Mercadopago — carga manual

## Descripción

Registro manual de los gastos pagados con la tarjeta de débito de Mercado Pago / Mercado Libre. No hay sync con ninguna API: el usuario carga cada gasto a mano con fecha, descripción, monto y categoría — mismo enfoque que la tarea 04 (efectivo), pero para la tab Mercadopago.

Este es el camino real para registrar estos gastos, no un parche temporal. Las tareas 02 y 03 (sync automático vía API de Mercado Pago) quedan **bloqueadas** — ver "Relación con otras tareas".

## Estado

**Implementado — 2026-07-06.** Las 4 fases (modelo de datos, API, frontend, integración al dashboard) están completas. Falta la verificación manual en vivo (levantar `apps/api` y `apps/web` y probar el flujo end-to-end) — ver checklist en cada fase.

## Alcance

**Incluye:**
- Formulario de carga: fecha, descripción, monto, moneda (ARS/USD), persona (Julian / Patricia / Compartido), categoría opcional
- Lista de gastos Mercadopago del mes seleccionado
- Edición y eliminación de un gasto ya cargado
- Total del mes al pie de la lista
- Integración con el dashboard de gastos (total del mes, desglose por categoría, vista semestral)

**No incluye:**
- Sync automático con la API de Mercado Pago (eso cubrían las tareas 02 y 03, ahora bloqueadas)
- Gastos en efectivo (eso lo cubre la tarea 04, sin cambios)
- Importación desde el resumen de movimientos exportado por Mercado Pago (CSV/Excel) — posible mejora futura, no en esta tarea
- Split automático de gastos compartidos (se carga el monto total y se indica "Compartido")

## Relación con otras tareas

- **02-mp-api-julian** y **03-mp-api-patricia**: pasan a estado **Bloqueada**. Se decidió no avanzar contra la API de Mercado Pago por ahora — la carga manual (esta tarea) es la solución definitiva en el corto/mediano plazo, no un stopgap. El diseño de la tabla `movimientos_mp` en esos docs queda como referencia si se retoma en el futuro.
- **04-efectivo-carga-manual**: no se toca. Sigue su propio camino, con su propia tabla (`gastos_efectivo`) y su propia tab. La tab "Efectivo" en el dashboard se mantiene como "próximamente" hasta que esa tarea se implemente.
- **03-etiquetas** (feature aparte): la tabla `categorias` ya existe y se reutiliza para categorizar estos gastos.

## Dependencias

- Tabla `categorias` ya creada en Supabase (feature 03-etiquetas)
- Tipo de cambio (`getTipoCambio`) ya disponible en `apps/api/src/services/tipo-cambio.ts` para convertir montos en USD

---

## Plan de implementación (fase a fase)

### Fase 1 — Modelo de datos

**Estado: [x] Completo — tabla creada en Supabase**

Detalle completo en [01-modelo-de-datos.md](./01-modelo-de-datos.md). Resumen: tabla `gastos_mercadopago` (fecha, descripción, monto, moneda, persona, categoria_id opcional, created_at), sin soft-delete — los gastos puntuales se eliminan directo en vez de desactivarse.

Tareas:
- [x] Crear el archivo de migración `supabase/migrations/20260630100000_gastos_mercadopago.sql`
- [x] Correr el `CREATE TABLE gastos_mercadopago` + RLS en el SQL Editor de Supabase
- [x] Confirmar que la tabla aparece en el listado de tablas y que la policy `auth_all` quedó activa

### Fase 2 — API

**Estado: [x] Implementado — pendiente de verificación en vivo**

Nuevo router `apps/api/src/routes/gastos-mercadopago.ts`, registrado en `apps/api/src/index.ts` como `/api/gastos-mercadopago`. Sigue el mismo patrón que `apps/api/src/routes/consumos.ts` (paginación) y `apps/api/src/routes/gastos-fijos.ts` (forma de los handlers).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gastos-mercadopago` | Lista paginada. Filtros: `mes` (YYYY-MM), `persona`, `categoria_id`, `page`, `limit` |
| POST | `/api/gastos-mercadopago` | Crea un gasto. Requeridos: `fecha`, `descripcion`, `monto`, `moneda`, `persona` |
| PATCH | `/api/gastos-mercadopago/:id` | Actualiza cualquier campo (incluido `categoria_id`) |
| DELETE | `/api/gastos-mercadopago/:id` | Elimina el registro (no hay soft-delete) |

Tipos compartidos a agregar en `packages/shared/types/index.ts`:

```ts
export interface GastoMercadopago {
  id: string
  fecha: string
  descripcion: string
  monto: number
  moneda: Moneda
  persona: Persona
  categoria_id: string | null
  created_at: string
  categorias?: Pick<Categoria, 'nombre' | 'color' | 'icono'>
}

export interface GastoMercadopagoCreate {
  fecha: string
  descripcion: string
  monto: number
  moneda: Moneda
  persona: Persona
  categoria_id?: string
}
```

Tareas:
- [x] Crear `gastos-mercadopago.ts` con GET/POST/PATCH/DELETE
- [x] Registrar el router en `index.ts`
- [x] Agregar `GastoMercadopago` / `GastoMercadopagoCreate` a `packages/shared/types/index.ts`
- [x] Agregar el cliente `api.gastosMercadopago.*` en `apps/web/src/lib/api.ts`
- [x] Agregar los schemas `GastoMercadopago` / `GastoMercadopagoCreate` a `apps/api/src/swagger.ts`
- [ ] Verificar manualmente: GET vacío sin error 500, POST crea, PATCH edita, DELETE elimina, filtro `mes` funciona

### Fase 3 — Frontend

**Estado: [x] Implementado — pendiente de verificación en vivo**

Nuevo componente `apps/web/src/pages/gastos/MercadopagoTab.tsx`, reemplazando el `PlaceholderTab` actual en `apps/web/src/pages/Gastos.tsx` (línea `{tab === 'mercadopago' && <PlaceholderTab nombre="Mercadopago" />}`). Mismo patrón visual que `GastosFijos.tsx`: tabla + modal de alta + filtro por persona + selector de mes + total al pie.

Componentes:
- **MercadopagoTab** (página/tab): selector de mes (default mes actual), filtro por persona, tabla de gastos ordenados por fecha descendente, botón "Agregar", total del mes en ARS (USD convertido al blue)
- **GastoMercadopagoModal**: formulario de alta/edición — fecha, descripción, monto, moneda, persona, categoría (select poblado con `api.etiquetas.listar()`)
- Botón de eliminar por fila (con confirmación simple)

Tareas:
- [x] Crear `MercadopagoTab.tsx` con tabla + total
- [x] Crear el modal de alta/edición
- [x] Reemplazar el placeholder en `Gastos.tsx`
- [ ] Verificar: cargar un gasto nuevo lo agrega sin recargar, editar y eliminar funcionan, el total se recalcula, el selector de categoría usa las categorías existentes

### Fase 4 — Integración al dashboard

**Estado: [x] Implementado — pendiente de verificación en vivo**

`apps/web/src/pages/gastos/DetalleMes.tsx` y `apps/api/src/routes/gastos-dashboard.ts` mostraban 3 filas placeholder con "próximamente": "Mercadopago Julian", "Mercadopago Patricia", "Efectivo". Esta fase reemplaza las **filas de Mercadopago** por datos reales (la fila "Efectivo" se mantiene como placeholder hasta la tarea 04). Si hay gastos cargados como "Compartido", se agrega dinámicamente una fila extra "Mercadopago Compartido" (no había un tercer nombre hardcodeado para ese caso).

Cambios en `gastos-dashboard.ts`:
- `GET /mes`: los gastos Mercadopago se normalizan al mismo shape que un consumo de tarjeta (pesos/dolares por moneda, sin conversión — igual que las tarjetas, el monto en USD queda en `dolares` sin convertir) y se mezclan en `total_pesos`, `variables_pesos`, `por_categoria`, `top5` y la tabla `consumos` completa. Las filas "Mercadopago Julian" / "Mercadopago Patricia" (y "Compartido" si aplica) en `por_origen` quedan con `disponible: true` y el monto real.
- `GET /semestral`: suma el monto mensual de `gastos_mercadopago` al total de cada mes del gráfico de 6 meses (USD sumado a `total_dolares`, sin convertir).
- `GET /semestre`: agrega filas nuevas a la matriz pivot agrupadas por persona × mes, con `tipo: 'mercadopago'` — acá sí se convierte USD a ARS al blue, igual que hace la fila de "Gastos fijos", porque este pivot es ARS-only (no tiene columna de dólares separada).

Cambios en frontend:
- `DetalleMes.tsx`: las filas de Mercadopago dejan de mostrar "próximamente" y muestran el monto real; `totalConsolidado` ahora suma también los orígenes con `disponible: true`.
- `packages/shared/types/index.ts`: `FilaSemestre['tipo']` ahora incluye `'mercadopago'`.
- `TablaSemestre.tsx`: nuevo grupo "Mercadopago" (color `text-emerald-400`) además de Tarjetas/Préstamos/Gastos fijos.

Tareas:
- [x] Sumar `gastos_mercadopago` en `/mes` (total, variables, por categoría, top5, tabla completa, por origen)
- [x] Sumar `gastos_mercadopago` en `/semestral`
- [x] Agregar filas de Mercadopago a la matriz pivot en `/semestre` + soporte en `TablaSemestre.tsx`
- [x] Actualizar `DetalleMes.tsx`: quitar "próximamente" de esas filas, ajustar `totalConsolidado`
- [ ] Verificar: cargar un gasto Mercadopago y confirmar que aparece en el total del mes, en el desglose por categoría y en la vista semestral

## Criterios de aceptación (feature completa)

- [ ] Se puede cargar, editar y eliminar un gasto Mercadopago desde la tab correspondiente
- [ ] El total del mes en la tab Mercadopago coincide con lo que muestra el dashboard (para gastos en ARS)
- [ ] Los gastos en USD se mantienen separados (`dolares`) en el detalle de mes, igual que las tarjetas, y se convierten al blue solo en la vista semestral (pivot ARS-only)
- [ ] Un gasto sin categoría se puede cargar igual y aparece como "Sin categoría" en el desglose
- [ ] La vista semestral incluye los gastos Mercadopago en el total de cada mes
- [ ] La tab "Efectivo" sigue mostrando "próximamente" (no se toca en esta tarea)
