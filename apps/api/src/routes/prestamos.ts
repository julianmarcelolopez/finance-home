import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import type { PrestamoConCuotasCreate } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/prestamos:
 *   get:
 *     summary: Lista préstamos
 *     tags: [Préstamos]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema: { type: boolean }
 *       - in: query
 *         name: persona
 *         schema: { type: string, enum: [Julian, Patricia, Compartido] }
 *     responses:
 *       200:
 *         description: Lista de préstamos ordenada por created_at desc
 */
router.get('/', async (req, res) => {
  try {
    const { activo, persona } = req.query as Record<string, string>

    let query = supabaseAdmin
      .from('prestamos')
      .select('*')
      .order('created_at', { ascending: false })

    if (activo !== undefined) query = query.eq('activo', activo === 'true')
    else query = query.eq('activo', true)

    if (persona) query = query.eq('persona', persona)

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (err) {
    console.error('/prestamos GET:', err)
    res.status(500).json({ error: 'Error al obtener préstamos' })
  }
})

/**
 * @openapi
 * /api/prestamos:
 *   post:
 *     summary: Crea un préstamo con su cronograma de cuotas
 *     tags: [Préstamos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prestamo, cuotas]
 *             properties:
 *               prestamo:
 *                 type: object
 *               cuotas:
 *                 type: array
 *     responses:
 *       201:
 *         description: Préstamo y cuotas creados
 *       400:
 *         description: Faltan campos requeridos
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body as PrestamoConCuotasCreate

    if (!body.prestamo || !body.cuotas || body.cuotas.length === 0) {
      res.status(400).json({ error: 'Se requiere prestamo y al menos una cuota' })
      return
    }

    const { numero, banco, tipo, monto_solicitado, moneda, persona } = body.prestamo
    if (!numero || !banco || !tipo || !monto_solicitado || !moneda || !persona) {
      res.status(400).json({ error: 'Faltan campos requeridos: numero, banco, tipo, monto_solicitado, moneda, persona' })
      return
    }

    // Insertar préstamo
    const { data: prestamo, error: errorPrestamo } = await supabaseAdmin
      .from('prestamos')
      .insert(body.prestamo)
      .select()
      .single()

    if (errorPrestamo || !prestamo) {
      res.status(500).json({ error: errorPrestamo?.message ?? 'Error al crear préstamo' })
      return
    }

    // Insertar cuotas
    const cuotasPayload = body.cuotas.map((c) => ({
      ...c,
      prestamo_id: prestamo.id,
      pagada: c.pagada ?? false,
    }))

    const { data: cuotas, error: errorCuotas } = await supabaseAdmin
      .from('cuotas_prestamo')
      .insert(cuotasPayload)
      .select()

    if (errorCuotas) {
      // Rollback manual: eliminar el préstamo recién creado
      await supabaseAdmin.from('prestamos').delete().eq('id', prestamo.id)
      res.status(500).json({ error: errorCuotas.message })
      return
    }

    res.status(201).json({ prestamo, cuotas: cuotas ?? [] })
  } catch (err) {
    console.error('/prestamos POST:', err)
    res.status(500).json({ error: 'Error al crear préstamo' })
  }
})

/**
 * @openapi
 * /api/prestamos/cuotas-mes:
 *   get:
 *     summary: Cuotas con vencimiento en un mes dado
 *     tags: [Préstamos]
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema: { type: string, example: "2026-06" }
 *     responses:
 *       200:
 *         description: Cuotas del mes con datos del préstamo
 *       400:
 *         description: Parámetro mes requerido
 */
router.get('/cuotas-mes', async (req, res) => {
  try {
    const { mes } = req.query as Record<string, string>

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ error: 'Parámetro mes requerido en formato YYYY-MM' })
      return
    }

    const desde = `${mes}-01`
    const [anio, mesNum] = mes.split('-').map(Number)
    const hasta = new Date(anio, mesNum, 0).toISOString().slice(0, 10) // último día del mes

    const { data, error } = await supabaseAdmin
      .from('cuotas_prestamo')
      .select(`
        id,
        prestamo_id,
        numero_cuota,
        fecha_vencimiento,
        monto_total,
        pagada,
        prestamos!inner (
          banco,
          tipo,
          persona,
          activo,
          id
        )
      `)
      .gte('fecha_vencimiento', desde)
      .lte('fecha_vencimiento', hasta)
      .eq('prestamos.activo', true)
      .order('fecha_vencimiento', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // Contar total de cuotas por préstamo para enriquecer la respuesta
    const prestamo_ids = [...new Set((data ?? []).map((c: any) => c.prestamo_id))]

    const totalesPorPrestamo: Record<string, number> = {}
    if (prestamo_ids.length > 0) {
      const { data: totales } = await supabaseAdmin
        .from('cuotas_prestamo')
        .select('prestamo_id')
        .in('prestamo_id', prestamo_ids)

      for (const t of totales ?? []) {
        totalesPorPrestamo[t.prestamo_id] = (totalesPorPrestamo[t.prestamo_id] ?? 0) + 1
      }
    }

    const result = (data ?? []).map((c: any) => ({
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

    res.json(result)
  } catch (err) {
    console.error('/prestamos/cuotas-mes GET:', err)
    res.status(500).json({ error: 'Error al obtener cuotas del mes' })
  }
})

/**
 * @openapi
 * /api/prestamos/{id}:
 *   get:
 *     summary: Detalle de un préstamo con sus cuotas
 *     tags: [Préstamos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Préstamo con array de cuotas ordenadas
 *       404:
 *         description: Préstamo no encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('prestamos')
      .select(`
        *,
        cuotas:cuotas_prestamo (*)
      `)
      .eq('id', id)
      .order('numero_cuota', { referencedTable: 'cuotas_prestamo', ascending: true })
      .single()

    if (error) {
      res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (err) {
    console.error('/prestamos/:id GET:', err)
    res.status(500).json({ error: 'Error al obtener préstamo' })
  }
})

/**
 * @openapi
 * /api/prestamos/{id}:
 *   patch:
 *     summary: Actualiza campos del préstamo
 *     tags: [Préstamos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capital_adeudado: { type: number }
 *               activo:           { type: boolean }
 *               cuenta_debito:    { type: string }
 *     responses:
 *       200:
 *         description: Préstamo actualizado
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('prestamos')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (err) {
    console.error('/prestamos/:id PATCH:', err)
    res.status(500).json({ error: 'Error al actualizar préstamo' })
  }
})

/**
 * @openapi
 * /api/prestamos/{id}/cuotas/{cuotaId}:
 *   patch:
 *     summary: Actualiza una cuota (pagada, monto_total para préstamos UVA)
 *     tags: [Préstamos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: cuotaId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pagada:      { type: boolean }
 *               monto_total: { type: number }
 *     responses:
 *       200:
 *         description: Cuota actualizada
 */
router.patch('/:id/cuotas/:cuotaId', async (req, res) => {
  try {
    const { id, cuotaId } = req.params

    const { data, error } = await supabaseAdmin
      .from('cuotas_prestamo')
      .update(req.body)
      .eq('id', cuotaId)
      .eq('prestamo_id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (err) {
    console.error('/prestamos/:id/cuotas/:cuotaId PATCH:', err)
    res.status(500).json({ error: 'Error al actualizar cuota' })
  }
})

export default router
