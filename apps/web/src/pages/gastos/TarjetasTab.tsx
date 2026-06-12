import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { NuevaTarjetaModal } from './NuevaTarjetaModal'
import { TarjetaResumenes } from './TarjetaResumenes'
import { TarjetaConsumos } from './TarjetaConsumos'
import type { Tarjeta } from '@financehome/shared'

const MARCA_COLOR: Record<string, string> = {
  Visa:       'bg-blue-500/15 text-blue-400',
  Mastercard: 'bg-red-500/15 text-red-400',
  Amex:       'bg-emerald-500/15 text-emerald-400',
}

function TarjetaChip({
  tarjeta,
  activa,
  onClick,
}: {
  tarjeta: Tarjeta
  activa: boolean
  onClick: () => void
}) {
  const color = MARCA_COLOR[tarjeta.marca] ?? 'bg-muted text-muted-foreground'
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors w-full
        ${activa ? 'border-foreground/60 bg-muted/40' : 'border-border hover:border-foreground/30 hover:bg-muted/20'}`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${color}`}>
        {tarjeta.marca.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{tarjeta.marca} {tarjeta.banco}</p>
        <p className="text-xs text-muted-foreground truncate">
          {tarjeta.titular} · ···{tarjeta.nro_cuenta.slice(-4)}
        </p>
      </div>
    </button>
  )
}

type Subtab = 'resumenes' | 'consumos'

export function TarjetasTab() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [seleccionada, setSeleccionada] = useState<Tarjeta | null>(null)
  const [subtab, setSubtab] = useState<Subtab>('resumenes')
  const [selectedResumenId, setSelectedResumenId] = useState<string | undefined>()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.tarjetas
      .listar()
      .then((data) => {
        setTarjetas(data)
        if (data.length > 0) setSeleccionada(data[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleTarjetaCreada = (nueva: Tarjeta) => {
    setTarjetas((prev) => [...prev, nueva])
    setSeleccionada(nueva)
    setModalAbierto(false)
  }

  const handleSelectResumen = (resumenId: string) => {
    setSelectedResumenId(resumenId)
    setSubtab('consumos')
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando tarjetas...</p>
  }

  return (
    <div className="space-y-5">
      {/* Grilla de chips */}
      <div className="grid grid-cols-3 gap-3">
        {tarjetas.map((t) => (
          <TarjetaChip
            key={t.id}
            tarjeta={t}
            activa={seleccionada?.id === t.id}
            onClick={() => { setSeleccionada(t); setSelectedResumenId(undefined); setSubtab('resumenes') }}
          />
        ))}
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva tarjeta
        </button>
      </div>

      {/* Detalle de tarjeta seleccionada */}
      {seleccionada ? (
        <div className="space-y-4">
          {/* Subtabs */}
          <div className="flex gap-6 border-b border-border">
            {(['resumenes', 'consumos'] as Subtab[]).map((s) => (
              <button
                key={s}
                onClick={() => { setSubtab(s); if (s === 'resumenes') setSelectedResumenId(undefined) }}
                className={`pb-2 text-sm capitalize transition-colors
                  ${subtab === s
                    ? 'border-b-2 border-foreground font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {s === 'resumenes' ? 'Resúmenes' : 'Consumos'}
              </button>
            ))}
          </div>

          {subtab === 'resumenes' && <TarjetaResumenes tarjeta={seleccionada} onSelectResumen={handleSelectResumen} />}
          {subtab === 'consumos'  && <TarjetaConsumos  tarjeta={seleccionada} resumenId={selectedResumenId} />}
        </div>
      ) : (
        tarjetas.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aún no tenés tarjetas registradas. Agregá la primera con el botón de arriba.
          </p>
        )
      )}

      {modalAbierto && (
        <NuevaTarjetaModal
          onClose={() => setModalAbierto(false)}
          onSuccess={handleTarjetaCreada}
        />
      )}
    </div>
  )
}
