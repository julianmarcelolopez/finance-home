# Feature: Tarjetas de crédito — Catálogo y Detalle

**Estado:** Completo y funcionando (2026-06-01)

## Objetivo

Reemplazar la página `Gastos` (tabla plana de consumos) por una vista con tres tabs:
- **Mercadopago** — placeholder
- **Efectivo** — placeholder
- **Tarjetas de crédito** — catálogo dinámico + detalle con Resúmenes/Consumos

---

## Decisiones de diseño — versión final

| Decisión | Elección final | Nota |
|---|---|---|
| Tabs Mercadopago / Efectivo | Placeholders vacíos | Sin data ni modelo por ahora |
| Vínculo tarjeta ↔ resúmenes | FK `tarjeta_id` en `resumenes_tarjeta` | Empezó como fuzzy match, migrado a FK durante la implementación |
| Identificador de cuenta | `nro_cuenta` completo (ej: `001747133`) | Empezó como `ultimos_4`; corregido — una cuenta agrupa múltiples plásticos |
| Display en chip | `nro_cuenta.slice(-4)` | Muestra ···7133 pero guarda el número completo |
| Estado | Local state por componente | Consistente con el resto del proyecto |
| Patrón modal | Igual a `AporteModal` en `Proyectos.tsx` | |

---

## Formato de datos reales (importante)

Los registros en `resumenes_tarjeta` tienen nombres completos y marcas con producto:

| Campo | En `tarjetas` | En `resumenes_tarjeta` |
|---|---|---|
| `titular` | `"Julian"` / `"Patricia"` | `"Lopez, Julian Marcelo"` / `"Azame, Patricia"` |
| `marca` | `"Mastercard"` | `"Mastercard Black"` / `"Mastercard Internacional"` |

El matching se resolvió con FK directa (`tarjeta_id`), no con comparación de strings.

---

## Tarjetas registradas (producción)

| ID | Banco | Marca | Nro cuenta | Titular |
|---|---|---|---|---|
| `662288be-...` | ICBC | Mastercard | 001747133 | Julian |
| `c937ea8c-...` | Galicia | Mastercard | 201252 | Julian |
| `e4a028ed-...` | Galicia | Mastercard | 2279025 | Patricia |

---

## Archivos creados / modificados

| Archivo | Cambio |
|---|---|
| `supabase/migrations/20260601120000_add_tarjetas_credit_card_catalog.sql` | Tabla `tarjetas` |
| `supabase/migrations/20260601130000_tarjetas_nro_cuenta.sql` | Rename `ultimos_4` → `nro_cuenta` |
| `supabase/migrations/20260601140000_resumenes_tarjeta_fk.sql` | FK + backfill |
| `packages/shared/types/index.ts` | `Tarjeta`, `TarjetaCreate` |
| `apps/api/src/routes/tarjetas.ts` | GET / POST / PATCH |
| `apps/api/src/routes/resumenes.ts` | Filtro por `tarjeta_id` |
| `apps/api/src/routes/consumos.ts` | Filtro por `tarjeta_id` via join |
| `apps/api/src/index.ts` | Router `/api/tarjetas` registrado |
| `apps/web/src/lib/api.ts` | `api.tarjetas.*`, params actualizados |
| `apps/web/src/pages/Gastos.tsx` | Refactor con 3 tabs |
| `apps/web/src/pages/gastos/NuevaTarjetaModal.tsx` | Modal de alta |
| `apps/web/src/pages/gastos/TarjetasTab.tsx` | Catálogo de chips + orquestación |
| `apps/web/src/pages/gastos/TarjetaResumenes.tsx` | Subtab Resúmenes |
| `apps/web/src/pages/gastos/TarjetaConsumos.tsx` | Subtab Consumos |

---

## Pendientes conocidos

- Los resúmenes nuevos que suba n8n llegan sin `tarjeta_id` — hay que asignarlo manualmente con UPDATE o automatizarlo en el flujo de n8n.
- Tabs Mercadopago y Efectivo sin implementar.
