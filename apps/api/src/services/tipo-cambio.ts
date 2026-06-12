import axios from 'axios'
import { TipoCambio } from '@financehome/shared'

interface BluelyticsResponse {
  oficial: { value_buy: number; value_sell: number }
  blue: { value_buy: number; value_sell: number }
  last_update: string
}

let cache: { data: TipoCambio; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function getTipoCambio(): Promise<TipoCambio> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  try {
    const { data } = await axios.get<BluelyticsResponse>(
      'https://api.bluelytics.com.ar/v2/latest',
      { timeout: 5000 },
    )

    const tipoCambio: TipoCambio = {
      oficial: {
        compra: data.oficial.value_buy,
        venta: data.oficial.value_sell,
      },
      blue: {
        compra: data.blue.value_buy,
        venta: data.blue.value_sell,
      },
      updated_at: data.last_update,
    }

    cache = { data: tipoCambio, timestamp: Date.now() }
    return tipoCambio
  } catch (error) {
    console.error('Error al obtener tipo de cambio:', error)
    // Fallback con valores del caché si existe, o valores hardcodeados
    if (cache) return cache.data
    return {
      oficial: { compra: 1000, venta: 1050 },
      blue: { compra: 1200, venta: 1250 },
      updated_at: new Date().toISOString(),
    }
  }
}
