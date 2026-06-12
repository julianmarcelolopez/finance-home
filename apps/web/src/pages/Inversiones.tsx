import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const INTEGRACIONES_FUTURAS = [
  { nombre: 'BullMarket Broker', descripcion: 'Acciones, cedears, bonos y FCI', estado: 'próximamente' },
  { nombre: 'Binance', descripcion: 'Criptomonedas y stablecoins', estado: 'próximamente' },
]

export default function Inversiones() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inversiones</h2>
        <p className="text-muted-foreground">Portfolio de inversiones y activos</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">En construcción</p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta sección se integrará con los brokers cuando esté lista la API
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
            {INTEGRACIONES_FUTURAS.map((i) => (
              <div
                key={i.nombre}
                className="flex items-center justify-between rounded-md border p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">{i.descripcion}</p>
                </div>
                <Badge variant="secondary">{i.estado}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
