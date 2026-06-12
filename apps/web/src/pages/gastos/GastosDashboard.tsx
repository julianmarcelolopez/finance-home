import { useState } from 'react'
import { mesActual } from '@/lib/utils'
import { DetalleMes } from './DetalleMes'

type Subtab = 'mes-actual' | 'semestre'

export function GastosDashboard() {
  const [subtab, setSubtab] = useState<Subtab>('mes-actual')

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-border">
        {([
          { id: 'mes-actual', label: 'Mes actual' },
          { id: 'semestre',   label: 'Semestre' },
        ] as { id: Subtab; label: string }[]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSubtab(s.id)}
            className={`pb-2 text-sm transition-colors
              ${subtab === s.id
                ? 'border-b-2 border-foreground font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {subtab === 'mes-actual' && <DetalleMes mes={mesActual()} />}

      {subtab === 'semestre' && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
          <p className="text-muted-foreground text-sm">Semestre — próximamente</p>
        </div>
      )}
    </div>
  )
}
