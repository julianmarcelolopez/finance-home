import { Router } from 'express'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabaseAdmin } from '../services/supabase'
import { getTipoCambio } from '../services/tipo-cambio'
import { DashboardResumen } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/dashboard/resumen:
 *   get:
 *     summary: Resumen financiero del mes en curso
 *     tags: [Dashboard]
 *     description: Retorna consumos de tarjeta, gastos fijos, proyectos activos, próximos vencimientos y tipo de cambio. Combina 5 queries en paralelo.
 *     responses:
 *       200:
 *         description: Resumen del mes actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResumen'
 */
router.get('/resumen', async (_req, res) => {
  try {
    const now = new Date()
    const mesActual = format(now, 'yyyy-MM')
    const inicioMes = format(startOfMonth(now), 'yyyy-MM-dd')
    const finMes = format(endOfMonth(now), 'yyyy-MM-dd')

    const [consumosRes, gastosFijosRes, resumenesRes, proyectosRes, tipoCambio] =
      await Promise.all([
        supabaseAdmin
          .from('consumos_tarjeta')
          .select('pesos, dolares')
          .gte('fecha', inicioMes)
          .lte('fecha', finMes),

        supabaseAdmin.from('gastos_fijos').select('monto, moneda').eq('activo', true),

        supabaseAdmin
          .from('resumenes_tarjeta')
          .select('*')
          .gte('vencimiento_actual', inicioMes)
          .lte('vencimiento_actual', finMes)
          .order('vencimiento_actual', { ascending: true }),

        supabaseAdmin
          .from('proyectos')
          .select('id', { count: 'exact', head: true }),

        getTipoCambio(),
      ])

    const totalConsumosPesos = consumosRes.data?.reduce((a, c) => a + (c.pesos ?? 0), 0) ?? 0
    const totalConsumosDolares = consumosRes.data?.reduce((a, c) => a + (c.dolares ?? 0), 0) ?? 0

    const gastosFijosARS =
      gastosFijosRes.data?.reduce((a, g) => {
        const monto = g.moneda === 'ARS' ? g.monto : g.monto * tipoCambio.blue.venta
        return a + monto
      }, 0) ?? 0

    const resumen: DashboardResumen = {
      mes_actual: mesActual,
      total_consumos_pesos: totalConsumosPesos,
      total_consumos_dolares: totalConsumosDolares,
      gastos_fijos_mes_ars: gastosFijosARS,
      proyectos_activos: proyectosRes.count ?? 0,
      proximos_vencimientos: resumenesRes.data ?? [],
      tipo_cambio: tipoCambio,
    }

    res.json(resumen)
  } catch (error) {
    console.error('/dashboard/resumen:', error)
    res.status(500).json({ error: 'Error al obtener resumen del dashboard' })
  }
})

export default router
