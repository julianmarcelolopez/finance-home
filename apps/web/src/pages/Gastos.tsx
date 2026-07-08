import { useState } from 'react'
import { TarjetasTab } from './gastos/TarjetasTab'
import { GastosDashboard } from './gastos/GastosDashboard'
import { PrestamosTab } from './gastos/PrestamosTab'
import { MercadopagoTab } from './gastos/MercadopagoTab'
import { ResumenMensualTab } from './gastos/ResumenMensualTab'

type Tab = 'resumen' | 'dashboard' | 'mercadopago' | 'efectivo' | 'tarjetas' | 'prestamos'

const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen',     label: 'Resumen mensual' },
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'mercadopago', label: 'Mercadopago' },
  { id: 'efectivo',    label: 'Efectivo' },
  { id: 'tarjetas',    label: 'Tarjetas de crédito' },
  { id: 'prestamos',   label: 'Préstamos' },
]

function PlaceholderTab({ nombre }: { nombre: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
      <p className="text-muted-foreground text-sm">
        {nombre} — próximamente
      </p>
    </div>
  )
}

export default function Gastos() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
        <p className="text-muted-foreground">Seguimiento de consumos y tarjetas</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 text-sm transition-colors
              ${tab === t.id
                ? 'border-b-2 border-foreground font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen'     && <ResumenMensualTab />}
      {tab === 'dashboard'   && <GastosDashboard />}
      {tab === 'mercadopago' && <MercadopagoTab />}
      {tab === 'efectivo'    && <PlaceholderTab nombre="Efectivo" />}
      {tab === 'tarjetas'    && <TarjetasTab />}
      {tab === 'prestamos'   && <PrestamosTab />}
    </div>
  )
}
