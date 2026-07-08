import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatARS, formatMes, mesActual } from '@/lib/utils'
import type { ResumenMensualProyectado } from '@financehome/shared'

function agregarMeses(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export function ResumenMensualTab() {
  const [mes, setMes] = useState(mesActual())
  const [data, setData] = useState<ResumenMensualProyectado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const esActual = mes === mesActual()

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.gastosResumenMensual
      .mes(mes)
      .then(setData)
      .catch(() => setError('No se pudo cargar el resumen mensual'))
      .finally(() => setLoading(false))
  }, [mes])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-6 text-center">{error}</p>
  }

  if (!data) return null

  const porcentajeReal = data.gastos_totales_ars > 0
    ? Math.round((data.gastos_reales_ars / data.gastos_totales_ars) * 1000) / 10
    : 0
  const porcentajeEstimado = Math.round((100 - porcentajeReal) * 10) / 10
  const saldoPositivo = data.saldo_proyectado_ars >= 0

  return (
    <div className="space-y-6">
      {/* Navegación de mes */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMes((m) => agregarMeses(m, -1))}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-medium capitalize min-w-[130px] text-center">
          {formatMes(mes)}
        </span>

        <button
          onClick={() => setMes((m) => agregarMeses(m, 1))}
          disabled={esActual}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!esActual && (
          <button
            onClick={() => setMes(mesActual())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Volver al mes actual
          </button>
        )}
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Ingresos del mes</p>
          <p className="text-2xl font-bold tabular-nums">{formatARS(data.ingresos_ars)}</p>
          <p className="text-xs text-muted-foreground">
            {data.ingresos_cantidad} ingreso{data.ingresos_cantidad === 1 ? '' : 's'} cargado{data.ingresos_cantidad === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Gastos proyectados</p>
          <p className="text-2xl font-bold tabular-nums">{formatARS(data.gastos_totales_ars)}</p>
          <p className="text-xs text-muted-foreground">
            {formatARS(data.gastos_reales_ars)} reales + {formatARS(data.gastos_estimados_ars)} estimados
          </p>
        </div>

        <div className={`rounded-lg p-4 space-y-1 ${saldoPositivo ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
          <p className={`text-sm ${saldoPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>Saldo proyectado</p>
          <p className={`text-2xl font-bold tabular-nums ${saldoPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
            {saldoPositivo ? '+ ' : '− '}{formatARS(Math.abs(data.saldo_proyectado_ars))}
          </p>
          <p className={`text-xs ${saldoPositivo ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
            {data.porcentaje_comprometido}% de los ingresos
          </p>
        </div>
      </div>

      {/* Barra real vs estimado */}
      <section className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Gasto proyectado vs ingresos
        </h4>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {data.gastos_totales_ars > 0 && (
            <>
              <div className="bg-blue-500 transition-all" style={{ width: `${porcentajeReal}%` }} />
              <div className="bg-blue-300 transition-all" style={{ width: `${porcentajeEstimado}%` }} />
            </>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Real (cargado)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-300" /> Estimado
            </span>
          </span>
          <span>{data.porcentaje_comprometido}% de los ingresos comprometido</span>
        </div>
      </section>

      {/* Desglose de gastos */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Desglose de gastos
        </h4>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {data.componentes.map((c) => (
                <tr key={c.nombre} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{c.nombre}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          c.tipo === 'real'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-amber-400/15 text-amber-500'
                        }`}
                        title={
                          c.tipo === 'estimado'
                            ? 'Proyección simple basada en el promedio histórico de la tarjeta — no un cálculo exacto de intereses ni prorrateo por día del ciclo'
                            : undefined
                        }
                      >
                        {c.tipo === 'real' ? 'Real' : 'Estimado'}
                      </span>
                    </div>
                    {c.detalle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{c.detalle}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {c.tipo === 'estimado' && <span className="text-muted-foreground mr-1">~</span>}
                    {formatARS(c.monto_ars)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground/70">
          Los montos "Estimado" son una proyección simple basada en el promedio histórico de cada tarjeta,
          no un cálculo exacto de intereses ni un prorrateo por día del ciclo.
        </p>
      </section>
    </div>
  )
}
