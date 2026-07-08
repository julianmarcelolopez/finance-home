import { Router } from 'express'
import { supabaseAdmin } from '../services/supabase'
import { getTipoCambio } from '../services/tipo-cambio'
import type { ComponenteResumenMensual, ResumenMensualProyectado } from '@financehome/shared'

const router = Router()

// Cantidad de resúmenes anteriores a promediar para proyectar una tarjeta con ciclo abierto
const MESES_PROMEDIO_HISTORICO = 6

// Días de margen después del cierre esperado antes de asumir "cerró sin consumos".
// Algunos bancos (ej. Galicia) no envían el mail de resumen cuando el ciclo cierra en $0,
// así que nunca se crea la fila en resumenes_tarjeta -- sin este margen, ese caso se
// confundiría con un ciclo que todavía sigue abierto.
const DIAS_GRACIA_SIN_RESUMEN = 10

interface ResumenTarjetaRow {
  tarjeta_id: string | null
  cierre_actual: string
  vencimiento_actual: string
  total_pagar_pesos: number
  total_pagar_dolares: number
}

function formatFechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`
}

// El cierre de un ciclo cuyo vencimiento cae en `mes` ocurre típicamente el mes anterior
// (ej. cierre 21/06 → vencimiento 01/07). Si ya pasó esa fecha esperada + el margen de
// gracia y todavía no hay resumen cargado, es más probable que el ciclo haya cerrado en $0
// (el banco no mandó nada) que que siga abierto.
function yaDeberiaHaberCerrado(diaCierre: number | null, year: number, month: number): boolean {
  if (!diaCierre) return false
  const cierreEsperado = new Date(year, month - 2, diaCierre)
  const limite = new Date(cierreEsperado)
  limite.setDate(limite.getDate() + DIAS_GRACIA_SIN_RESUMEN)
  return new Date() >= limite
}

/**
 * @openapi
 * /api/gastos-resumen-mensual:
 *   get:
 *     summary: Resumen mensual proyectado (ingresos, gastos reales + estimados, saldo)
 *     tags: [GastosResumenMensual]
 *     description: >
 *       Gastos fijos, Mercadopago y cuotas de préstamos activos siempre son "real" (montos
 *       pactados de antemano). Cada tarjeta activa es "real" si ya tiene un resumen cargado
 *       con vencimiento dentro del mes consultado, o "estimado" (promedio de hasta 6 resúmenes
 *       anteriores) si el ciclo sigue abierto. Efectivo no se incluye todavía (carga manual pendiente).
 *     parameters:
 *       - in: query
 *         name: mes
 *         required: true
 *         schema: { type: string, example: '2026-07' }
 *     responses:
 *       200:
 *         description: Resumen mensual proyectado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ResumenMensualProyectado' }
 *       400:
 *         description: Parámetro mes inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', async (req, res) => {
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

    const [
      tipoCambio,
      { data: ingresosData, error: errIngresos },
      { data: fijosData, error: errFijos },
      { data: mpData, error: errMp },
      { data: tarjetasData, error: errTarjetas },
      { data: cuotasData, error: errCuotas },
    ] = await Promise.all([
      getTipoCambio(),
      supabaseAdmin.from('ingresos').select('monto, moneda').gte('fecha', desde).lte('fecha', hasta),
      supabaseAdmin.from('gastos_fijos').select('monto, moneda, fecha_inicio, fecha_fin').eq('activo', true),
      supabaseAdmin.from('gastos_mercadopago').select('monto, moneda').gte('fecha', desde).lte('fecha', hasta),
      supabaseAdmin.from('tarjetas').select('id, banco, marca, titular, dia_cierre').eq('activo', true).order('banco').order('marca'),
      supabaseAdmin
        .from('cuotas_prestamo')
        .select('prestamo_id, numero_cuota, fecha_vencimiento, monto_total, prestamos!inner(banco, tipo, activo)')
        .gte('fecha_vencimiento', desde)
        .lte('fecha_vencimiento', hasta)
        .eq('prestamos.activo', true),
    ])

    if (errIngresos) { res.status(500).json({ error: errIngresos.message }); return }
    if (errFijos) { res.status(500).json({ error: errFijos.message }); return }
    if (errMp) { res.status(500).json({ error: errMp.message }); return }
    if (errTarjetas) { res.status(500).json({ error: errTarjetas.message }); return }
    if (errCuotas) { res.status(500).json({ error: errCuotas.message }); return }

    const aArs = (monto: number, moneda: string) => (moneda === 'ARS' ? monto : monto * tipoCambio.blue.venta)

    const ingresos_ars = (ingresosData ?? []).reduce((s, i) => s + aArs(i.monto, i.moneda), 0)
    const ingresos_cantidad = (ingresosData ?? []).length

    // Gastos fijos vigentes en el mes (mismo criterio que planificacion.ts)
    const inicioMes = new Date(`${mes}-01`)
    const gastosFijosArs = (fijosData ?? [])
      .filter((g) => {
        const inicio = new Date(g.fecha_inicio)
        const fin = g.fecha_fin ? new Date(g.fecha_fin) : new Date('2099-12-31')
        return inicioMes >= inicio && inicioMes <= fin
      })
      .reduce((s, g) => s + aArs(g.monto, g.moneda), 0)

    const mercadopagoArs = (mpData ?? []).reduce((s, g) => s + aArs(g.monto, g.moneda), 0)

    // Cuotas de préstamos con vencimiento en el mes — siempre "real": el monto de cada
    // cuota está pactado de antemano, no depende de un resumen ni se estima.
    const cuotas = (cuotasData ?? []) as unknown as Array<{
      prestamo_id: string
      numero_cuota: number
      fecha_vencimiento: string
      monto_total: number
      prestamos: { banco: string; tipo: string }
    }>

    const prestamoIds = [...new Set(cuotas.map((c) => c.prestamo_id))]
    const totalesPorPrestamo: Record<string, number> = {}
    if (prestamoIds.length > 0) {
      const { data: totalesData, error: errTotales } = await supabaseAdmin
        .from('cuotas_prestamo')
        .select('prestamo_id')
        .in('prestamo_id', prestamoIds)
      if (errTotales) { res.status(500).json({ error: errTotales.message }); return }
      for (const t of totalesData ?? []) {
        totalesPorPrestamo[t.prestamo_id] = (totalesPorPrestamo[t.prestamo_id] ?? 0) + 1
      }
    }

    const componentesPrestamos: ComponenteResumenMensual[] = cuotas.map((c) => ({
      nombre: `${c.prestamos.banco} ${c.prestamos.tipo} — cuota ${c.numero_cuota}/${totalesPorPrestamo[c.prestamo_id] ?? 0}`,
      tipo: 'real',
      monto_ars: c.monto_total,
      detalle: `vence ${formatFechaCorta(c.fecha_vencimiento)}`,
      alerta_desvio: false,
      porcentaje_desvio: null,
    }))

    const cuotasArs = componentesPrestamos.reduce((s, c) => s + c.monto_ars, 0)

    const tarjetas = tarjetasData ?? []
    const tarjetaIds = tarjetas.map((t) => t.id)

    // Resúmenes de las tarjetas activas, más recientes primero — sirven tanto para
    // detectar el resumen del mes actual como para el promedio histórico.
    const { data: resumenesData, error: errResumenes } = tarjetaIds.length > 0
      ? await supabaseAdmin
          .from('resumenes_tarjeta')
          .select('tarjeta_id, cierre_actual, vencimiento_actual, total_pagar_pesos, total_pagar_dolares')
          .in('tarjeta_id', tarjetaIds)
          .order('vencimiento_actual', { ascending: false })
      : { data: [] as ResumenTarjetaRow[], error: null }

    if (errResumenes) { res.status(500).json({ error: errResumenes.message }); return }

    const resumenesPorTarjeta = new Map<string, ResumenTarjetaRow[]>()
    for (const r of (resumenesData ?? []) as ResumenTarjetaRow[]) {
      if (!r.tarjeta_id) continue
      const lista = resumenesPorTarjeta.get(r.tarjeta_id) ?? []
      lista.push(r)
      resumenesPorTarjeta.set(r.tarjeta_id, lista)
    }

    const componentesTarjetas: ComponenteResumenMensual[] = tarjetas.map((t) => {
      const nombre = `${t.marca} ${t.banco} — ${t.titular}`
      const historial = resumenesPorTarjeta.get(t.id) ?? []
      const resumenDelMes = historial.find((r) => r.vencimiento_actual >= desde && r.vencimiento_actual <= hasta)

      if (resumenDelMes) {
        const monto_ars = resumenDelMes.total_pagar_pesos + resumenDelMes.total_pagar_dolares * tipoCambio.blue.venta
        return {
          nombre,
          tipo: 'real',
          monto_ars,
          detalle: `cerró el ${formatFechaCorta(resumenDelMes.cierre_actual)}`,
          alerta_desvio: false,
          porcentaje_desvio: null,
        }
      }

      // Sin resumen para este mes. Si ya pasó de sobra la fecha esperada de cierre,
      // se asume que cerró sin consumos en vez de seguir "estimando" indefinidamente.
      if (yaDeberiaHaberCerrado(t.dia_cierre, parseInt(year), parseInt(month))) {
        return {
          nombre,
          tipo: 'real',
          monto_ars: 0,
          detalle: 'cerró sin consumos (el banco no envía resumen si el total es $0)',
          alerta_desvio: false,
          porcentaje_desvio: null,
        }
      }

      // Ciclo abierto: no hay resumen todavía para este mes — se proyecta con el promedio histórico
      const historicoParaPromedio = historial.slice(0, MESES_PROMEDIO_HISTORICO)
      const promedio = historicoParaPromedio.length > 0
        ? historicoParaPromedio.reduce((s, r) => s + r.total_pagar_pesos + r.total_pagar_dolares * tipoCambio.blue.venta, 0) / historicoParaPromedio.length
        : 0

      const detalle = historicoParaPromedio.length === 0
        ? 'Sin histórico suficiente para estimar'
        : t.dia_cierre
          ? `cierra el ${String(t.dia_cierre).padStart(2, '0')}/${month} (estimado)`
          : 'ciclo abierto — estimado'

      return {
        nombre,
        tipo: 'estimado',
        monto_ars: Math.round(promedio),
        detalle,
        alerta_desvio: false,
        porcentaje_desvio: null,
      }
    })

    const gastos_reales_ars = gastosFijosArs
      + mercadopagoArs
      + cuotasArs
      + componentesTarjetas.filter((c) => c.tipo === 'real').reduce((s, c) => s + c.monto_ars, 0)
    const gastos_estimados_ars = componentesTarjetas.filter((c) => c.tipo === 'estimado').reduce((s, c) => s + c.monto_ars, 0)
    const gastos_totales_ars = gastos_reales_ars + gastos_estimados_ars

    const componentes: ComponenteResumenMensual[] = [
      { nombre: 'Gastos fijos', tipo: 'real', monto_ars: gastosFijosArs, detalle: null, alerta_desvio: false, porcentaje_desvio: null },
      { nombre: 'Mercadopago', tipo: 'real', monto_ars: mercadopagoArs, detalle: null, alerta_desvio: false, porcentaje_desvio: null },
      ...componentesPrestamos,
      ...componentesTarjetas,
    ]

    const respuesta: ResumenMensualProyectado = {
      mes,
      ingresos_ars,
      ingresos_cantidad,
      gastos_reales_ars,
      gastos_estimados_ars,
      gastos_totales_ars,
      saldo_proyectado_ars: ingresos_ars - gastos_totales_ars,
      porcentaje_comprometido: ingresos_ars > 0 ? Math.round((gastos_totales_ars / ingresos_ars) * 1000) / 10 : 0,
      componentes,
    }

    res.json(respuesta)
  } catch (error) {
    console.error('/gastos-resumen-mensual GET:', error)
    res.status(500).json({ error: 'Error al calcular el resumen mensual' })
  }
})

export default router
