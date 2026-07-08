import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'

const router = Router()

/**
 * @openapi
 * /api/ingresos:
 *   get:
 *     summary: Lista ingresos
 *     tags: [Ingresos]
 *     parameters:
 *       - in: query
 *         name: persona
 *         schema: { type: string, enum: [Julian, Patricia, Compartido] }
 *       - in: query
 *         name: año
 *         schema: { type: integer, example: 2026 }
 *       - in: query
 *         name: mes
 *         schema: { type: integer, minimum: 1, maximum: 12, example: 6 }
 *     responses:
 *       200:
 *         description: Lista de ingresos ordenada por fecha desc
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Ingreso' }
 */
router.get('/', async (req, res) => {
  const { persona, año, mes } = req.query
  let query = supabaseAdmin
    .from('ingresos')
    .select('*')
    .order('fecha', { ascending: false })

  if (persona) query = query.eq('persona', persona)
  if (año && mes) {
    const desde = `${año}-${String(mes).padStart(2, '0')}-01`
    const hasta = new Date(Number(año), Number(mes), 0).toISOString().split('T')[0]
    query = query.gte('fecha', desde).lte('fecha', hasta)
  } else if (año) {
    query = query.gte('fecha', `${año}-01-01`).lte('fecha', `${año}-12-31`)
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

/**
 * @openapi
 * /api/ingresos:
 *   post:
 *     summary: Crea un ingreso
 *     tags: [Ingresos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/IngresoCreate' }
 *     responses:
 *       201:
 *         description: Ingreso creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ingreso' }
 */
router.post('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ingresos')
    .insert(req.body)
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

/**
 * @openapi
 * /api/ingresos/{id}:
 *   patch:
 *     summary: Actualiza un ingreso
 *     tags: [Ingresos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/IngresoCreate' }
 *     responses:
 *       200:
 *         description: Ingreso actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ingreso' }
 */
router.patch('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('ingresos')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

/**
 * @openapi
 * /api/ingresos/{id}:
 *   delete:
 *     summary: Elimina un ingreso
 *     tags: [Ingresos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('ingresos')
    .delete()
    .eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
