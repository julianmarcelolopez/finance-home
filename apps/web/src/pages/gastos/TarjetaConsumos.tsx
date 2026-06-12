import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import { cn, formatARS, formatUSD, mesActual } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { ConsumoTarjeta, Tarjeta, Categoria } from '@financehome/shared'

export function TarjetaConsumos({
  tarjeta,
  resumenId,
}: {
  tarjeta: Tarjeta
  resumenId?: string
}) {
  const [consumos, setConsumos] = useState<ConsumoTarjeta[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(mesActual())
  const [page, setPage] = useState(1)
  const [categorias, setCategorias] = useState<Map<string, Categoria>>(new Map())

  useEffect(() => {
    api.etiquetas.listar()
      .then((list) => setCategorias(new Map(list.map((c) => [c.id, c]))))
      .catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = resumenId
        ? { resumen_id: resumenId, page }
        : { mes, tarjeta_id: tarjeta.id, page }
      const res = await api.consumos.listar(params)
      setConsumos(res.data)
      setTotal(res.total)
    } catch {
      // tabla vacía
    } finally {
      setLoading(false)
    }
  }, [mes, page, tarjeta.id, resumenId])

  useEffect(() => { setPage(1) }, [mes, tarjeta.id, resumenId])
  useEffect(() => { cargar() }, [cargar])

  const toggleFijo = async (consumo: ConsumoTarjeta) => {
    const nuevo = !consumo.es_fijo
    setConsumos((prev) => prev.map((c) => c.id === consumo.id ? { ...c, es_fijo: nuevo } : c))
    try {
      await api.consumos.actualizar(consumo.id, { es_fijo: nuevo })
    } catch {
      setConsumos((prev) => prev.map((c) => c.id === consumo.id ? { ...c, es_fijo: !nuevo } : c))
    }
  }

  const totalPesos = consumos.reduce((a, c) => a + (c.pesos ?? 0), 0)
  const totalDolares = consumos.reduce((a, c) => a + (c.dolares ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!resumenId && (
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-44"
          />
        )}
        <span className="text-sm text-muted-foreground">{total} registros</span>
        {totalPesos > 0 && (
          <span className="text-sm">
            Total ARS: <span className="font-semibold">{formatARS(totalPesos)}</span>
          </span>
        )}
        {totalDolares > 0 && (
          <span className="text-sm">
            USD: <span className="font-semibold">{formatUSD(totalDolares)}</span>
          </span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Comercio</TableHead>
            <TableHead className="text-right">ARS</TableHead>
            <TableHead className="text-right">USD</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Adicional</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                Cargando...
              </TableCell>
            </TableRow>
          ) : consumos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                Sin consumos para este mes
              </TableCell>
            </TableRow>
          ) : (
            consumos.map((c) => {
              const cat = c.categoria_id ? categorias.get(c.categoria_id) : undefined
              return (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(c.fecha), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{c.referencia}</TableCell>
                  <TableCell className="text-right">
                    {c.pesos > 0 ? formatARS(c.pesos) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.dolares > 0 ? formatUSD(c.dolares) : '—'}
                  </TableCell>
                  <TableCell>
                    {cat ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.nombre}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleFijo(c)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium transition-colors',
                        c.es_fijo
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {c.es_fijo ? 'Fijo' : 'Variable'}
                    </button>
                  </TableCell>
                  <TableCell>
                    {c.adicional && <Badge variant="secondary">Adicional</Badge>}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {total > 50 && (
        <div className="flex justify-end gap-2">
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Anterior
          </button>
          <span className="text-sm">Página {page}</span>
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={consumos.length < 50}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
