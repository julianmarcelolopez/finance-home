import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatARS, formatUSD } from '@/lib/utils'
import type { Ingreso, IngresoCreate } from '@financehome/shared'

// ---- Modal ----

const TIPOS: { value: IngresoCreate['tipo']; label: string }[] = [
  { value: 'sueldo', label: 'Sueldo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'renta', label: 'Renta' },
  { value: 'otro', label: 'Otro' },
]

function IngresoModal({
  ingreso,
  onClose,
  onSuccess,
}: {
  ingreso: Ingreso | null
  onClose: () => void
  onSuccess: (ingreso: Ingreso) => void
}) {
  const [form, setForm] = useState<IngresoCreate>(
    ingreso
      ? {
          descripcion: ingreso.descripcion,
          monto: ingreso.monto,
          moneda: ingreso.moneda as 'ARS' | 'USD',
          persona: ingreso.persona,
          tipo: ingreso.tipo,
          fecha: ingreso.fecha,
        }
      : {
          descripcion: '',
          monto: 0,
          moneda: 'ARS',
          persona: 'Julian',
          tipo: 'sueldo',
          fecha: new Date().toISOString().slice(0, 10),
        },
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof IngresoCreate, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const puedeGuardar = form.descripcion.trim() !== '' && form.monto > 0 && form.fecha !== ''

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const resultado = ingreso
        ? await api.ingresos.actualizar(ingreso.id, form)
        : await api.ingresos.crear(form)
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
          {ingreso ? 'Editar ingreso' : 'Nuevo ingreso'}
        </h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            placeholder="ej: Sueldo junio, Proyecto X"
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
            <label className="text-sm font-medium">Tipo</label>
            <Select value={form.tipo} onValueChange={(v) => set('tipo', v as IngresoCreate['tipo'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha</label>
          <Input
            type="date"
            value={form.fecha}
            onChange={(e) => set('fecha', e.target.value)}
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

function agruparPorMes(ingresos: Ingreso[]) {
  const map = new Map<string, Ingreso[]>()
  for (const ing of ingresos) {
    const mes = ing.fecha.substring(0, 7)
    if (!map.has(mes)) map.set(mes, [])
    map.get(mes)!.push(ing)
  }
  return map
}

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Ingreso | null>(null)

  useEffect(() => {
    api.ingresos.listar().then(setIngresos).finally(() => setLoading(false))
  }, [])

  const porMes = agruparPorMes(ingresos)
  const meses = Array.from(porMes.keys()).sort((a, b) => b.localeCompare(a))

  const handleEliminar = async (ingreso: Ingreso) => {
    if (!confirm(`¿Eliminar "${ingreso.descripcion}"?`)) return
    await api.ingresos.eliminar(ingreso.id)
    setIngresos((prev) => prev.filter((i) => i.id !== ingreso.id))
  }

  const handleSuccess = (resultado: Ingreso) => {
    setIngresos((prev) => {
      const existe = prev.find((i) => i.id === resultado.id)
      if (existe) return prev.map((i) => (i.id === resultado.id ? resultado : i))
      return [resultado, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha))
    })
    setModalOpen(false)
    setEditando(null)
  }

  const abrirEdicion = (ingreso: Ingreso) => {
    setEditando(ingreso)
    setModalOpen(true)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setEditando(null)
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ingresos</h2>
          <p className="text-muted-foreground text-sm">Sueldos, freelance y otras entradas</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo ingreso
        </Button>
      </div>

      {meses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay ingresos registrados.
        </p>
      ) : (
        meses.map((mes) => {
          const items = porMes.get(mes)!
          const totalARS = items.filter((i) => i.moneda === 'ARS').reduce((a, i) => a + i.monto, 0)
          const totalUSD = items.filter((i) => i.moneda === 'USD').reduce((a, i) => a + i.monto, 0)
          const label = format(parseISO(`${mes}-01`), 'MMMM yyyy', { locale: es })

          return (
            <div key={mes} className="space-y-2">
              <div className="flex items-baseline justify-between border-b pb-1">
                <h3 className="text-sm font-semibold capitalize">{label}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {totalARS > 0 && <span>{formatARS(totalARS)}</span>}
                  {totalUSD > 0 && <span>{formatUSD(totalUSD)}</span>}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {items.map((ing) => (
                      <tr key={ing.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground w-28">
                          {format(parseISO(ing.fecha), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 font-medium">{ing.descripcion}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ing.persona}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{ing.tipo}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {ing.moneda === 'ARS' ? formatARS(ing.monto) : formatUSD(ing.monto)}
                        </td>
                        <td className="px-4 py-3 w-16">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => abrirEdicion(ing)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEliminar(ing)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}

      {modalOpen && (
        <IngresoModal ingreso={editando} onClose={cerrarModal} onSuccess={handleSuccess} />
      )}
    </div>
  )
}
