import { useEffect, useState } from 'react'
import { Target, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { formatARS, formatUSD } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Proyecto } from '@financehome/shared'

const PRIORIDAD_COLOR: Record<string, 'default' | 'warning' | 'secondary'> = {
  alta: 'default',
  media: 'warning',
  baja: 'secondary',
}

function AporteModal({
  proyecto,
  onClose,
  onSuccess,
}: {
  proyecto: Proyecto
  onClose: () => void
  onSuccess: () => void
}) {
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAporte = async () => {
    const n = parseFloat(monto)
    if (!n || n <= 0) return
    setLoading(true)
    try {
      await api.proyectos.aporte(proyecto.id, n)
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-80 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold">Registrar aporte</h3>
        <p className="text-sm text-muted-foreground">{proyecto.nombre}</p>
        <Input
          type="number"
          placeholder={`Monto en ${proyecto.moneda}`}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleAporte} disabled={loading || !monto}>
            {loading ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Proyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [aporteTarget, setAporteTarget] = useState<Proyecto | null>(null)

  const cargar = () => {
    api.proyectos
      .listar()
      .then(setProyectos)
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const formatMonto = (p: Proyecto, valor: number) =>
    p.moneda === 'ARS' ? formatARS(valor) : formatUSD(valor)

  if (loading) return <div className="text-muted-foreground text-sm">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
          <p className="text-muted-foreground">Metas de ahorro e inversión</p>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      {proyectos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Sin proyectos aún</p>
            <p className="text-sm text-muted-foreground">
              Creá tu primera meta de ahorro para empezar a trackear el progreso
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proyectos.map((p) => {
            const pct = p.meta > 0 ? Math.min(100, Math.round((p.actual / p.meta) * 100)) : 0
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.nombre}</CardTitle>
                      {p.fecha_objetivo && (
                        <CardDescription>
                          Objetivo: {new Date(p.fecha_objetivo).toLocaleDateString('es-AR')}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={PRIORIDAD_COLOR[p.prioridad] ?? 'secondary'}>
                      {p.prioridad}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatMonto(p, p.actual)} de {formatMonto(p, p.meta)}
                    </span>
                    <span className="text-muted-foreground">
                      Faltan {formatMonto(p, p.meta - p.actual)}
                    </span>
                  </div>
                  {p.notas && <p className="text-xs text-muted-foreground">{p.notas}</p>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setAporteTarget(p)}
                  >
                    Registrar aporte
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {aporteTarget && (
        <AporteModal
          proyecto={aporteTarget}
          onClose={() => setAporteTarget(null)}
          onSuccess={cargar}
        />
      )}
    </div>
  )
}
