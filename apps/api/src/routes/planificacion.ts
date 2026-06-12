import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import { getTipoCambio } from '../services/tipo-cambio'
import { FlujoCajaMes } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/planificacion/{año}:
 *   get:
 *     summary: Flujo de caja mensual del año
 *     tags: [Planificación]
 *     description: Retorna 12 filas (una por mes) con ingresos reales, gastos fijos activos y gastos variables (consumos de tarjeta). Los fijos en USD se convierten al tipo de cambio blue actual.
 *     parameters:
 *       - in: path
 *         name: año
 *         required: true
 *         schema: { type: integer, example: 2026 }
 *     responses:
 *       200:
 *         description: Array de 12 meses con flujo de caja
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/FlujoCajaMes' }
 *       400:
 *         description: Año inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:año', async (req, res) => {
  try {
    const año = parseInt(req.params.año)
    if (isNaN(año) || año < 2020 || año > 2100) {
      res.status(400).json({ error: 'Año inválido' })
      return
    }

    const [gastosFijosRes, ingresosRes, consumosHistRes, tipoCambio] = await Promise.all([
      supabaseAdmin.from('gastos_fijos').select('*').eq('activo', true),
      supabaseAdmin
        .from('ingresos')
        .select('*')
        .gte('fecha', `${año}-01-01`)
        .lte('fecha', `${año}-12-31`),
      supabaseAdmin
        .from('consumos_tarjeta')
        .select('pesos, fecha')
        .gte('fecha', `${año}-01-01`)
        .lte('fecha', `${año}-12-31`),
      getTipoCambio(),
    ])

    const gastosFijos = gastosFijosRes.data ?? []
    const ingresos = ingresosRes.data ?? []
    const consumos = consumosHistRes.data ?? []

    const flujo: FlujoCajaMes[] = []
    let saldoAcumulado = 0

    for (let mes = 1; mes <= 12; mes++) {
      const mesStr = `${año}-${String(mes).padStart(2, '0')}`
      const inicioMes = new Date(`${mesStr}-01`)

      const gastosFijosMes = gastosFijos
        .filter((g) => {
          const inicio = new Date(g.fecha_inicio)
          const fin = g.fecha_fin ? new Date(g.fecha_fin) : new Date('2099-12-31')
          return inicioMes >= inicio && inicioMes <= fin
        })
        .reduce((acc, g) => {
          const monto = g.moneda === 'ARS' ? g.monto : g.monto * tipoCambio.blue.venta
          return acc + monto
        }, 0)

      const ingresosMes = ingresos
        .filter((i) => i.fecha.startsWith(mesStr))
        .reduce((acc, i) => {
          const monto = i.moneda === 'ARS' ? i.monto : i.monto * tipoCambio.blue.venta
          return acc + monto
        }, 0)

      const gastoVariablesMes = consumos
        .filter((c) => c.fecha.startsWith(mesStr))
        .reduce((acc, c) => acc + (c.pesos ?? 0), 0)

      const saldo = ingresosMes - gastosFijosMes - gastoVariablesMes
      saldoAcumulado += saldo

      flujo.push({
        mes: mesStr,
        ingresos: ingresosMes,
        gastos_fijos: gastosFijosMes,
        gastos_variables: gastoVariablesMes,
        saldo,
        saldo_acumulado: saldoAcumulado,
      })
    }

    res.json(flujo)
  } catch (error) {
    console.error('/planificacion:', error)
    res.status(500).json({ error: 'Error al calcular planificación' })
  }
})

export default router
