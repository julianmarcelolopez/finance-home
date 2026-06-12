import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import { ProyectoCreate } from '@financehome/shared'

const router = Router()

/**
 * @openapi
 * /api/proyectos:
 *   get:
 *     summary: Lista proyectos de ahorro
 *     tags: [Proyectos]
 *     responses:
 *       200:
 *         description: Proyectos ordenados por prioridad y fecha
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Proyecto' }
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('proyectos')
      .select('*')
      .order('prioridad', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (error) {
    console.error('/proyectos GET:', error)
    res.status(500).json({ error: 'Error al obtener proyectos' })
  }
})

/**
 * @openapi
 * /api/proyectos:
 *   post:
 *     summary: Crea un proyecto de ahorro
 *     tags: [Proyectos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProyectoCreate' }
 *     responses:
 *       201:
 *         description: Proyecto creado con actual=0
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Proyecto' }
 *       400:
 *         description: Faltan campos requeridos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body as ProyectoCreate

    if (!body.nombre || !body.meta || !body.moneda || !body.prioridad) {
      res.status(400).json({ error: 'Faltan campos requeridos: nombre, meta, moneda, prioridad' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('proyectos')
      .insert({ ...body, actual: 0 })
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('/proyectos POST:', error)
    res.status(500).json({ error: 'Error al crear proyecto' })
  }
})

/**
 * @openapi
 * /api/proyectos/{id}/aporte:
 *   patch:
 *     summary: Registra un aporte a un proyecto
 *     tags: [Proyectos]
 *     description: Suma el monto al campo `actual`. Si supera la `meta`, se trunca al valor de la meta.
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
 *             required: [monto]
 *             properties:
 *               monto: { type: number, minimum: 0.01, example: 50000 }
 *     responses:
 *       200:
 *         description: Proyecto con actual actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Proyecto' }
 *       400:
 *         description: Monto inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/aporte', async (req, res) => {
  try {
    const { id } = req.params
    const { monto } = req.body as { monto: number }

    if (!monto || monto <= 0) {
      res.status(400).json({ error: 'El monto debe ser un número positivo' })
      return
    }

    const { data: proyecto, error: fetchError } = await supabaseAdmin
      .from('proyectos')
      .select('actual, meta')
      .eq('id', id)
      .single()

    if (fetchError || !proyecto) {
      res.status(404).json({ error: 'Proyecto no encontrado' })
      return
    }

    const nuevoActual = Math.min(proyecto.actual + monto, proyecto.meta)

    const { data, error } = await supabaseAdmin
      .from('proyectos')
      .update({ actual: nuevoActual })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/proyectos PATCH aporte:', error)
    res.status(500).json({ error: 'Error al registrar aporte' })
  }
})

export default router
