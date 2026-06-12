# 04 — Etiquetado Fijo / Variable

## Estado

✅ Completado

## Descripción

Cada consumo puede marcarse como **Fijo** (recurrente mensual, ej: Netflix, Swiss Medical) o **Variable** (compra esporádica). La distinción viene del patrón de comercio o se asigna manualmente desde la UI.

## Implementación

- Columna `es_fijo BOOLEAN DEFAULT false` en `consumos_tarjeta` — migration `20260608100000_consumos_es_fijo.sql`
- Columna `es_fijo BOOLEAN DEFAULT false` en `comercios_categorias` — migration `20260608110000_comercios_es_fijo.sql`
- El trigger `fn_autoetiquetado` asigna `es_fijo` desde el patrón al insertar
- Toggle manual en la tabla de consumos (UI)
- Filtro `?es_fijo=true/false` en `GET /api/consumos`
- `PATCH /api/consumos/:id` con `{ es_fijo: boolean }`

## Patrones marcados como fijo

Streaming y suscripciones digitales: NETFLIX, SPOTIFY, DISNEY, HBO, AMAZON, APPLE, DEEZER.
Servicios del hogar: MOVISTAR, PERSONAL, CLARO, FIBERTEL, TELECENTRO, EDENOR, EDESUR, METROGAS, AYSA.
Salud: SWISS MEDICAL, OSDE, MEDICUS, GALENO.

Administrables desde `/etiquetas` → tab Patrones.

## Criterios de aceptación

- [x] Toggle Fijo/Variable visible en la tabla de consumos
- [x] Click en el toggle persiste el cambio en la DB (PATCH optimistic)
- [x] Los patrones marcados como fijo autoetiquetan consumos nuevos con `es_fijo = true`
- [x] `GET /api/consumos?es_fijo=true` filtra correctamente
