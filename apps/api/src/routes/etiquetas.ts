import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'

const router = Router()

/**
 * @openapi
 * /api/etiquetas:
 *   get:
 *     summary: Lista todas las categorías
 *     tags: [Etiquetas]
 *     responses:
 *       200:
 *         description: Categorías ordenadas por nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Categoria' }
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (error) {
    console.error('/etiquetas GET:', error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

/**
 * @openapi
 * /api/etiquetas:
 *   post:
 *     summary: Crea una categoría nueva
 *     tags: [Etiquetas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, color, icono]
 *             properties:
 *               nombre: { type: string, example: 'Farmacia' }
 *               color:  { type: string, example: '#dc2626' }
 *               icono:  { type: string, example: 'pill' }
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       400:
 *         description: Faltan campos requeridos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, color, icono } = req.body

    if (!nombre || !color || !icono) {
      res.status(400).json({ error: 'Faltan campos requeridos: nombre, color, icono' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert({ nombre, color, icono })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: `Ya existe una categoría con el nombre "${nombre}"` })
        return
      }
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('/etiquetas POST:', error)
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

/**
 * @openapi
 * /api/etiquetas/patrones:
 *   get:
 *     summary: Lista patrones de autoetiquetado con su categoría
 *     tags: [Etiquetas]
 *     responses:
 *       200:
 *         description: Patrones ordenados por fecha de creación descendente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ComercioCategoria' }
 */
router.get('/patrones', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('comercios_categorias')
      .select('*, categorias(nombre, color, icono)')
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (error) {
    console.error('/etiquetas/patrones GET:', error)
    res.status(500).json({ error: 'Error al obtener patrones' })
  }
})

/**
 * @openapi
 * /api/etiquetas/patrones:
 *   post:
 *     summary: Crea un patrón y dispara backfill automático sobre consumos sin categoría
 *     tags: [Etiquetas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patron, categoria_id]
 *             properties:
 *               patron:      { type: string, example: 'SPORTCLU' }
 *               categoria_id:{ type: string, format: uuid }
 *               es_fijo:     { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Patrón creado y consumos actualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patron:    { $ref: '#/components/schemas/ComercioCategoria' }
 *                 afectados: { type: integer, description: 'Consumos categorizados automáticamente' }
 */
router.post('/patrones', async (req, res) => {
  try {
    const { patron, categoria_id, es_fijo = false } = req.body

    if (!patron || !categoria_id) {
      res.status(400).json({ error: 'Faltan campos requeridos: patron, categoria_id' })
      return
    }

    const { data: nuevoPatron, error: errPatron } = await supabaseAdmin
      .from('comercios_categorias')
      .insert({ patron: patron.toUpperCase().trim(), categoria_id, es_fijo })
      .select('*, categorias(nombre, color, icono)')
      .single()

    if (errPatron) {
      res.status(500).json({ error: errPatron.message })
      return
    }

    const { data: afectados, error: errBackfill } = await supabaseAdmin
      .rpc('fn_backfill_autoetiquetado')

    if (errBackfill) {
      console.error('backfill error:', errBackfill)
    }

    res.status(201).json({ patron: nuevoPatron, afectados: afectados ?? 0 })
  } catch (error) {
    console.error('/etiquetas/patrones POST:', error)
    res.status(500).json({ error: 'Error al crear patrón' })
  }
})

/**
 * @openapi
 * /api/etiquetas/patrones/{id}:
 *   delete:
 *     summary: Elimina un patrón de autoetiquetado
 *     tags: [Etiquetas]
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
router.delete('/patrones/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('comercios_categorias')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error('/etiquetas/patrones/:id DELETE:', error)
    res.status(500).json({ error: 'Error al eliminar patrón' })
  }
})

export default router
