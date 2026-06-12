import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import type { DetalleMes, ResumenOrigen, ResumenCategoriaMes, Top5Consumo, ConsumoMes, ResumenSemestral } from '@finance-home/shared'

const router = Router()

/**
 * @openapi
 * /api/gastos-dashboard/mes:
 *   get:
 *     summary: Detalle completo de gastos de un mes (todas las fuentes)
 *     tags: [GastosDashboard]
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema: { type: string, example: '2026-06' }
 *         description: Mes en formato YYYY-MM
 *     responses:
 *       200:
 *         description: Detalle del mes con totales, categorías, top 5 y consumos completos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DetalleMes' }
 *       400:
 *         description: Parámetro mes inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/mes', async (req, res) => {
  try {
    const { mes } = req.query as { mes?: string }

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ error: 'Parámetro mes requerido en formato YYYY-MM' })
      return
    }

    const [year, month] = mes.split('-')
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const desde = `${year}-${month}-01`
    const hasta = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    // Filtramos por vencimiento_actual del resumen, no por fecha de la transacción.
    // Un consumo "pertenece" al mes en que hay que pagarlo, no en que se realizó.
    const { data: rows, error } = await supabaseAdmin
      .from('consumos_tarjeta')
      .select(`
        id, fecha, referencia, pesos, dolares, adicional, es_fijo, categoria_id,
        resumenes_tarjeta!inner(banco, marca_tarjeta, titular, vencimiento_actual),
        categorias(nombre, color)
      `)
      .gte('resumenes_tarjeta.vencimiento_actual', desde)
      .lte('resumenes_tarjeta.vencimiento_actual', hasta)
      .order('fecha', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const consumosRaw = (rows ?? []) as Array<{
      id: string
      fecha: string
      referencia: string
      pesos: number
      dolares: number
      adicional: boolean
      es_fijo: boolean
      categoria_id: string | null
      resumenes_tarjeta: { banco: string; marca_tarjeta: string; titular: string; vencimiento_actual: string }
      categorias: { nombre: string; color: string } | null
    }>

    // Totales globales
    const total_pesos = consumosRaw.reduce((s, c) => s + (c.pesos ?? 0), 0)
    const total_dolares = consumosRaw.reduce((s, c) => s + (c.dolares ?? 0), 0)
    const fijos_pesos = consumosRaw.filter(c => c.es_fijo).reduce((s, c) => s + (c.pesos ?? 0), 0)
    const variables_pesos = consumosRaw.filter(c => !c.es_fijo).reduce((s, c) => s + (c.pesos ?? 0), 0)

    // Por origen: agrupado por "banco — titular" (solo tarjetas por ahora)
    const origenMap = new Map<string, { pesos: number; dolares: number }>()
    for (const c of consumosRaw) {
      const { banco, marca_tarjeta, titular } = c.resumenes_tarjeta
      const nombre = `${marca_tarjeta} ${banco} — ${titular}`
      const prev = origenMap.get(nombre) ?? { pesos: 0, dolares: 0 }
      origenMap.set(nombre, {
        pesos: prev.pesos + (c.pesos ?? 0),
        dolares: prev.dolares + (c.dolares ?? 0),
      })
    }
    const por_origen: ResumenOrigen[] = Array.from(origenMap.entries())
      .map(([nombre, { pesos, dolares }]) => ({ nombre, pesos, dolares, disponible: true }))
      .sort((a, b) => b.pesos - a.pesos)

    // Orígenes pendientes (fuentes no implementadas)
    por_origen.push(
      { nombre: 'Mercadopago Julian', pesos: 0, dolares: 0, disponible: false },
      { nombre: 'Mercadopago Patricia', pesos: 0, dolares: 0, disponible: false },
      { nombre: 'Efectivo', pesos: 0, dolares: 0, disponible: false },
    )

    // Por categoría
    const catMap = new Map<string, { nombre: string; color: string; monto: number }>()
    for (const c of consumosRaw) {
      const key = c.categoria_id ?? '__sin_categoria__'
      const nombre = c.categorias?.nombre ?? 'Sin categoría'
      const color = c.categorias?.color ?? '#6b7280'
      const prev = catMap.get(key) ?? { nombre, color, monto: 0 }
      catMap.set(key, { nombre, color, monto: prev.monto + (c.pesos ?? 0) })
    }
    const por_categoria: ResumenCategoriaMes[] = Array.from(catMap.values())
      .map(({ nombre, color, monto }) => ({
        nombre,
        color,
        monto,
        porcentaje: total_pesos > 0 ? Math.round((monto / total_pesos) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.monto - a.monto)

    // Top 5
    const top5: Top5Consumo[] = [...consumosRaw]
      .sort((a, b) => b.pesos - a.pesos)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        fecha: c.fecha,
        referencia: c.referencia,
        pesos: c.pesos,
        dolares: c.dolares,
        origen: `${c.resumenes_tarjeta.marca_tarjeta} ${c.resumenes_tarjeta.banco} — ${c.resumenes_tarjeta.titular}`,
        adicional: c.adicional,
      }))

    // Tabla completa
    const consumos: ConsumoMes[] = consumosRaw.map(c => ({
      id: c.id,
      fecha: c.fecha,
      referencia: c.referencia,
      pesos: c.pesos,
      dolares: c.dolares,
      origen: `${c.resumenes_tarjeta.marca_tarjeta} ${c.resumenes_tarjeta.banco} — ${c.resumenes_tarjeta.titular}`,
      categoria_nombre: c.categorias?.nombre ?? null,
      categoria_color: c.categorias?.color ?? null,
      es_fijo: c.es_fijo,
      adicional: c.adicional,
    }))

    const respuesta: DetalleMes = {
      mes,
      total_pesos,
      total_dolares,
      fijos_pesos,
      variables_pesos,
      por_origen,
      por_categoria,
      top5,
      consumos,
    }

    res.json(respuesta)
  } catch (error) {
    console.error('/gastos-dashboard/mes GET:', error)
    res.status(500).json({ error: 'Error al obtener detalle del mes' })
  }
})

/**
 * @openapi
 * /api/gastos-dashboard/semestral:
 *   get:
 *     summary: Totales de los últimos 6 meses (para el BarChart del semestre)
 *     tags: [GastosDashboard]
 *     responses:
 *       200:
 *         description: Array con el total de pesos y dólares por mes, ordenado cronológicamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ResumenSemestral' }
 */
