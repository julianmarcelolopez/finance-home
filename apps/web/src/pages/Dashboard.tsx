import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DollarSign, CreditCard, TrendingUp, Calendar, Landmark } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatARS, formatUSD } from '@/lib/utils'
import type { DashboardResumen } from '@financehome/shared'

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description?: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard
      .resumen()
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-muted-foreground text-sm">Cargando...</div>
  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!data) return null

  const mesFormateado = format(
    new Date(data.mes_actual + '-01'),
    'MMMM yyyy',
    { locale: es },
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground capitalize">{mesFormateado}</p>
      </div>

      {/* Tipo de cambio */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">Oficial:</span>{' '}
          {formatARS(data.tipo_cambio.oficial.venta)}
        </span>
        <span>
          <span className="font-medium text-foreground">Blue:</span>{' '}
          {formatARS(data.tipo_cambio.blue.venta)}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Consumos del mes"
          value={formatARS(data.total_consumos_pesos)}
          description={data.total_consumos_dolares > 0 ? `+ ${formatUSD(data.total_consumos_dolares)} USD` : undefined}
          icon={CreditCard}
        />
        <MetricCard
          title="Gastos fijos del mes"
          value={formatARS(data.gastos_fijos_mes_ars)}
          description="Calculado al dólar blue"
          icon={DollarSign}
        />
        {data.proxima_cuota_prestamo && (
          <MetricCard
            title="Próxima cuota préstamo"
            value={formatARS(data.proxima_cuota_prestamo.monto_total)}
            description={`${data.proxima_cuota_prestamo.banco} ${data.proxima_cuota_prestamo.tipo} ${data.proxima_cuota_prestamo.numero_cuota}/${data.proxima_cuota_prestamo.total_cuotas} · vence ${format(new Date(data.proxima_cuota_prestamo.fecha_vencimiento + 'T12:00:00'), 'dd/MM/yyyy')}`}
            icon={Landmark}
          />
        )}
        <MetricCard
          title="Proyectos activos"
          value={String(data.proyectos_activos)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Vencimientos este mes"
          value={String(data.proximos_vencimientos.length)}
          icon={Calendar}
        />
      </div>

      {/* Próximos vencimientos */}
      {data.proximos_vencimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos vencimientos</CardTitle>
            <CardDescription>Resúmenes de tarjeta del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.proximos_vencimientos.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {r.banco} · {r.marca_tarjeta}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Titular: {r.titular} · Vence:{' '}
                      {format(new Date(r.vencimiento_actual), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatARS(r.total_pagar_pesos)}</p>
                    {r.total_pagar_dolares > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatUSD(r.total_pagar_dolares)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoría</CardTitle>
          <CardDescription>Consumos del mes actual agrupados por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            <Badge variant="secondary">Disponible cuando se configuren las categorías</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
