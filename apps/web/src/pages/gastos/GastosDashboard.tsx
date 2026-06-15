import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { mesActual, formatMes } from '@/lib/utils'
import { DetalleMes } from './DetalleMes'
import { TablaSemestre } from './TablaSemestre'

type Subtab = 'mes-actual' | 'semestre-1' | 'semestre-2'

function agregarMeses(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1 + delta, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

export function GastosDashboard() {
  const [subtab, setSubtab] = useState<Subtab>('mes-actual')
  const [mes, setMes] = useState(mesActual())

  const esActual = mes === mesActual()

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-border">
        {([
          { id: 'mes-actual',  label: 'Mes actual' },
          { id: 'semestre-1',  label: 'Semestre 1' },
          { id: 'semestre-2',  label: 'Semestre 2' },
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

      {subtab === 'mes-actual' && (
        <div className="space-y-5">
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

          <DetalleMes mes={mes} />
        </div>
      )}

      {subtab === 'semestre-1' && <TablaSemestre semestre={1} />}
      {subtab === 'semestre-2' && <TablaSemestre semestre={2} />}
    </div>
  )
}
