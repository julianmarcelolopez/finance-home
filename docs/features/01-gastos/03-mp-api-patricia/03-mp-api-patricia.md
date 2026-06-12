# 03 — Mercadopago API — cuenta Patricia

## Descripción

Igual que la tarea 02 pero para la cuenta MP de Patricia. Reutiliza la misma infraestructura (`movimientos_mp`, endpoints) diferenciando por el campo `persona = "Patricia"`.

## Estado

[ ] Pendiente — depende de la tarea 02.

## Alcance

**Incluye:**
- Configuración de credenciales MP de la cuenta de Patricia (access token separado)
- Sincronización de movimientos de Patricia en la misma tabla `movimientos_mp`
- Filtro por persona en la tab Mercadopago (selector Julian / Patricia / Ambos)

**No incluye:**
- Crear infraestructura nueva (la tarea 02 ya la crea)
- Mostrar movimientos de Patricia en el dashboard de Julian (privacidad)

## Modelo de datos

Misma tabla `movimientos_mp` que la tarea 02. El campo `persona = "Patricia"` diferencia los registros.

## Endpoints

Los mismos de la tarea 02. El query param `persona=Patricia` filtra por cuenta.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/movimientos-mp?persona=Patricia` | Movimientos de Patricia |
| POST | `/api/movimientos-mp/sync?persona=Patricia` | Sync cuenta Patricia |

## Criterios de aceptación

- [ ] Las credenciales de Patricia se guardan separadas de las de Julián (env vars o tabla de config)
- [ ] Al seleccionar "Patricia" en el filtro se ven solo sus movimientos
- [ ] La sincronización de una cuenta no afecta los movimientos de la otra
- [ ] Si Patricia no tiene movimientos en el mes, la lista muestra estado vacío (no error)

## Dependencias

- Tarea 02 (mp-api-julian) completada — reutiliza toda la infraestructura
- Credenciales MP API de la cuenta de Patricia
