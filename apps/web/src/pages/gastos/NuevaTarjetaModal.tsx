import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tarjeta } from '@financehome/shared'

const BANCOS = ['Galicia', 'Santander', 'BBVA', 'ICBC', 'Naranja X']
const MARCAS = ['Visa', 'Mastercard', 'Amex']
const TITULARES = ['Julian', 'Patricia']

export function NuevaTarjetaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (tarjeta: Tarjeta) => void
}) {
  const [banco, setBanco] = useState('')
  const [marca, setMarca] = useState('')
  const [nroCuenta, setNroCuenta] = useState('')
  const [nroSocio, setNroSocio] = useState('')
  const [titular, setTitular] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNroCuenta = (value: string) => {
    setNroCuenta(value.replace(/\D/g, ''))
  }

  const handleNroSocio = (value: string) => {
    setNroSocio(value.replace(/-/g, '').replace(/\D/g, ''))
  }

  const puedeGuardar = banco && marca && nroCuenta.length > 0 && nroSocio.length > 0 && titular

  const handleGuardar = async () => {
    if (!puedeGuardar) return
    setLoading(true)
    setError('')
    try {
      const nueva = await api.tarjetas.crear({
        banco,
        marca,
        nro_cuenta: nroCuenta,
        nro_socio: nroSocio,
        titular,
      })
      onSuccess(nueva)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al guardar la tarjeta')
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
        className="bg-background rounded-lg p-6 w-[420px] space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-base">Nueva tarjeta de crédito</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Banco</label>
            <Select value={banco} onValueChange={setBanco}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná..." />
              </SelectTrigger>
              <SelectContent>
                {BANCOS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Producto</label>
            <Select value={marca} onValueChange={setMarca}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná..." />
              </SelectTrigger>
              <SelectContent>
                {MARCAS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Número de cuenta</label>
          <Input
            placeholder="ej: 001747133"
            value={nroCuenta}
            onChange={(e) => handleNroCuenta(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Los dígitos que identifican la cuenta (se muestra en el chip)
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Número de socio</label>
          <Input
            placeholder="ej: 015-001747133-0-0"
            value={nroSocio}
            onChange={(e) => handleNroSocio(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Del encabezado del resumen PDF — con o sin guiones
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Titular</label>
          <Select value={titular} onValueChange={setTitular}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná..." />
            </SelectTrigger>
            <SelectContent>
              {TITULARES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
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
            {loading ? 'Guardando...' : 'Guardar tarjeta'}
          </Button>
        </div>
      </div>
    </div>
  )
}
