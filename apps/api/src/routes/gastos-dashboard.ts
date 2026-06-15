import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import type { DetalleMes, ResumenOrigen, ResumenCategoriaMes, Top5Consumo, ConsumoMes, ResumenSemestral, CuotaMesResumen, FilaSemestre, SemestreResumen, ResumenTarjetaMes } from '@financehome/shared'
import { getTipoCambio } from '../services/tipo-cambio'

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

    // Consumos de tarjeta: pertenecen al mes en que vence el resumen (vencimiento_actual)
    // Cuotas de préstamos: pertenecen al mes en que vence la cuota (fecha_vencimiento)
    const [{ data: rows, error }, { data: cuotasRaw }, { data: tarjetasData }] = await Promise.all([
      supabaseAdmin
        .from('consumos_tarjeta')
        .select(`
          id, fecha, referencia, pesos, dolares, adicional, es_fijo, categoria_id,
          resumenes_tarjeta!inner(tarjeta_id, banco, marca_tarjeta, titular, vencimiento_actual),
          categorias(nombre, color)
        `)
        .gte('resumenes_tarjeta.vencimiento_actual', desde)
        .lte('resumenes_tarjeta.vencimiento_actual', hasta)
        .order('fecha', { ascending: false }),

      supabaseAdmin
        .from('cuotas_prestamo')
        .select('id, prestamo_id, numero_cuota, fecha_vencimiento, monto_total, pagada, prestamos!inner(banco, tipo, persona)')
        .gte('fecha_vencimiento', desde)
        .lte('fecha_vencimiento', hasta)
        .eq('prestamos.activo', true)
        .order('fecha_vencimiento', { ascending: true }),

      supabaseAdmin
        .from('tarjetas')
        .select('id, banco, marca, titular')
        .eq('activo', true)
        .order('titular')
        .order('marca'),
    ])

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // Contar cuotas totales por préstamo para mostrar "cuota X de Y"
    const prestamoIds = [...new Set((cuotasRaw ?? []).map((c: any) => c.prestamo_id))]
    const totalesPorPrestamo: Record<string, number> = {}
    if (prestamoIds.length > 0) {
      const { data: totales } = await supabaseAdmin
        .from('cuotas_prestamo')
        .select('prestamo_id')
        .in('prestamo_id', prestamoIds)
      for (const t of totales ?? []) {
        totalesPorPrestamo[t.prestamo_id] = (totalesPorPrestamo[t.prestamo_id] ?? 0) + 1
      }
    }

    const cuotas_prestamos: CuotaMesResumen[] = (cuotasRaw ?? []).map((c: any) => ({
      prestamo_id: c.prestamo_id,
      banco: c.prestamos.banco,
      tipo: c.prestamos.tipo,
      persona: c.prestamos.persona,
      numero_cuota: c.numero_cuota,
      total_cuotas: totalesPorPrestamo[c.prestamo_id] ?? 0,
      fecha_vencimiento: c.fecha_vencimiento,
      monto_total: c.monto_total,
      pagada: c.pagada,
    }))

    const cuotas_prestamos_total_ars = cuotas_prestamos.reduce((s, c) => s + c.monto_total, 0)

    const consumosRaw = (rows ?? []) as Array<{
      id: string
      fecha: string
      referencia: string
      pesos: number
      dolares: number
      adicional: boolean
      es_fijo: boolean
      categoria_id: string | null
      resumenes_tarjeta: { tarjeta_id: string; banco: string; marca_tarjeta: string; titular: string; vencimiento_actual: string }
      categorias: { nombre: string; color: string } | null
    }>

    // Totales globales
    const total_pesos = consumosRaw.reduce((s, c) => s + (c.pesos ?? 0), 0)
    const total_dolares = consumosRaw.reduce((s, c) => s + (c.dolares ?? 0), 0)
    const fijos_pesos = consumosRaw.filter(c => c.es_fijo).reduce((s, c) => s + (c.pesos ?? 0), 0)
    const variables_pesos = consumosRaw.filter(c => !c.es_fijo).reduce((s, c) => s + (c.pesos ?? 0), 0)

    // Tarjetas: siempre todas las activas, con $0 si no tuvieron consumos en el mes
    const tarjetaMontoMap = new Map<string, { pesos: number; dolares: number }>()
    for (const c of consumosRaw) {
      const tid = c.resumenes_tarjeta.tarjeta_id
      const prev = tarjetaMontoMap.get(tid) ?? { pesos: 0, dolares: 0 }
      tarjetaMontoMap.set(tid, {
        pesos: prev.pesos + (c.pesos ?? 0),
        dolares: prev.dolares + (c.dolares ?? 0),
      })
    }
    const tarjetas_mes: ResumenTarjetaMes[] = (tarjetasData ?? []).map(t => ({
      tarjeta_id: t.id,
      nombre: `${t.marca} ${t.banco} — ${t.titular}`,
      pesos: tarjetaMontoMap.get(t.id)?.pesos ?? 0,
      dolares: tarjetaMontoMap.get(t.id)?.dolares ?? 0,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

    // Orígenes pendientes (fuentes no implementadas)
    const por_origen: ResumenOrigen[] = [
      { nombre: 'Mercadopago Julian', pesos: 0, dolares: 0, disponible: false },
      { nombre: 'Mercadopago Patricia', pesos: 0, dolares: 0, disponible: false },
      { nombre: 'Efectivo', pesos: 0, dolares: 0, disponible: false },
    ]

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
      tarjetas_mes,
      cuotas_prestamos_ars: cuotas_prestamos_total_ars,
      cuotas_prestamos,
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

/**
 * @openapi
 * /api/gastos-dashboard/semestre:
 *   get:
 *     summary: Matriz pivot semestral — filas por origen, columnas por mes
 *     tags: [GastosDashboard]
 *     parameters:
 *       - in: query
 *         name: año
 *         required: true
 *         schema: { type: integer, example: 2026 }
 *       - in: query
 *         name: semestre
 *         required: true
 *         schema: { type: integer, enum: [1, 2] }
 *     responses:
 *       200:
 *         description: Resumen semestral pivot por origen
 */
router.get('/semestre', async (req, res) => {
  try {
    const año = parseInt(req.query.año as string)
    const semestre = parseInt(req.query.semestre as string) as 1 | 2

    if (!año || (semestre !== 1 && semestre !== 2)) {
      res.status(400).json({ error: 'Parámetros requeridos: año (number) y semestre (1 o 2)' })
      return
    }

    const mesInicio = semestre === 1 ? 1 : 7
    const mesFin    = semestre === 1 ? 6 : 12
    const desde = `${año}-${String(mesInicio).padStart(2, '0')}-01`
    const hasta = `${año}-${String(mesFin).padStart(2, '0')}-${new Date(año, mesFin, 0).getDate()}`

    const meses: string[] = []
    for (let m = mesInicio; m <= mesFin; m++) {
      meses.push(`${año}-${String(m).padStart(2, '0')}`)
    }

    const [consumosRes, cuotasRes, fijosRes, tipoCambio] = await Promise.all([
      supabaseAdmin
        .from('consumos_tarjeta')
        .select('pesos, resumenes_tarjeta!inner(banco, marca_tarjeta, titular, vencimiento_actual)')
        .gte('resumenes_tarjeta.vencimiento_actual', desde)
        .lte('resumenes_tarjeta.vencimiento_actual', hasta),

      supabaseAdmin
        .from('cuotas_prestamo')
        .select('monto_total, fecha_vencimiento, prestamos!inner(banco, tipo, activo)')
        .gte('fecha_vencimiento', desde)
        .lte('fecha_vencimiento', hasta)
        .eq('prestamos.activo', true),

      supabaseAdmin
        .from('gastos_fijos')
        .select('monto, moneda')
        .eq('activo', true),

      getTipoCambio(),
    ])

    // ── Tarjetas: agrupar por "marca banco — titular" × mes ──
    const tarjetaMap = new Map<string, Record<string, number>>()
    for (const c of (consumosRes.data ?? []) as any[]) {
      const r = c.resumenes_tarjeta
      const nombre = `${r.marca_tarjeta} ${r.banco} — ${r.titular}`
      const mesKey = (r.vencimiento_actual as string).slice(0, 7)
      if (!tarjetaMap.has(nombre)) tarjetaMap.set(nombre, {})
      const prev = tarjetaMap.get(nombre)!
      prev[mesKey] = (prev[mesKey] ?? 0) + (c.pesos ?? 0)
    }

    const filasTarjeta: FilaSemestre[] = Array.from(tarjetaMap.entries())
      .map(([nombre, mesesData]) => ({ nombre, tipo: 'tarjeta' as const, meses: mesesData }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    // ── Préstamos: agrupar por "banco tipo" × mes ──
    const prestamoMap = new Map<string, Record<string, number>>()
    for (const c of (cuotasRes.data ?? []) as any[]) {
      const p = c.prestamos
      const nombre = `${p.banco} ${p.tipo}`
      const mesKey = (c.fecha_vencimiento as string).slice(0, 7)
      if (!prestamoMap.has(nombre)) prestamoMap.set(nombre, {})
      const prev = prestamoMap.get(nombre)!
      prev[mesKey] = (prev[mesKey] ?? 0) + (c.monto_total ?? 0)
    }

    const filasPrestamo: FilaSemestre[] = Array.from(prestamoMap.entries())
      .map(([nombre, mesesData]) => ({ nombre, tipo: 'prestamo' as const, meses: mesesData }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    // ── Gastos fijos: mismo total todos los meses ──
    const totalFijosARS = (fijosRes.data ?? []).reduce((acc, g) => {
      return acc + (g.moneda === 'ARS' ? g.monto : g.monto * tipoCambio.blue.venta)
    }, 0)

    const filaFijos: FilaSemestre = {
      nombre: 'Gastos fijos',
      tipo: 'gastos_fijos',
      meses: Object.fromEntries(meses.map(m => [m, totalFijosARS])),
    }

    // ── Totales por mes ──
    const filas: FilaSemestre[] = [...filasTarjeta, ...filasPrestamo, filaFijos]
    const totales: Record<string, number> = {}
    for (const mes of meses) {
      totales[mes] = filas.reduce((acc, f) => acc + (f.meses[mes] ?? 0), 0)
    }

    const respuesta: SemestreResumen = { año, semestre, meses, filas, totales }
    res.json(respuesta)
  } catch (error) {
    console.error('/gastos-dashboard/semestre GET:', error)
    res.status(500).json({ error: 'Error al obtener resumen semestral' })
  }
})

export default router
