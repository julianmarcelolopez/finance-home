# 05 — Gestión de Etiquetas (UI)

## Estado

✅ Completado

## Descripción

Página `/etiquetas` para administrar categorías y patrones sin necesidad de SQL manual. Al agregar un patrón nuevo, el backfill corre automáticamente y se muestran cuántos consumos fueron categorizados.

## Implementación

- `apps/web/src/pages/Etiquetas.tsx` — página con dos tabs
- Link "Etiquetas" con ícono `Tag` en el sidebar
- Ruta `/etiquetas` en `App.tsx`

### Tab Categorías
- Tabla con color, nombre e ícono de cada categoría
- Modal "+ Nueva categoría": nombre, color picker + hex, ícono (nombre lucide-react)
- Validación 409: nombre duplicado muestra error inline

### Tab Patrones
- Tabla con patrón (monospace), categoría (badge de color), tipo (Fijo/Variable)
- Modal "+ Nuevo patrón": patrón (se guarda en mayúsculas), selector de categoría, toggle fijo/variable
- Al guardar → notificación verde con cantidad de consumos categorizados automáticamente
- Botón eliminar por fila

## API utilizada

- `GET /api/etiquetas` — carga categorías (con cache en módulo)
- `POST /api/etiquetas` — crea categoría + invalida cache
- `GET /api/etiquetas/patrones` — carga patrones con join
- `POST /api/etiquetas/patrones` — crea patrón + backfill automático
- `DELETE /api/etiquetas/patrones/:id` — elimina patrón

## Criterios de aceptación

- [x] Desde la UI se puede agregar una categoría nueva (ej: Deporte)
- [x] Desde la UI se puede agregar un patrón y ver cuántos consumos se categorizaron
- [x] No se pueden crear categorías con nombre duplicado
- [x] Los patrones se listan con su categoría en color y el tipo Fijo/Variable
