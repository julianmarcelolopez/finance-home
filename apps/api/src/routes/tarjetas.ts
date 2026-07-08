import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import type { TarjetaCreate } from '@financehome/shared'

const router = Router()

const TITULARES_VALIDOS = ['Julian', 'Patricia']

/**
 * @openapi
 * /api/tarjetas:
 *   get:
 *     summary: Lista tarjetas de crédito
 *     tags: [Tarjetas]
 *     parameters:
 *       - in: query
 *         name: incluir_inactivas
 *         schema: { type: boolean }
 *         description: Si es true, incluye tarjetas con activo=false
 *     responses:
 *       200:
 *         description: Tarjetas ordenadas por banco y marca
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Tarjeta' }
 */
router.get('/', async (req, res) => {
  try {
    const { incluir_inactivas } = req.query as Record<string, string>

    let query = supabaseAdmin
      .from('tarjetas')
      .select('*')
      .order('banco', { ascending: true })
      .order('marca', { ascending: true })

    if (incluir_inactivas !== 'true') {
      query = query.eq('activo', true)
    }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (error) {
    console.error('/tarjetas GET:', error)
    res.status(500).json({ error: 'Error al obtener tarjetas' })
  }
})

/**
 * @openapi
 * /api/tarjetas:
 *   post:
 *     summary: Registra una tarjeta nueva
 *     tags: [Tarjetas]
 *     description: El nro_socio se normaliza quitando guiones. Devuelve 409 si ya existe una tarjeta con el mismo nro_socio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TarjetaCreate' }
 *     responses:
 *       201:
 *         description: Tarjeta creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tarjeta' }
 *       400:
 *         description: Validación fallida (campos faltantes, nro_cuenta o nro_socio no numérico, titular inválido)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Ya existe una tarjeta con ese nro_socio
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', async (req, res) => {
  try {
    const { banco, marca, nro_cuenta, nro_socio: nroSocioRaw, titular, dia_cierre } = req.body as TarjetaCreate
    const nro_socio = nroSocioRaw?.replace(/-/g, '')

    if (!banco || !marca || !nro_cuenta || !nro_socio || !titular) {
      res.status(400).json({ error: 'Todos los campos son requeridos' })
      return
    }

    if (!/^\d+$/.test(nro_cuenta)) {
      res.status(400).json({ error: 'nro_cuenta debe contener solo dígitos' })
      return
    }

    if (!/^\d+$/.test(nro_socio)) {
      res.status(400).json({ error: 'nro_socio debe contener solo dígitos' })
      return
    }

    if (!TITULARES_VALIDOS.includes(titular)) {
      res.status(400).json({ error: `titular debe ser uno de: ${TITULARES_VALIDOS.join(', ')}` })
      return
    }

    if (dia_cierre !== undefined && (dia_cierre < 1 || dia_cierre > 31)) {
      res.status(400).json({ error: 'dia_cierre debe estar entre 1 y 31' })
      return
    }

    const { data: existente } = await supabaseAdmin
      .from('tarjetas')
      .select('id')
      .eq('nro_socio', nro_socio)
      .maybeSingle()

    if (existente) {
      res.status(409).json({ error: 'Ya existe una tarjeta con ese número de socio' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('tarjetas')
      .insert({ banco, marca, nro_cuenta, nro_socio, titular, dia_cierre: dia_cierre ?? null })
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('/tarjetas POST:', error)
    res.status(500).json({ error: 'Error al crear tarjeta' })
  }
})

/**
 * @openapi
 * /api/tarjetas/{id}:
 *   patch:
 *     summary: Activa o desactiva una tarjeta
 *     tags: [Tarjetas]
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
 *               activo: { type: boolean }
 *               dia_cierre: { type: integer, minimum: 1, maximum: 31, nullable: true }
 *     responses:
 *       200:
 *         description: Tarjeta actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tarjeta' }
 *       400:
 *         description: Ningún campo válido para actualizar
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Tarjeta no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { activo, dia_cierre } = req.body as { activo?: boolean; dia_cierre?: number | null }

    if (typeof activo !== 'boolean' && dia_cierre === undefined) {
      res.status(400).json({ error: 'Debe enviar activo (boolean) y/o dia_cierre (1-31 o null)' })
      return
    }

    if (dia_cierre !== undefined && dia_cierre !== null && (dia_cierre < 1 || dia_cierre > 31)) {
      res.status(400).json({ error: 'dia_cierre debe estar entre 1 y 31' })
      return
    }

    const cambios: { activo?: boolean; dia_cierre?: number | null } = {}
    if (typeof activo === 'boolean') cambios.activo = activo
    if (dia_cierre !== undefined) cambios.dia_cierre = dia_cierre

    const { data, error } = await supabaseAdmin
      .from('tarjetas')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    console.error('/tarjetas PATCH:', error)
    res.status(500).json({ error: 'Error al actualizar tarjeta' })
  }
})

export default router
