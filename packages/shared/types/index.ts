// --- Tablas existentes en Supabase ---

export interface ResumenTarjeta {
  id: string
  banco: string
  marca_tarjeta: string
  titular: string
  nro_resumen: string
  cierre_actual: string
  vencimiento_actual: string
  total_pagar_pesos: number
  total_pagar_dolares: number
  created_at: string
}

export interface ConsumoTarjeta {
  id: string
  resumen_id: string
  fecha: string
  referencia: string
  comprobante: string | null
  pesos: number
  dolares: number
  adicional: boolean
  nro_resumen: string
  categoria_id: string | null
  es_fijo: boolean
  cuota_actual: number | null
  cantidad_cuotas: number | null
  created_at: string
  // Join con resumenes_tarjeta
  resumenes_tarjeta?: Pick<ResumenTarjeta, 'banco' | 'marca_tarjeta' | 'titular'>
}

// --- Tablas nuevas ---

export type Moneda = 'ARS' | 'USD'
export type Persona = 'Julian' | 'Patricia' | 'Compartido'

export interface GastoFijo {
  id: string
  nombre: string
  monto: number
  moneda: Moneda
  categoria: string | null
  dia_del_mes: number
  fecha_inicio: string
  fecha_fin: string | null
  persona: Persona
  activo: boolean
  created_at: string
}

export interface GastoFijoCreate {
  nombre: string
  monto: number
  moneda: Moneda
  categoria?: string
  dia_del_mes: number
  fecha_inicio: string
  fecha_fin?: string
  persona: Persona
}

export interface Categoria {
  id: string
  nombre: string
  color: string
  icono: string
}

export interface ComercioCategoria {
  id: string
  patron: string
  categoria_id: string
  es_fijo: boolean
  created_at: string
  categorias?: Pick<Categoria, 'nombre' | 'color' | 'icono'>
}

export type TipoIngreso = 'sueldo' | 'freelance' | 'renta' | 'otro'

export interface Ingreso {
  id: string
  descripcion: string
  monto: number
  moneda: Moneda
  persona: Persona
  tipo: TipoIngreso
  fecha: string
  created_at: string
}

export type Prioridad = 'alta' | 'media' | 'baja'

export interface Proyecto {
  id: string
  nombre: string
  meta: number
  moneda: Moneda
  actual: number
  fecha_objetivo: string | null
  prioridad: Prioridad
  notas: string | null
  created_at: string
}

export interface ProyectoCreate {
  nombre: string
  meta: number
  moneda: Moneda
  fecha_objetivo?: string
  prioridad: Prioridad
  notas?: string
}

// --- Catálogo de tarjetas de crédito ---

export interface Tarjeta {
  id: string
  banco: string
  marca: string
  nro_cuenta: string
  nro_socio: string
  titular: string
  activo: boolean
  created_at: string
}

export interface TarjetaCreate {
  banco: string
  marca: string
  nro_cuenta: string
  nro_socio: string
  titular: string
}

// --- Tipo de cambio ---

export interface TipoCambio {
  oficial: { compra: number; venta: number }
  blue: { compra: number; venta: number }
  updated_at: string
}

// --- Responses de la API ---

export interface ResumenPorCategoria {
  categoria: string
  monto: number
  porcentaje: number
}

export interface DashboardResumen {
  mes_actual: string
  total_consumos_pesos: number
  total_consumos_dolares: number
  gastos_fijos_mes_ars: number
  proyectos_activos: number
  proximos_vencimientos: ResumenTarjeta[]
  tipo_cambio: TipoCambio
}

export interface FlujoCajaMes {
  mes: string
  ingresos: number
  gastos_fijos: number
  gastos_variables: number
  saldo: number
  saldo_acumulado: number
}

// --- Gastos Dashboard ---

export interface ResumenOrigen {
  nombre: string
  pesos: number
  dolares: number
  disponible: boolean
}

export interface ResumenCategoriaMes {
  nombre: string
  color: string
  monto: number
  porcentaje: number
}

export interface Top5Consumo {
  id: string
  fecha: string
  referencia: string
  pesos: number
  dolares: number
  origen: string
  adicional: boolean
}

export interface ConsumoMes {
  id: string
  fecha: string
  referencia: string
  pesos: number
  dolares: number
  origen: string
  categoria_nombre: string | null
  categoria_color: string | null
  es_fijo: boolean
  adicional: boolean
}

export interface DetalleMes {
  mes: string
  total_pesos: number
  total_dolares: number
  fijos_pesos: number
  variables_pesos: number
  por_origen: ResumenOrigen[]
  por_categoria: ResumenCategoriaMes[]
  top5: Top5Consumo[]
  consumos: ConsumoMes[]
}

export interface ResumenSemestral {
  mes: string
  total_pesos: number
  total_dolares: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: string
  details?: string
}
