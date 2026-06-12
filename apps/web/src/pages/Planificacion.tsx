import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatARS, formatMes } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { FlujoCajaMes } from '@financehome/shared'

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1]

export default function Planificacion() {
  const [año, setAño] = useState(AÑO_ACTUAL)
  const [flujo, setFlujo] = useState<FlujoCajaMes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.planificacion
      .flujo(año)
      .then(setFlujo)
      .finally(() => setLoading(false))
  }, [año])

  const totalIngresos = flujo.reduce((a, m) => a + m.ingresos, 0)
  const totalGastosFijos = flujo.reduce((a, m) => a + m.gastos_fijos, 0)
  const totalVariables = flujo.reduce((a, m) => a + m.gastos_variables, 0)
  const totalSaldo = flujo.reduce((a, m) => a + m.saldo, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planificación</h2>
          <p className="text-muted-foreground">Flujo de caja proyectado mes a mes</p>
        </div>
        <Select value={String(año)} onValueChange={(v) => setAño(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AÑOS.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flujo de caja {año}</CardTitle>
          <CardDescription>
            Ingresos vs gastos fijos vs gastos variables (consumos tarjeta). Montos en ARS.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Gastos fijos</TableHead>
                <TableHead className="text-right">Tarjetas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Calculando...
                  </TableCell>
                </TableRow>
              ) : (
                flujo.map((m) => (
                  <TableRow
                    key={m.mes}
                    className={cn(m.saldo < 0 && 'bg-destructive/5')}
                  >
                    <TableCell className="font-medium capitalize">{formatMes(m.mes)}</TableCell>
                    <TableCell className="text-right text-green-700">
                      {m.ingresos > 0 ? formatARS(m.ingresos) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-orange-700">
                      {m.gastos_fijos > 0 ? formatARS(m.gastos_fijos) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-red-700">
                      {m.gastos_variables > 0 ? formatARS(m.gastos_variables) : '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        m.saldo >= 0 ? 'text-green-700' : 'text-destructive',
                      )}
                    >
                      {formatARS(m.saldo)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right',
                        m.saldo_acumulado >= 0 ? 'text-foreground' : 'text-destructive',
                      )}
                    >
                      {formatARS(m.saldo_acumulado)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totales del año */}
      {flujo.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total ingresos', value: totalIngresos, color: 'text-green-700' },
            { label: 'Total gastos fijos', value: totalGastosFijos, color: 'text-orange-700' },
            { label: 'Total tarjetas', value: totalVariables, color: 'text-red-700' },
            {
              label: 'Saldo anual',
              value: totalSaldo,
              color: totalSaldo >= 0 ? 'text-green-700' : 'text-destructive',
            },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn('text-xl font-bold', color)}>{formatARS(value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
