import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'

const router = Router()

/**
 * @openapi
 * /api/resumenes:
 *   get:
 *     summary: Lista resúmenes de tarjeta paginados
 *     tags: [Resúmenes]
 *     parameters:
 *       - in: query
 *         name: tarjeta_id
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por tarjeta. Tiene prioridad sobre banco y titular.
 *       - in: query
 *         name: banco
 *         schema: { type: string, example: 'Galicia' }
 *       - in: query
 *         name: titular
 *         schema: { type: string, example: 'Lopez' }
 *         description: Búsqueda parcial por nombre de titular (ILIKE)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Resúmenes paginados ordenados por cierre_actual DESC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ResumenTarjeta' }
 *                 total: { type: integer }
 *                 page:  { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', async (req, res) => {
  try {
    const { banco, titular, tarjeta_id, page = '1', limit = '20' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, parseInt(limit))
    const from = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('resumenes_tarjeta')
      .select('*', { count: 'exact' })
      .order('cierre_actual', { ascending: false })
      .range(from, from + limitNum - 1)

    if (tarjeta_id) query = query.eq('tarjeta_id', tarjeta_id)
    else {
      if (banco) query = query.eq('banco', banco)
      if (titular) query = query.ilike('titular', `%${titular}%`)
    }

    const { data, error, count } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ data: data ?? [], total: count ?? 0, page: pageNum, limit: limitNum })
  } catch (error) {
    console.error('/resumenes:', error)
    res.status(500).json({ error: 'Error al obtener resúmenes' })
  }
})

export default router
