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

export type Moneda = 'ARS' | 'USD' | 'UVA'
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

export interface ProximaCuotaPrestamo {
  banco: string
  tipo: string
  persona: Persona
  numero_cuota: number
  total_cuotas: number
  fecha_vencimiento: string
  monto_total: number
}

export interface DashboardResumen {
  mes_actual: string
  total_consumos_pesos: number
  total_consumos_dolares: number
  gastos_fijos_mes_ars: number
  proyectos_activos: number
  proximos_vencimientos: ResumenTarjeta[]
  tipo_cambio: TipoCambio
  proxima_cuota_prestamo?: ProximaCuotaPrestamo | null
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

export interface ResumenTarjetaMes {
  tarjeta_id: string
  nombre: string
  pesos: number
  dolares: number
}

export interface DetalleMes {
  mes: string
  total_pesos: number
  total_dolares: number
  fijos_pesos: number
  variables_pesos: number
  tarjetas_mes?: ResumenTarjetaMes[]
  cuotas_prestamos_ars?: number
  cuotas_prestamos?: CuotaMesResumen[]
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

// --- Vista semestral ---

export interface FilaSemestre {
  nombre: string
  tipo: 'tarjeta' | 'prestamo' | 'gastos_fijos'
  meses: Record<string, number> // YYYY-MM → ARS
}

export interface SemestreResumen {
  año: number
  semestre: 1 | 2
  meses: string[]                // lista ordenada de YYYY-MM del semestre
  filas: FilaSemestre[]
  totales: Record<string, number> // YYYY-MM → total ARS
}

// --- Préstamos ---

export interface CuotaPrestamo {
  id: string
  prestamo_id: string
  numero_cuota: number
  fecha_vencimiento: string
  monto_total: number
  interes_nominal: number | null
  sellos: number | null
  iva_interes: number | null
  amortizacion: number | null
  pagada: boolean
  created_at: string
}

export interface Prestamo {
  id: string
  numero: string
  banco: string
  tipo: string
  tasa: number | null
  sistema_amortizacion: string | null
  monto_solicitado: number
  capital_adeudado: number | null
  moneda: Moneda
  persona: Persona
  cuenta_debito: string | null
  activo: boolean
  created_at: string
  cuotas?: CuotaPrestamo[]
}

export interface PrestamoCreate {
  numero: string
  banco: string
  tipo: string
  tasa?: number
  sistema_amortizacion?: string
  monto_solicitado: number
  capital_adeudado?: number
  moneda: Moneda
  persona: Persona
  cuenta_debito?: string
}

export interface CuotaPrestamoCreate {
  numero_cuota: number
  fecha_vencimiento: string
  monto_total: number
  interes_nominal?: number
  sellos?: number
  iva_interes?: number
  amortizacion?: number
  pagada?: boolean
}

export interface PrestamoConCuotasCreate {
  prestamo: PrestamoCreate
  cuotas: CuotaPrestamoCreate[]
}

export interface CuotaMesResumen {
  prestamo_id: string
  banco: string
  tipo: string
  persona: Persona
  numero_cuota: number
  total_cuotas: number
  fecha_vencimiento: string
  monto_total: number
  pagada: boolean
}
