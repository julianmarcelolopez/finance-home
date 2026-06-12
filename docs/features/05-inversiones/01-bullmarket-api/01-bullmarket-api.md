# 01 — BullMarket — vista de cartera

## Descripción

Conexión con la API de BullMarket para mostrar la cartera de acciones y bonos de Julián: posición en cada instrumento (cantidad de unidades, precio actual, valuación total) con el equivalente en ARS al tipo de cambio blue.

## Estado

[ ] Pendiente. La página `Inversiones.tsx` existe pero muestra placeholder.

## Alcance

**Incluye:**
- Autenticación con BullMarket API (API key read-only de la cuenta de Julián)
- Consulta de posiciones actuales: ticker, cantidad, precio, valuación USD
- Conversión de valuación USD → ARS al tipo de cambio blue
- Vista en `Inversiones.tsx`: tabla de posiciones con total de cartera en USD y ARS
- Caché del lado del servidor (5–15 min) para no consumir rate limit de BullMarket

**No incluye:**
- Historial de rendimiento o gráfico de evolución (solo snapshot actual)
- Operaciones de compra/venta (solo lectura)
- Posiciones de Patricia (BullMarket es cuenta de Julián)
- Alertas de precio

## Modelo de datos

No requiere tabla en Supabase — datos en tiempo real de la API.

Tipo a agregar en `packages/shared/types/index.ts`:

```ts
interface PosicionBullmarket {
  ticker: string       // "GGAL", "AL30", "CEDEAR"
  nombre: string       // nombre descriptivo del instrumento
  cantidad: number     // unidades
  precio_usd: number   // precio actual por unidad
  valuacion_usd: number // cantidad * precio_usd
  valuacion_ars: number // valuacion_usd * tipo_cambio.blue.venta
}

interface CarteraBullmarket {
  posiciones: PosicionBullmarket[]
  total_usd: number
  total_ars: number
  actualizado_at: string
}
```

## Endpoints nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/inversiones/bullmarket` | Cartera actual de BullMarket |

El endpoint llama a la API de BullMarket, convierte valores al blue, crea un caché en memoria y retorna `CarteraBullmarket`.

Variable de entorno a agregar en `.env`:
```
BULLMARKET_API_KEY=...
BULLMARKET_API_URL=https://api.bullmarketbrokers.com
```

## Criterios de aceptación

- [ ] La tabla de posiciones se carga al entrar a la pestaña BullMarket de Inversiones.tsx
- [ ] La valuación total en ARS usa el tipo de cambio blue del día
- [ ] Si la API de BullMarket no responde, se muestra el último dato cacheado con timestamp
- [ ] Si no hay posiciones (cartera vacía), se muestra estado vacío con mensaje
- [ ] La API key no se expone en el frontend (el request va por el backend Express)

## Dependencias

- API key de BullMarket de la cuenta de Julián (a generar en el panel de BullMarket)
- bluelytics.com.ar: tipo de cambio para conversión USD → ARS (ya implementado)
- `Inversiones.tsx`: agregar tab "BullMarket" al componente existente
