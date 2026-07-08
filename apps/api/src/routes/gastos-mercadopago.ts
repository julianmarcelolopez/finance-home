import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import type { GastoMercadopagoCreate } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/gastos-mercadopago:
 *   get:
 *     summary: Lista gastos de Mercadopago paginados
 *     tags: [GastosMercadopago]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema: { type: string, example: '2026-06' }
 *         description: Filtrar por mes (YYYY-MM)
 *       - in: query
 *         name: persona
 *         schema: { type: string, enum: [Julian, Patricia, Compartido] }
 *       - in: query
 *         name: categoria_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *     responses:
 *       200:
 *         description: Gastos paginados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/GastoMercadopago' } }
 *                 total: { type: integer }
 *                 page:  { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', async (req, res) => {
  try {
    const { mes, persona, categoria_id, page = '1', limit = '50' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, parseInt(limit))
    const from = (pageNum - 1) * limitNum
    const to = from + limitNum - 1

    let query = supabaseAdmin
      .from('gastos_mercadopago')
      .select('*, categorias(nombre, color, icono)', { count: 'exact' })
      .order('fecha', { ascending: false })
      .range(from, to)

    if (mes) {
      const [year, month] = mes.split('-')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      query = query
        .gte('fecha', `${year}-${month}-01`)
        .lte('fecha', `${year}-${month}-${lastDay}`)
    }

    if (persona) query = query.eq('persona', persona)
    if (categoria_id) query = query.eq('categoria_id', categoria_id)

    const { data, error, count } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ data: data ?? [], total: count ?? 0, page: pageNum, limit: limitNum })
  } catch (error) {
    console.error('/gastos-mercadopago GET:', error)
    res.status(500).json({ error: 'Error al obtener gastos de Mercadopago' })
  }
})

/**
 * @openapi
 * /api/gastos-mercadopago:
 *   post:
 *     summary: Crea un gasto de Mercadopago nuevo
 *     tags: [GastosMercadopago]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GastoMercadopagoCreate'
 *     responses:
 *       201:
 *         description: Gasto creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GastoMercadopago' }
 *       400:
 *         description: Faltan campos requeridos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body as GastoMercadopagoCreate

    if (!body.fecha || !body.descripcion || !body.monto || !body.moneda || !body.persona) {
      res.status(400).json({ error: 'Faltan campos requeridos: fecha, descripcion, monto, moneda, persona' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('gastos_mercadopago')
      .insert(body)
      .select('*, categorias(nombre, color, icono)')
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('/gastos-mercadopago POST:', error)
    res.status(500).json({ error: 'Error al crear gasto de Mercadopago' })
  }
})

/**
 * @openapi
 * /api/gastos-mercadopago/{id}:
 *   patch:
 *     summary: Actualiza un gasto de Mercadopago
 *     tags: [GastosMercadopago]
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
 *               fecha:        { type: string, format: date }
 *               descripcion:  { type: string }
 *               monto:        { type: number }
 *               moneda:       { type: string, enum: [ARS, USD] }
 *               persona:      { type: string, enum: [Julian, Patricia, Compartido] }
 *               categoria_id: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200:
 *         description: Gasto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GastoMercadopago' }
 *       404:
 *         description: Gasto no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('gastos_mercadopago')
      .update(req.body)
      .eq('id', id)
      .select('*, categorias(nombre, color, icono)')
      .single()

    if (error) {
      res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/gastos-mercadopago PATCH:', error)
    res.status(500).json({ error: 'Error al actualizar gasto de Mercadopago' })
  }
})

/**
 * @openapi
 * /api/gastos-mercadopago/{id}:
 *   delete:
 *     summary: Elimina un gasto de Mercadopago
 *     tags: [GastosMercadopago]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Eliminado
 *       404:
 *         description: No encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error, count } = await supabaseAdmin
      .from('gastos_mercadopago')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    if (!count) {
      res.status(404).json({ error: 'Gasto no encontrado' })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error('/gastos-mercadopago DELETE:', error)
    res.status(500).json({ error: 'Error al eliminar gasto de Mercadopago' })
  }
})

export default router
