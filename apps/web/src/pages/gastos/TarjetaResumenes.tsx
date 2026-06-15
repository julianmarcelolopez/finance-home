import { useEffect, useState } from 'react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { api } from '@/lib/api'
import { formatARS, formatUSD } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import type { ResumenTarjeta, Tarjeta } from '@financehome/shared'

function estadoResumen(vencimiento: string): { label: string; color: string } {
  const dias = differenceInDays(parseISO(vencimiento), new Date())
  if (dias < 0) return { label: 'Pagado', color: 'text-muted-foreground' }
  return { label: 'Pendiente', color: 'text-emerald-400' }
}

function VencimientoBadge({ fecha }: { fecha: string }) {
  const dias = differenceInDays(parseISO(fecha), new Date())
  const label = format(parseISO(fecha), 'dd/MM/yyyy')

  if (dias < 0) {
    return <span className="text-muted-foreground">{label}</span>
  }
  if (dias === 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-xs text-red-400">hoy</span>
      </span>
    )
  }
  if (dias <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-400">
          {dias}d
        </span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {dias}d
      </span>
    </span>
  )
}

type FilaResumen =
  | { tipo: 'real'; resumen: ResumenTarjeta }
  | { tipo: 'vacio'; mes: string }

function rellenarMeses(resumenes: ResumenTarjeta[]): FilaResumen[] {
  const toMesKey = (iso: string) => iso.substring(0, 7)

  const porMes = new Map<string, ResumenTarjeta>()
  for (const r of resumenes) porMes.set(toMesKey(r.vencimiento_actual), r)

  const hoy = new Date()
  const año = hoy.getFullYear()
  const mesActual = `${año}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const primerMes = `${año}-01`

  const resultado: FilaResumen[] = []
  let cursor = mesActual

  while (cursor >= primerMes) {
    if (porMes.has(cursor)) {
      resultado.push({ tipo: 'real', resumen: porMes.get(cursor)! })
    } else {
      resultado.push({ tipo: 'vacio', mes: cursor })
    }
    const [y, m] = cursor.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    cursor = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  }

  // Resumenes de años anteriores van después, sin relleno
  const primerMesNum = primerMes
  for (const r of resumenes) {
    if (toMesKey(r.vencimiento_actual) < primerMesNum) {
      resultado.push({ tipo: 'real', resumen: r })
    }
  }

  return resultado
}

export function TarjetaResumenes({
  tarjeta,
  onSelectResumen,
}: {
  tarjeta: Tarjeta
  onSelectResumen: (resumenId: string) => void
}) {
  const [resumenes, setResumenes] = useState<ResumenTarjeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.resumenes
      .listar({ tarjeta_id: tarjeta.id })
      .then((res) => setResumenes(res.data))
      .finally(() => setLoading(false))
  }, [tarjeta.id])

  const ultimo = resumenes[0]

  return (
    <div className="space-y-4">
      {ultimo && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                Total {format(parseISO(ultimo.vencimiento_actual), 'MMMM yyyy', { locale: es })}
              </p>
              <p className="text-2xl font-semibold">{formatARS(ultimo.total_pagar_pesos)}</p>
              <p className="text-xs text-muted-foreground">ARS</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">En dólares</p>
              <p className="text-2xl font-semibold">{formatUSD(ultimo.total_pagar_dolares)}</p>
              <p className="text-xs text-muted-foreground">al cierre</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Vence</p>
              <p className="text-2xl font-semibold">
                {format(parseISO(ultimo.vencimiento_actual), 'd MMM', { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const dias = differenceInDays(parseISO(ultimo.vencimiento_actual), new Date())
                  if (dias < 0) return 'vencido'
                  if (dias === 0) return 'hoy'
                  return `en ${dias} días`
                })()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Período</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total ARS</TableHead>
            <TableHead className="text-right">En dólares</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                Cargando...
              </TableCell>
            </TableRow>
          ) : resumenes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                Sin resúmenes para esta tarjeta
              </TableCell>
            </TableRow>
          ) : (
            rellenarMeses(resumenes).map((fila) => {
              if (fila.tipo === 'vacio') {
                const label = format(parseISO(`${fila.mes}-01`), 'MMMM yyyy', { locale: es })
                return (
                  <TableRow key={fila.mes} className="opacity-50">
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">Sin movimientos</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">$ 0</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                )
              }

              const r = fila.resumen
              const estado = estadoResumen(r.vencimiento_actual)
              return (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => onSelectResumen(r.id)}
                >
                  <TableCell>
                    {format(parseISO(r.vencimiento_actual), 'MMMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(r.cierre_actual), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <VencimientoBadge fecha={r.vencimiento_actual} />
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${estado.color}`}>{estado.label}</span>
                  </TableCell>
                  <TableCell className="text-right">{formatARS(r.total_pagar_pesos)}</TableCell>
                  <TableCell className="text-right">
                    {r.total_pagar_dolares > 0 ? formatUSD(r.total_pagar_dolares) : '—'}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
