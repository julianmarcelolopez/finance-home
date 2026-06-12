import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatARS, formatUSD } from '@/lib/utils'
import type { GastoFijo, GastoFijoCreate } from '@financehome/shared'

// ---- Modal ----

function GastoFijoModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (gasto: GastoFijo) => void
}) {
  const [form, setForm] = useState<GastoFijoCreate>({
    nombre: '',
    monto: 0,
    moneda: 'ARS',
    persona: 'Compartido',
    dia_del_mes: 1,
    fecha_inicio: new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof GastoFijoCreate, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const puedeGuardar =
    form.nombre.trim() !== '' &&
    form.monto > 0 &&
    form.dia_del_mes >= 1 &&
    form.dia_del_mes <= 31 &&
    form.fecha_inicio !== ''

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const nuevo = await api.gastosFijos.crear(form)
      onSuccess(nuevo)
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
        <h3 className="font-semibold text-base">Nuevo gasto fijo</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            placeholder="ej: Expensas, Netflix, Alquiler"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
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
            <label className="text-sm font-medium">Día del mes</label>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="1–31"
              value={form.dia_del_mes || ''}
              onChange={(e) => set('dia_del_mes', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Inicio</label>
            <Input
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Fin{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Input
              type="date"
              value={form.fecha_fin || ''}
              onChange={(e) => set('fecha_fin', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Categoría{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="ej: Vivienda, Servicios, Entretenimiento"
            value={form.categoria || ''}
            onChange={(e) => set('categoria', e.target.value || undefined)}
          />
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

export default function GastosFijos() {
  const [gastos, setGastos] = useState<GastoFijo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroPersona>('Todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [blueSell, setBlueSell] = useState(0)

  useEffect(() => {
    Promise.all([
      api.gastosFijos.listar({ activo: true }),
      api.dashboard.resumen(),
    ])
      .then(([fijos, resumen]) => {
        setGastos(fijos)
        setBlueSell(resumen.tipo_cambio.blue.venta)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtrados =
    filtro === 'Todos' ? gastos : gastos.filter((g) => g.persona === filtro)

  const totalARS = gastos.reduce((acc, g) => {
    return acc + (g.moneda === 'ARS' ? g.monto : g.monto * (blueSell || 0))
  }, 0)

  const handleDesactivar = async (gasto: GastoFijo) => {
    await api.gastosFijos.actualizar(gasto.id, { activo: false })
    setGastos((prev) => prev.filter((g) => g.id !== gasto.id))
  }

  const handleCreado = (nuevo: GastoFijo) => {
    setGastos((prev) =>
      [...prev, nuevo].sort((a, b) => a.dia_del_mes - b.dia_del_mes),
    )
    setModalAbierto(false)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gastos Fijos</h2>
          <p className="text-muted-foreground text-sm">Recurrentes mensuales activos</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
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
      {filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay gastos fijos{filtro !== 'Todos' ? ` para ${filtro}` : ''}.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Día</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Persona</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {g.nombre}
                    {g.categoria && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {g.categoria}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={g.moneda === 'USD' ? 'outline' : 'secondary'}>
                        {g.moneda}
                      </Badge>
                      {g.moneda === 'ARS' ? formatARS(g.monto) : formatUSD(g.monto)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">día {g.dia_del_mes}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.persona}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDesactivar(g)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Desactivar
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
          <p className="text-xs text-muted-foreground mb-0.5">Total mensual estimado</p>
          <p className="text-xl font-bold">{formatARS(totalARS)}</p>
          {blueSell > 0 && gastos.some((g) => g.moneda === 'USD') && (
            <p className="text-xs text-muted-foreground">
              USD convertidos al blue ({formatARS(blueSell)})
            </p>
          )}
        </div>
      </div>

      {modalAbierto && (
        <GastoFijoModal
          onClose={() => setModalAbierto(false)}
          onSuccess={handleCreado}
        />
      )}
    </div>
  )
}
