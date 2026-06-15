import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatARS } from '@/lib/utils'
import type { Prestamo, CuotaPrestamo, Moneda, Persona } from '@financehome/shared'

// ---- Helpers ----

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function proximaCuotaPendiente(cuotas: CuotaPrestamo[]): CuotaPrestamo | undefined {
  return [...cuotas]
    .sort((a, b) => a.numero_cuota - b.numero_cuota)
    .find((c) => !c.pagada)
}

const PERSONA_COLOR: Record<string, string> = {
  Julian:     'bg-blue-500/15 text-blue-400',
  Patricia:   'bg-violet-500/15 text-violet-400',
  Compartido: 'bg-amber-500/15 text-amber-400',
}

// ---- Cronograma de cuotas ----

function CronogramaPanel({
  prestamo,
  onCuotaPagada,
}: {
  prestamo: Prestamo
  onCuotaPagada: (cuotaId: string, pagada: boolean) => void
}) {
  const [loading, setLoading] = useState(!prestamo.cuotas)
  const [cuotas, setCuotas] = useState<CuotaPrestamo[]>(prestamo.cuotas ?? [])
  const [pagando, setPagando] = useState<string | null>(null)

  useEffect(() => {
    if (prestamo.cuotas) return
    api.prestamos.obtener(prestamo.id).then((p) => {
      setCuotas(p.cuotas ?? [])
      setLoading(false)
    })
  }, [prestamo.id, prestamo.cuotas])

  const handleTogglePagada = async (cuota: CuotaPrestamo) => {
    setPagando(cuota.id)
    try {
      const actualizada = await api.prestamos.actualizarCuota(prestamo.id, cuota.id, {
        pagada: !cuota.pagada,
      })
      setCuotas((prev) => prev.map((c) => (c.id === cuota.id ? actualizada : c)))
      onCuotaPagada(cuota.id, !cuota.pagada)
    } finally {
      setPagando(null)
    }
  }

  const tieneDesglose = cuotas.some(
    (c) => c.interes_nominal !== null || c.amortizacion !== null,
  )

  if (loading) {
    return <p className="text-xs text-muted-foreground py-3 px-4">Cargando cuotas...</p>
  }

  return (
    <div className="border-t border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">#</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Vencimiento</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Monto</th>
            {tieneDesglose && (
              <>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Interés</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Amortiz.</th>
              </>
            )}
            <th className="text-center px-4 py-2 font-medium text-muted-foreground text-xs">Estado</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cuotas.map((c) => (
            <tr
              key={c.id}
              className={c.pagada ? 'opacity-50' : 'hover:bg-muted/20 transition-colors'}
            >
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{c.numero_cuota}</td>
              <td className="px-4 py-2.5 tabular-nums">{formatFecha(c.fecha_vencimiento)}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                {formatARS(c.monto_total)}
              </td>
              {tieneDesglose && (
                <>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums text-xs">
                    {c.interes_nominal !== null ? formatARS(c.interes_nominal) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums text-xs">
                    {c.amortizacion !== null ? formatARS(c.amortizacion) : '—'}
                  </td>
                </>
              )}
              <td className="px-4 py-2.5 text-center">
                {c.pagada ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                    <Check className="h-3 w-3" /> Pagada
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Pendiente</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  onClick={() => handleTogglePagada(c)}
                  disabled={pagando === c.id}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {pagando === c.id ? '...' : c.pagada ? 'Desmarcar' : 'Marcar pagada'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Tarjeta de préstamo ----

function PrestamoCard({
  prestamo,
  expandido,
  onToggle,
  onCuotaPagada,
}: {
  prestamo: Prestamo
  expandido: boolean
  onToggle: () => void
  onCuotaPagada: (cuotaId: string, pagada: boolean) => void
}) {
  const proxima = prestamo.cuotas ? proximaCuotaPendiente(prestamo.cuotas) : undefined
  const totalCuotas = prestamo.cuotas?.length ?? '?'
  const pagadas = prestamo.cuotas?.filter((c) => c.pagada).length ?? 0
  const cuotaActual = pagadas + 1

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Indicador tipo */}
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              {prestamo.tipo.slice(0, 3).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">
                {prestamo.banco} · {prestamo.tipo}
              </p>
              <Badge
                variant="secondary"
                className={`text-xs ${PERSONA_COLOR[prestamo.persona] ?? ''}`}
              >
                {prestamo.persona}
              </Badge>
              {prestamo.moneda !== 'ARS' && (
                <Badge variant="outline" className="text-xs">{prestamo.moneda}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cuota {cuotaActual} de {totalCuotas}
              {proxima && ` · vence ${formatFecha(proxima.fecha_vencimiento)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {/* Capital adeudado */}
          {prestamo.capital_adeudado !== null && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Capital adeudado</p>
              <p className="text-sm font-medium">{formatARS(prestamo.capital_adeudado)}</p>
            </div>
          )}

          {/* Próxima cuota */}
          {proxima && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Próxima cuota</p>
              <p className="text-base font-bold">{formatARS(proxima.monto_total)}</p>
            </div>
          )}

          {/* Expandir */}
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="hidden sm:inline">{expandido ? 'Ocultar' : 'Ver cuotas'}</span>
          </button>
        </div>
      </div>

      {/* Cronograma */}
      {expandido && (
        <CronogramaPanel prestamo={prestamo} onCuotaPagada={onCuotaPagada} />
      )}
    </div>
  )
}

// ---- Modal nuevo préstamo ----

type CuotaForm = {
  fecha_vencimiento: string
  monto_total: string
  pagada: boolean
}

type PrestamoForm = {
  numero: string
  banco: string
  tipo: string
  tasa: string
  sistema_amortizacion: string
  monto_solicitado: string
  capital_adeudado: string
  moneda: Moneda
  persona: Persona
  cuenta_debito: string
}

const FORM_INICIAL: PrestamoForm = {
  numero: '',
  banco: '',
  tipo: 'Personal',
  tasa: '',
  sistema_amortizacion: 'Francés',
  monto_solicitado: '',
  capital_adeudado: '',
  moneda: 'ARS',
  persona: 'Julian',
  cuenta_debito: '',
}

const TIPOS = ['Personal', 'Prendario', 'Hipotecario', 'Comercial', 'Otro']
const SISTEMAS = ['Francés', 'Alemán', 'UVA', 'Otro']

function NuevoPrestamoModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (prestamo: Prestamo) => void
}) {
  const [form, setForm] = useState<PrestamoForm>(FORM_INICIAL)
  const [cuotas, setCuotas] = useState<CuotaForm[]>([
    { fecha_vencimiento: '', monto_total: '', pagada: false },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setF = (field: keyof PrestamoForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setCuota = (i: number, field: keyof CuotaForm, value: string | boolean) =>
    setCuotas((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))

  const agregarCuota = () =>
    setCuotas((prev) => [...prev, { fecha_vencimiento: '', monto_total: '', pagada: false }])

  const eliminarCuota = (i: number) =>
    setCuotas((prev) => prev.filter((_, idx) => idx !== i))

  const puedeGuardar =
    form.banco.trim() !== '' &&
    form.tipo.trim() !== '' &&
    parseFloat(form.monto_solicitado) > 0 &&
    cuotas.length > 0 &&
    cuotas.every((c) => c.fecha_vencimiento !== '' && parseFloat(c.monto_total) > 0)

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const result = await api.prestamos.crear({
        prestamo: {
          numero: form.numero || `SIN-NUM-${Date.now()}`,
          banco: form.banco.trim(),
          tipo: form.tipo.trim(),
          tasa: form.tasa ? parseFloat(form.tasa) : undefined,
          sistema_amortizacion: form.sistema_amortizacion || undefined,
          monto_solicitado: parseFloat(form.monto_solicitado),
          capital_adeudado: form.capital_adeudado ? parseFloat(form.capital_adeudado) : undefined,
          moneda: form.moneda,
          persona: form.persona,
          cuenta_debito: form.cuenta_debito.trim() || undefined,
        },
        cuotas: cuotas.map((c, i) => ({
          numero_cuota: i + 1,
          fecha_vencimiento: c.fecha_vencimiento,
          monto_total: parseFloat(c.monto_total),
          pagada: c.pagada,
        })),
      })
      onSuccess(result.prestamo)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg p-6 w-[640px] space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-base">Nuevo préstamo</h3>

        {/* ---- Datos del préstamo ---- */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Datos del préstamo
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Banco</label>
              <Input
                placeholder="ej: Galicia, Santander"
                value={form.banco}
                onChange={(e) => setF('banco', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Número <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="ej: 808128032344"
                value={form.numero}
                onChange={(e) => setF('numero', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={form.tipo} onValueChange={(v) => setF('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Persona</label>
              <Select value={form.persona} onValueChange={(v) => setF('persona', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Julian">Julian</SelectItem>
                  <SelectItem value="Patricia">Patricia</SelectItem>
                  <SelectItem value="Compartido">Compartido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Moneda</label>
              <Select value={form.moneda} onValueChange={(v) => setF('moneda', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UVA">UVA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monto solicitado</label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.monto_solicitado}
                onChange={(e) => setF('monto_solicitado', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Capital adeudado <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.capital_adeudado}
                onChange={(e) => setF('capital_adeudado', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tasa % <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                min={0}
                placeholder="ej: 54"
                value={form.tasa}
                onChange={(e) => setF('tasa', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Sistema amortización <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Select value={form.sistema_amortizacion} onValueChange={(v) => setF('sistema_amortizacion', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SISTEMAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Cuenta débito <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="ej: CA $ N° 4041144-2 236-1"
                value={form.cuenta_debito}
                onChange={(e) => setF('cuenta_debito', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ---- Cuotas ---- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cuotas ({cuotas.length})
            </p>
            <button
              type="button"
              onClick={agregarCuota}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3 w-3" /> Agregar cuota
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Vencimiento</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Monto</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Pagada</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cuotas.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={c.fecha_vencimiento}
                        onChange={(e) => setCuota(i, 'fecha_vencimiento', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="h-7 text-xs"
                        value={c.monto_total}
                        onChange={(e) => setCuota(i, 'monto_total', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={c.pagada}
                        onChange={(e) => setCuota(i, 'pagada', e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {cuotas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarCuota(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

// ---- Tab principal ----

export function PrestamosTab() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    api.prestamos.listar().then(setPrestamos).finally(() => setLoading(false))
  }, [])

  const handleToggle = (id: string) =>
    setExpandido((prev) => (prev === id ? null : id))

  const handleCreado = (nuevo: Prestamo) => {
    setPrestamos((prev) => [nuevo, ...prev])
    setModalAbierto(false)
    setExpandido(nuevo.id)
  }

  const handleCuotaPagada = (prestamoId: string, _cuotaId: string, _pagada: boolean) => {
    // fuerza re-render del card para recalcular cuota actual
    setPrestamos((prev) => [...prev])
    // si el prestamo tiene cuotas cacheadas en estado, las refrescamos
    setPrestamos((prev) =>
      prev.map((p) => {
        if (p.id !== prestamoId || !p.cuotas) return p
        return p
      }),
    )
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando préstamos...</p>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {prestamos.length === 0
            ? 'Sin préstamos activos'
            : `${prestamos.length} préstamo${prestamos.length !== 1 ? 's' : ''} activo${prestamos.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo préstamo
        </Button>
      </div>

      {/* Lista */}
      {prestamos.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay préstamos registrados. Agregá el primero con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prestamos.map((p) => (
            <PrestamoCard
              key={p.id}
              prestamo={p}
              expandido={expandido === p.id}
              onToggle={() => handleToggle(p.id)}
              onCuotaPagada={(cuotaId, pagada) => handleCuotaPagada(p.id, cuotaId, pagada)}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <NuevoPrestamoModal
          onClose={() => setModalAbierto(false)}
          onSuccess={handleCreado}
        />
      )}
    </div>
  )
}
