import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatARS } from '@/lib/utils'
import type { SemestreResumen } from '@financehome/shared'

const TIPO_COLOR: Record<string, string> = {
  tarjeta:     'text-foreground',
  prestamo:    'text-blue-400',
  gastos_fijos:'text-amber-400',
  mercadopago: 'text-emerald-400',
}

function abreviarMes(mesISO: string): string {
  const [y, m] = mesISO.split('-')
  const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${nombres[parseInt(m) - 1]} ${y}`
}

function Celda({ valor }: { valor: number | undefined }) {
  if (!valor) return <span className="text-muted-foreground/40">—</span>
  return <span className="tabular-nums">{formatARS(valor)}</span>
}

export function TablaSemestre({ semestre }: { semestre: 1 | 2 }) {
  const año = new Date().getFullYear()
  const [data, setData] = useState<SemestreResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.gastosDashboard
      .semestre(año, semestre)
      .then(setData)
      .catch(() => setError('No se pudo cargar el semestre'))
      .finally(() => setLoading(false))
  }, [año, semestre])

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-muted rounded w-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-muted/60 rounded w-full" />
        ))}
      </div>
    )
  }

  if (error) return <p className="text-sm text-destructive py-6 text-center">{error}</p>
  if (!data) return null

  const { meses, filas, totales } = data

  // Separar filas por tipo para mostrar agrupadas
  const tarjetas     = filas.filter(f => f.tipo === 'tarjeta')
  const prestamos    = filas.filter(f => f.tipo === 'prestamo')
  const gastosFijos  = filas.filter(f => f.tipo === 'gastos_fijos')
  const mercadopago  = filas.filter(f => f.tipo === 'mercadopago')

  const grupos = [
    { label: 'Tarjetas de crédito', filas: tarjetas, color: TIPO_COLOR.tarjeta },
    { label: 'Préstamos',           filas: prestamos, color: TIPO_COLOR.prestamo },
    { label: 'Gastos fijos',        filas: gastosFijos, color: TIPO_COLOR.gastos_fijos },
    { label: 'Mercadopago',         filas: mercadopago, color: TIPO_COLOR.mercadopago },
  ].filter(g => g.filas.length > 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {/* Encabezado de meses */}
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-64">
              Origen
            </th>
            {meses.map(m => (
              <th key={m} className="text-right px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                {abreviarMes(m)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {grupos.map((grupo) => (
            <>
              {/* Encabezado de grupo */}
              <tr key={`header-${grupo.label}`} className="border-t border-border bg-muted/20">
                <td
                  colSpan={meses.length + 1}
                  className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider ${grupo.color}`}
                >
                  {grupo.label}
                </td>
              </tr>

              {/* Filas del grupo */}
              {grupo.filas.map((fila) => (
                <tr key={fila.nombre} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[256px]" title={fila.nombre}>
                    {fila.nombre}
                  </td>
                  {meses.map(m => (
                    <td key={m} className="px-4 py-2.5 text-right">
                      <Celda valor={fila.meses[m]} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>

        {/* Fila de totales */}
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/30">
            <td className="px-4 py-3 font-semibold">Total</td>
            {meses.map(m => (
              <td key={m} className="px-4 py-3 text-right font-semibold tabular-nums">
                {totales[m] ? formatARS(totales[m]) : <span className="text-muted-foreground/40">—</span>}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
