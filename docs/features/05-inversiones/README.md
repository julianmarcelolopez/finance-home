# Feature 05 — Inversiones

Vista consolidada de cartera de inversiones: acciones/bonos en BullMarket y crypto en Binance. Permite ver la posición actual sin tener que entrar a cada plataforma por separado.

## Objetivo

Mostrar el valor actual de las inversiones de Julian en ARS y USD, actualizado en tiempo real desde las APIs externas, integrado al dashboard de finanzas.

## Estado actual

| Tarea | Estado |
|-------|--------|
| 01-bullmarket-api | Pendiente (página `Inversiones.tsx` existe, muestra placeholder) |
| 02-binance-api | Pendiente |

La página `Inversiones.tsx` ya existe en el router pero solo muestra un placeholder. No hay endpoints de API ni credenciales configuradas todavía.

## Dependencias

- BullMarket: cuenta de Julian, API key a generar
- Binance: cuenta de Julian, API key read-only a generar
- bluelytics.com.ar: conversión de posiciones USD → ARS para el dashboard
- No depende de otras features de FinanceHome

## Tareas

- [01-bullmarket-api](./01-bullmarket-api/01-bullmarket-api.md) — Conexión BullMarket, vista de cartera
- [02-binance-api](./02-binance-api/02-binance-api.md) — Conexión Binance, vista de crypto
