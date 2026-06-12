import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'

const router = Router()

/**
 * @openapi
 * /api/consumos:
 *   get:
 *     summary: Lista consumos de tarjeta paginados
 *     tags: [Consumos]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema: { type: string, example: '2026-06' }
 *         description: Filtrar por mes (YYYY-MM). Ignorado si se pasa resumen_id.
 *       - in: query
 *         name: tarjeta_id
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por tarjeta. Ignorado si se pasa resumen_id.
 *       - in: query
 *         name: banco
 *         schema: { type: string, example: 'Galicia' }
 *         description: Filtrar por banco. Ignorado si se pasa tarjeta_id o resumen_id.
 *       - in: query
 *         name: resumen_id
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por resumen específico. Tiene prioridad sobre los demás filtros.
 *       - in: query
 *         name: adicional
 *         schema: { type: boolean }
 *         description: Filtrar consumos de tarjeta adicional (Patricia)
 *       - in: query
 *         name: categoria_id
 *         schema: { type: string, format: uuid }
 *         description: Filtrar por categoría
 *       - in: query
 *         name: es_fijo
 *         schema: { type: boolean }
 *         description: Filtrar solo fijos (true) o solo variables (false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *     responses:
 *       200:
 *         description: Consumos paginados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ConsumoTarjeta' }
 *                 total: { type: integer }
 *                 page:  { type: integer }
 *                 limit: { type: integer }
 */
router.get('/', async (req, res) => {
  try {
    const { mes, banco, adicional, tarjeta_id, resumen_id, categoria_id, es_fijo, page = '1', limit = '50' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, parseInt(limit))
    const from = (pageNum - 1) * limitNum
    const to = from + limitNum - 1

    let query = supabaseAdmin
      .from('consumos_tarjeta')
      .select(
        `
        *,
        resumenes_tarjeta!inner(banco, marca_tarjeta, titular, tarjeta_id)
      `,
        { count: 'exact' },
      )
      .order('fecha', { ascending: false })
      .range(from, to)

    if (resumen_id) {
      query = query.eq('resumen_id', resumen_id)
    } else {
      if (mes) {
        const [year, month] = mes.split('-')
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
        query = query
          .gte('fecha', `${year}-${month}-01`)
          .lte('fecha', `${year}-${month}-${lastDay}`)
      }
      if (tarjeta_id) {
        query = query.eq('resumenes_tarjeta.tarjeta_id', tarjeta_id)
      } else if (banco) {
        query = query.eq('resumenes_tarjeta.banco', banco)
      }
    }

    if (adicional !== undefined) {
      query = query.eq('adicional', adicional === 'true')
    }

    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id)
    }

    if (es_fijo !== undefined) {
      query = query.eq('es_fijo', es_fijo === 'true')
    }

    const { data, error, count } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ data: data ?? [], total: count ?? 0, page: pageNum, limit: limitNum })
  } catch (error) {
    console.error('/consumos:', error)
    res.status(500).json({ error: 'Error al obtener consumos' })
  }
})

/**
 * @openapi
 * /api/consumos/{id}:
 *   patch:
 *     summary: Actualiza campos editables de un consumo (es_fijo, categoria_id)
 *     tags: [Consumos]
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
 *               es_fijo:
 *                 type: boolean
 *               categoria_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Consumo actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ConsumoTarjeta' }
 *       400:
 *         description: No se enviaron campos válidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Consumo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { es_fijo, categoria_id } = req.body

    const updates: Record<string, unknown> = {}
    if (es_fijo !== undefined) updates.es_fijo = es_fijo
    if ('categoria_id' in req.body) updates.categoria_id = categoria_id ?? null

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('consumos_tarjeta')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    if (!data) {
      res.status(404).json({ error: 'Consumo no encontrado' })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/consumos/:id PATCH:', error)
    res.status(500).json({ error: 'Error al actualizar consumo' })
  }
})

/**
 * @openapi
 * /api/consumos/{id}/etiquetas:
 *   post:
 *     summary: Asigna o quita la categoría de un consumo
 *     tags: [Consumos]
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
 *               categoria_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: UUID de la categoría, o null para quitar la categoría
 *     responses:
 *       200:
 *         description: Consumo actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ConsumoTarjeta' }
 *       404:
 *         description: Consumo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/etiquetas', async (req, res) => {
  try {
    const { id } = req.params
    const { categoria_id } = req.body

    const { data, error } = await supabaseAdmin
      .from('consumos_tarjeta')
      .update({ categoria_id: categoria_id ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    if (!data) {
      res.status(404).json({ error: 'Consumo no encontrado' })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/consumos/:id/etiquetas POST:', error)
    res.status(500).json({ error: 'Error al actualizar categoría del consumo' })
  }
})

export default router
