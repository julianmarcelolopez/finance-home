import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Categoria, ComercioCategoria } from '@financehome/shared'

// ---- Modal nueva categoría ----

function CategoriaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (cat: Categoria) => void
}) {
  const [form, setForm] = useState({ nombre: '', color: '#6b7280', icono: 'tag' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const puedeGuardar = form.nombre.trim() !== '' && form.icono.trim() !== ''

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const nueva = await api.etiquetas.crear(form)
      onSuccess(nueva)
    } catch {
      setError('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-[400px] space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-base">Nueva categoría</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            placeholder="ej: Deporte, Mascotas"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5"
              />
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ícono</label>
            <Input
              placeholder="ej: dumbbell, heart"
              value={form.icono}
              onChange={(e) => setForm((f) => ({ ...f, icono: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Nombre de ícono lucide-react</p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={!puedeGuardar || loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Modal nuevo patrón ----

function PatronModal({
  categorias,
  onClose,
  onSuccess,
}: {
  categorias: Categoria[]
  onClose: () => void
  onSuccess: (patron: ComercioCategoria, afectados: number) => void
}) {
  const [form, setForm] = useState({ patron: '', categoria_id: '', es_fijo: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const puedeGuardar = form.patron.trim() !== '' && form.categoria_id !== ''

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const { patron, afectados } = await api.etiquetas.patrones.crear({
        patron: form.patron.trim().toUpperCase(),
        categoria_id: form.categoria_id,
        es_fijo: form.es_fijo,
      })
      onSuccess(patron, afectados)
    } catch {
      setError('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-[400px] space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-base">Nuevo patrón</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Patrón</label>
          <Input
            placeholder="ej: SPORTCLU, NETFLIX, FARMACITY"
            value={form.patron}
            onChange={(e) => setForm((f) => ({ ...f, patron: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Se busca con ILIKE — "SPORT" matchea "SPORTCLUB 02 26"
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categoría</label>
          <Select value={form.categoria_id} onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                    {c.nombre}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Gasto fijo</p>
            <p className="text-xs text-muted-foreground">Ocurre todos los meses</p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, es_fijo: !f.es_fijo }))}
            className={`w-10 h-5 rounded-full transition-colors relative ${form.es_fijo ? 'bg-blue-500' : 'bg-muted'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.es_fijo ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={!puedeGuardar || loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Page ----

type Tab = 'categorias' | 'patrones'

export default function Etiquetas() {
  const [tab, setTab] = useState<Tab>('categorias')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [patrones, setPatrones] = useState<ComercioCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCat, setModalCat] = useState(false)
  const [modalPat, setModalPat] = useState(false)
  const [afectadosMsj, setAfectadosMsj] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.etiquetas.listar(), api.etiquetas.patrones.listar()])
      .then(([cats, pats]) => {
        setCategorias(cats)
        setPatrones(pats)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCategoriaCreada = (cat: Categoria) => {
    setCategorias((prev) => [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setModalCat(false)
  }

  const handlePatronCreado = (patron: ComercioCategoria, afectados: number) => {
    setPatrones((prev) => [patron, ...prev])
    setModalPat(false)
    const msj = afectados > 0
      ? `Patrón creado. ${afectados} consumo${afectados !== 1 ? 's' : ''} categorizado${afectados !== 1 ? 's' : ''} automáticamente.`
      : 'Patrón creado. No había consumos sin categoría para actualizar.'
    setAfectadosMsj(msj)
    setTimeout(() => setAfectadosMsj(null), 5000)
  }

  const handleEliminarPatron = async (id: string) => {
    await api.etiquetas.patrones.eliminar(id)
    setPatrones((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Etiquetas</h2>
        <p className="text-muted-foreground text-sm">Gestión de categorías y patrones de autoetiquetado</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        {(['categorias', 'patrones'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm transition-colors capitalize ${
              tab === t
                ? 'border-b-2 border-foreground font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'categorias' ? 'Categorías' : 'Patrones'}
          </button>
        ))}
      </div>

      {/* Notificación backfill */}
      {afectadosMsj && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2.5 rounded-md">
          {afectadosMsj}
        </div>
      )}

      {/* Tab Categorías */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setModalCat(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva categoría
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Color</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ícono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categorias.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="w-4 h-4 rounded-full inline-block border border-border"
                        style={{ backgroundColor: c.color }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.icono}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Patrones */}
      {tab === 'patrones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setModalPat(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo patrón
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patrón</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patrones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground py-10">
                      No hay patrones cargados
                    </td>
                  </tr>
                ) : (
                  patrones.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{p.patron}</td>
                      <td className="px-4 py-3">
                        {p.categorias ? (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: p.categorias.color }}
                            />
                            {p.categorias.nombre}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.es_fijo
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {p.es_fijo ? 'Fijo' : 'Variable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEliminarPatron(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalCat && (
        <CategoriaModal onClose={() => setModalCat(false)} onSuccess={handleCategoriaCreada} />
      )}
      {modalPat && (
        <PatronModal
          categorias={categorias}
          onClose={() => setModalPat(false)}
          onSuccess={handlePatronCreado}
        />
      )}
    </div>
  )
}