router.get('/semestral', async (_req, res) => {
  try {
    const hoy = new Date()
    const meses: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      meses.push(`${d.getFullYear()}-${mm}`)
    }

    const desde = `${meses[0]}-01`
    const [lastYear, lastMonth] = meses[5].split('-')
    const lastDay = new Date(parseInt(lastYear), parseInt(lastMonth), 0).getDate()
    const hasta = `${meses[5]}-${String(lastDay).padStart(2, '0')}`

    const { data: rows, error } = await supabaseAdmin
      .from('consumos_tarjeta')
      .select('fecha, pesos, dolares')
      .gte('fecha', desde)
      .lte('fecha', hasta)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const totales = new Map<string, { pesos: number; dolares: number }>(
      meses.map(m => [m, { pesos: 0, dolares: 0 }]),
    )

    for (const row of rows ?? []) {
      const mesKey = row.fecha.slice(0, 7)
      const prev = totales.get(mesKey)
      if (prev) {
        prev.pesos += row.pesos ?? 0
        prev.dolares += row.dolares ?? 0
      }
    }

    const resultado: ResumenSemestral[] = meses.map(mes => ({
      mes,
      total_pesos: totales.get(mes)?.pesos ?? 0,
      total_dolares: totales.get(mes)?.dolares ?? 0,
    }))

    res.json(resultado)
  } catch (error) {
    console.error('/gastos-dashboard/semestral GET:', error)
    res.status(500).json({ error: 'Error al obtener resumen semestral' })
  }
})

export default router
