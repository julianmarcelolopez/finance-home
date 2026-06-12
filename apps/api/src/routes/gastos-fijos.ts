import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import { GastoFijoCreate } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/gastos-fijos:
 *   get:
 *     summary: Lista gastos fijos
 *     tags: [Gastos Fijos]
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema: { type: boolean }
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: persona
 *         schema: { type: string, enum: [Julian, Patricia, Compartido] }
 *       - in: query
 *         name: moneda
 *         schema: { type: string, enum: [ARS, USD] }
 *     responses:
 *       200:
 *         description: Lista de gastos fijos ordenada por dia_del_mes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GastoFijo'
 */
router.get('/', async (req, res) => {
  try {
    const { activo, persona, moneda } = req.query as Record<string, string>

    let query = supabaseAdmin
      .from('gastos_fijos')
      .select('*')
      .order('dia_del_mes', { ascending: true })

    if (activo !== undefined) query = query.eq('activo', activo === 'true')
    if (persona) query = query.eq('persona', persona)
    if (moneda) query = query.eq('moneda', moneda)

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (error) {
    console.error('/gastos-fijos GET:', error)
    res.status(500).json({ error: 'Error al obtener gastos fijos' })
  }
})

/**
 * @openapi
 * /api/gastos-fijos:
 *   post:
 *     summary: Crea un gasto fijo nuevo
 *     tags: [Gastos Fijos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GastoFijoCreate'
 *     responses:
 *       201:
 *         description: Gasto fijo creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GastoFijo'
 *       400:
 *         description: Faltan campos requeridos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body as GastoFijoCreate

    if (!body.nombre || !body.monto || !body.moneda || !body.persona || !body.dia_del_mes) {
      res.status(400).json({ error: 'Faltan campos requeridos: nombre, monto, moneda, persona, dia_del_mes' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('gastos_fijos')
      .insert({
        ...body,
        activo: true,
        fecha_inicio: body.fecha_inicio || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('/gastos-fijos POST:', error)
    res.status(500).json({ error: 'Error al crear gasto fijo' })
  }
})

/**
 * @openapi
 * /api/gastos-fijos/{id}:
 *   patch:
 *     summary: Actualiza un gasto fijo
 *     tags: [Gastos Fijos]
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
 *               activo:      { type: boolean }
 *               monto:       { type: number }
 *               fecha_fin:   { type: string, format: date }
 *               nombre:      { type: string }
 *               dia_del_mes: { type: integer }
 *     responses:
 *       200:
 *         description: Gasto fijo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GastoFijo'
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('gastos_fijos')
      .update(req.body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/gastos-fijos PATCH:', error)
    res.status(500).json({ error: 'Error al actualizar gasto fijo' })
  }
})

export default router
