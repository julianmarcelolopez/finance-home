# 02 — Binance — vista de crypto

## Descripción

Conexión con la API de Binance para mostrar el balance de crypto de Julián: saldo de cada coin (BTC, ETH, USDT, etc.), precio actual en USD y valuación total en ARS al tipo de cambio blue.

## Estado

[ ] Pendiente — depende de la tarea 01 (infraestructura de Inversiones.tsx).

## Alcance

**Incluye:**
- Autenticación con Binance API usando API key + secret read-only de la cuenta de Julián
- Consulta de balances spot (no futuros ni staking)
- Precio actual de cada coin en USD via Binance ticker
- Filtrar coins con saldo > 0.00001 (ignorar dust)
- Vista en `Inversiones.tsx`: tab "Crypto" con tabla de coins, saldo, precio USD y valuación ARS

**No incluye:**
- Historial de precios o rendimiento
- Balances de Futures, Earn o Savings de Binance
- USDT o stablecoins mostrados en ARS (se muestran en USD directo, son 1:1)
- Posiciones de Patricia

## Modelo de datos

No requiere tabla en Supabase — datos en tiempo real de la API.

Tipo a agregar en `packages/shared/types/index.ts`:

```ts
interface PosicionCrypto {
  coin: string         // "BTC", "ETH", "USDT"
  nombre: string       // "Bitcoin", "Ethereum"
  saldo: number        // cantidad de coins
  precio_usd: number   // precio actual por coin
  valuacion_usd: number // saldo * precio_usd
  valuacion_ars: number // para no-stablecoins: valuacion_usd * blue
}

interface CarteraCrypto {
  posiciones: PosicionCrypto[]
  total_usd: number
  total_ars: number
  actualizado_at: string
}
```

## Endpoints nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/inversiones/crypto` | Balance crypto de Binance |

El endpoint:
1. Llama a `GET /api/v3/account` con firma HMAC-SHA256 de Binance
2. Filtra assets con `free + locked > 0.00001`
3. Consulta precios actuales con `GET /api/v3/ticker/price` (batch)
4. Convierte al tipo de cambio blue
5. Retorna `CarteraCrypto` con caché de 5 min

Variables de entorno a agregar en `.env`:
```
BINANCE_API_KEY=...
BINANCE_SECRET_KEY=...
```

La firma se genera así:
```ts
import crypto from 'crypto'
const signature = crypto
  .createHmac('sha256', process.env.BINANCE_SECRET_KEY)
  .update(queryString)
  .digest('hex')
```

## Criterios de aceptación

- [ ] La tabla de crypto muestra solo las coins con saldo significativo (> 0.00001)
- [ ] Los precios se actualizan al recargar la página (caché de 5 min máximo)
- [ ] USDT y stablecoins se muestran con precio $1.00 USD directamente
- [ ] Si la API key no tiene permisos read-only, el error se muestra en la UI sin romper el tab
- [ ] La API key y secret NUNCA aparecen en respuestas del backend ni en logs

## Dependencias

- API key + secret read-only de Binance de la cuenta de Julián (generar en Binance → API Management con permisos solo lectura)
- Tarea 01 de esta feature: `Inversiones.tsx` ya con estructura de tabs
- bluelytics.com.ar: tipo de cambio para conversión (ya implementado)
