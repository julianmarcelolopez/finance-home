import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatARS, formatUSD, formatMes, mesActual } from '@/lib/utils'
import type { GastoMercadopago, GastoMercadopagoCreate, Categoria } from '@financehome/shared'

function agregarMeses(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

// ---- Modal ----

function GastoMercadopagoModal({
  gasto,
  categorias,
  onClose,
  onSuccess,
}: {
  gasto: GastoMercadopago | null
  categorias: Categoria[]
  onClose: () => void
  onSuccess: (gasto: GastoMercadopago) => void
}) {
  const [form, setForm] = useState<GastoMercadopagoCreate>({
    fecha: gasto?.fecha ?? new Date().toISOString().slice(0, 10),
    descripcion: gasto?.descripcion ?? '',
    monto: gasto?.monto ?? 0,
    moneda: gasto?.moneda ?? 'ARS',
    persona: gasto?.persona ?? 'Compartido',
    categoria_id: gasto?.categoria_id ?? undefined,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof GastoMercadopagoCreate, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const puedeGuardar =
    form.descripcion.trim() !== '' && form.monto > 0 && form.fecha !== ''

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const resultado = gasto
        ? await api.gastosMercadopago.actualizar(gasto.id, form)
        : await api.gastosMercadopago.crear(form)
      onSuccess(resultado)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg p-6 w-[480px] space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-base">
          {gasto ? 'Editar gasto Mercadopago' : 'Nuevo gasto Mercadopago'}
        </h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            placeholder="ej: Verdulería feria, Farmacity"
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Monto</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={form.monto || ''}
              onChange={(e) => set('monto', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Moneda</label>
            <Select value={form.moneda} onValueChange={(v) => set('moneda', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Persona</label>
            <Select value={form.persona} onValueChange={(v) => set('persona', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Julian">Julian</SelectItem>
                <SelectItem value="Patricia">Patricia</SelectItem>
                <SelectItem value="Compartido">Compartido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha</label>
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Categoría{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Select
            value={form.categoria_id ?? '__sin_categoria__'}
            onValueChange={(v) => set('categoria_id', v === '__sin_categoria__' ? undefined : v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__sin_categoria__">Sin categoría</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={!puedeGuardar || loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Page ----

const PERSONAS = ['Todos', 'Julian', 'Patricia', 'Compartido'] as const
type FiltroPersona = (typeof PERSONAS)[number]

export function MercadopagoTab() {
  const [gastos, setGastos] = useState<GastoMercadopago[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(mesActual())
  const [filtro, setFiltro] = useState<FiltroPersona>('Todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [gastoEditando, setGastoEditando] = useState<GastoMercadopago | null>(null)
  const [blueSell, setBlueSell] = useState(0)

  const esActual = mes === mesActual()

  useEffect(() => {
    api.etiquetas.listar().then(setCategorias).catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [res, resumen] = await Promise.all([
        api.gastosMercadopago.listar({
          mes,
          persona: filtro === 'Todos' ? undefined : filtro,
          page: 1,
        }),
        api.dashboard.resumen(),
      ])
      setGastos(res.data)
      setBlueSell(resumen.tipo_cambio.blue.venta)
    } catch {
      setGastos([])
    } finally {
      setLoading(false)
    }
  }, [mes, filtro])

  useEffect(() => { cargar() }, [cargar])

  const totalARS = gastos.reduce((acc, g) => {
    return acc + (g.moneda === 'ARS' ? g.monto : g.monto * (blueSell || 0))
  }, 0)

  const handleEliminar = async (gasto: GastoMercadopago) => {
    if (!confirm(`¿Eliminar "${gasto.descripcion}"?`)) return
    await api.gastosMercadopago.eliminar(gasto.id)
    setGastos((prev) => prev.filter((g) => g.id !== gasto.id))
  }

  const handleGuardado = (actualizado: GastoMercadopago) => {
    setGastos((prev) => {
      const existe = prev.some((g) => g.id === actualizado.id)
      const siguiente = existe
        ? prev.map((g) => (g.id === actualizado.id ? actualizado : g))
        : [...prev, actualizado]
      return siguiente.sort((a, b) => b.fecha.localeCompare(a.fecha))
    })
    setModalAbierto(false)
    setGastoEditando(null)
  }

  if (loading && gastos.length === 0) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mercadopago</h2>
          <p className="text-muted-foreground text-sm">Gastos de débito cargados a mano</p>
        </div>
        <Button onClick={() => { setGastoEditando(null); setModalAbierto(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

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

      {/* Filtro persona */}
      <div className="flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => setFiltro(p)}
            className={`px-3 py-1 rounded-full text-sm transition-colors
              ${filtro === p
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {gastos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay gastos Mercadopago para {formatMes(mes)}{filtro !== 'Todos' ? ` (${filtro})` : ''}.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Persona</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gastos.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format(parseISO(g.fecha), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 font-medium">{g.descripcion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={g.moneda === 'USD' ? 'outline' : 'secondary'}>
                        {g.moneda}
                      </Badge>
                      {g.moneda === 'ARS' ? formatARS(g.monto) : formatUSD(g.monto)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {g.categorias ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: g.categorias.color }}
                        />
                        {g.categorias.nombre}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{g.persona}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setGastoEditando(g); setModalAbierto(true) }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(g)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-end pt-2 border-t">
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Total del mes</p>
          <p className="text-xl font-bold">{formatARS(totalARS)}</p>
          {blueSell > 0 && gastos.some((g) => g.moneda === 'USD') && (
            <p className="text-xs text-muted-foreground">
              USD convertidos al blue ({formatARS(blueSell)})
            </p>
          )}
        </div>
      </div>

      {modalAbierto && (
        <GastoMercadopagoModal
          gasto={gastoEditando}
          categorias={categorias}
          onClose={() => { setModalAbierto(false); setGastoEditando(null) }}
          onSuccess={handleGuardado}
        />
      )}
    </div>
  )
}
