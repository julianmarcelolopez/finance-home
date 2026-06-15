import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import { formatARS, formatMes } from '@/lib/utils'
import type { DetalleMes as DetalleMesType } from '@financehome/shared'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export function DetalleMes({ mes }: { mes: string }) {
  const [data, setData] = useState<DetalleMesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tarjetasExpandidas, setTarjetasExpandidas] = useState(false)
  const [cuotasExpandidas, setCuotasExpandidas] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.gastosDashboard
      .mes(mes)
      .then(setData)
      .catch(() => setError('No se pudo cargar el detalle del mes'))
      .finally(() => setLoading(false))
  }, [mes])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-6 text-center">{error}</p>
  }

  if (!data) return null

  const totalTarjetasPesos = data.tarjetas_mes?.reduce((s, t) => s + t.pesos, 0) ?? data.total_pesos
  const cuotasARS = data.cuotas_prestamos_ars ?? 0
  const totalConsolidado = totalTarjetasPesos + cuotasARS

  const totalPorcentajeFijos = totalConsolidado > 0
    ? Math.round((data.fijos_pesos / totalConsolidado) * 1000) / 10
    : 0
  const totalPorcentajeVariables = Math.round((100 - totalPorcentajeFijos) * 10) / 10

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <h3 className="text-base font-semibold capitalize">{formatMes(mes)}</h3>

      {/* ── Totales por origen ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Totales por origen
        </h4>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {/* Tarjetas — siempre presentes, expandibles */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-muted-foreground">
                  <button
                    onClick={() => setTarjetasExpandidas((v) => !v)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {tarjetasExpandidas
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <ChevronDown className="h-3.5 w-3.5" />
                    }
                    Tarjetas de crédito
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {formatARS(totalTarjetasPesos)}
                </td>
              </tr>
              {tarjetasExpandidas && (data.tarjetas_mes ?? []).map((t) => (
                <tr key={t.tarjeta_id} className="border-b border-border bg-muted/20">
                  <td className="px-4 py-2 pl-10 text-xs text-muted-foreground">
                    {t.nombre}
                  </td>
                  <td className={`px-4 py-2 text-right font-mono tabular-nums text-xs ${t.pesos === 0 ? 'text-muted-foreground/50' : ''}`}>
                    {formatARS(t.pesos)}
                  </td>
                </tr>
              ))}

              {/* Cuotas de préstamos */}
              {cuotasARS > 0 && (
                <>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <button
                        onClick={() => setCuotasExpandidas((v) => !v)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {cuotasExpandidas
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
                        }
                        Cuotas préstamos
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {formatARS(cuotasARS)}
                    </td>
                  </tr>
                  {cuotasExpandidas && data.cuotas_prestamos?.map((c) => (
                    <tr key={`${c.prestamo_id}-${c.numero_cuota}`} className="border-b border-border bg-muted/20">
                      <td className="px-4 py-2 pl-10 text-xs text-muted-foreground">
                        {c.banco} {c.tipo} · cuota {c.numero_cuota}/{c.total_cuotas}
                        <span className="ml-2 text-muted-foreground/60">
                          {c.fecha_vencimiento.slice(8, 10)}/{c.fecha_vencimiento.slice(5, 7)}
                        </span>
                        {c.pagada && (
                          <span className="ml-2 text-emerald-500">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-xs">
                        {formatARS(c.monto_total)}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Fuentes pendientes */}
              {data.por_origen.map((origen) => (
                <tr key={origen.nombre} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">{origen.nombre}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    <span className="text-muted-foreground/50 text-xs">próximamente</span>
                  </td>
                </tr>
              ))}

              <tr className="bg-muted/30">
                <td className="px-4 py-2.5 font-medium">Total</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">
                  {formatARS(totalConsolidado)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Fijos vs Variables ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fijos vs Variables
        </h4>
        <div className="space-y-2">
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
            {data.total_pesos > 0 && (
              <>
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${totalPorcentajeFijos}%` }}
                />
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${totalPorcentajeVariables}%` }}
                />
              </>
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Fijo — {formatARS(data.fijos_pesos)} ({totalPorcentajeFijos}%)
            </span>
            <span className="flex items-center gap-1.5">
              Variable — {formatARS(data.variables_pesos)} ({totalPorcentajeVariables}%)
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            </span>
          </div>
        </div>
      </section>

      {/* ── Por categoría ── */}
      {data.por_categoria.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Por categoría
          </h4>
          <div className="space-y-2">
            {data.por_categoria.map((cat) => (
              <div key={cat.nombre} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.nombre}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {cat.porcentaje}% · {formatARS(cat.monto)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.porcentaje}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Top 5 ── */}
      {data.top5.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Top 5 del mes
          </h4>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {data.top5.map((c, i) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 w-6 text-muted-foreground/50 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground w-16">
                      {c.fecha.slice(5).replace('-', '/')}
                    </td>
                    <td className="px-4 py-2.5">{c.referencia}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {c.origen}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium">
                      {formatARS(c.pesos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Tabla completa ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Todos los gastos del mes
          <span className="ml-2 font-normal normal-case text-muted-foreground/60">
            ({data.consumos.length})
          </span>
        </h4>
        {data.consumos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sin gastos registrados para este mes
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Comercio</th>
                  <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Origen</th>
                  <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Categoría</th>
                  <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">ARS</th>
                </tr>
              </thead>
              <tbody>
                {data.consumos.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {c.fecha.slice(5).replace('-', '/')}
                    </td>
                    <td className="px-4 py-2.5">{c.referencia}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                      {c.origen}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {c.categoria_nombre ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.categoria_color ?? '#6b7280' }}
                          />
                          <span className="text-xs">{c.categoria_nombre}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.es_fijo
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {c.es_fijo ? 'Fijo' : 'Variable'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sm">
                      {formatARS(c.pesos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
