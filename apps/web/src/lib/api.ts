import axios from 'axios'
import { supabase } from './supabase'
import type {
  DashboardResumen,
  ConsumoTarjeta,
  ResumenTarjeta,
  Tarjeta,
  TarjetaCreate,
  GastoFijo,
  GastoFijoCreate,
  FlujoCajaMes,
  Proyecto,
  ProyectoCreate,
  PaginatedResponse,
  Categoria,
  ComercioCategoria,
  DetalleMes,
  ResumenSemestral,
  SemestreResumen,
  Prestamo,
  CuotaPrestamo,
  PrestamoConCuotasCreate,
  CuotaMesResumen,
  GastoMercadopago,
  GastoMercadopagoCreate,
  ResumenMensualProyectado,
  Ingreso,
  IngresoCreate,
} from '@financehome/shared'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

// Adjuntar token Supabase en cada request
http.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export const api = {
  dashboard: {
    resumen: () => http.get<DashboardResumen>('/api/dashboard/resumen').then((r) => r.data),
  },

  consumos: {
    listar: (params: { mes?: string; banco?: string; adicional?: boolean; tarjeta_id?: string; resumen_id?: string; categoria_id?: string; es_fijo?: boolean; page?: number }) =>
      http
        .get<PaginatedResponse<ConsumoTarjeta>>('/api/consumos', { params })
        .then((r) => r.data),
    actualizar: (id: string, body: { es_fijo?: boolean; categoria_id?: string | null }) =>
      http.patch<ConsumoTarjeta>(`/api/consumos/${id}`, body).then((r) => r.data),
  },

  etiquetas: {
    _cache: null as Categoria[] | null,
    listar() {
      if (this._cache) return Promise.resolve(this._cache)
      return http.get<Categoria[]>('/api/etiquetas').then((r) => {
        this._cache = r.data
        return r.data
      })
    },
    crear(body: { nombre: string; color: string; icono: string }) {
      this._cache = null
      return http.post<Categoria>('/api/etiquetas', body).then((r) => r.data)
    },
    patrones: {
      listar: () =>
        http.get<ComercioCategoria[]>('/api/etiquetas/patrones').then((r) => r.data),
      crear: (body: { patron: string; categoria_id: string; es_fijo: boolean }) =>
        http
          .post<{ patron: ComercioCategoria; afectados: number }>('/api/etiquetas/patrones', body)
          .then((r) => r.data),
      eliminar: (id: string) => http.delete(`/api/etiquetas/patrones/${id}`),
    },
  },

  resumenes: {
    listar: (params?: { banco?: string; titular?: string; tarjeta_id?: string; page?: number }) =>
      http
        .get<PaginatedResponse<ResumenTarjeta>>('/api/resumenes', { params })
        .then((r) => r.data),
  },

  gastosFijos: {
    listar: (params?: { activo?: boolean; persona?: string }) =>
      http.get<GastoFijo[]>('/api/gastos-fijos', { params }).then((r) => r.data),
    crear: (body: GastoFijoCreate) =>
      http.post<GastoFijo>('/api/gastos-fijos', body).then((r) => r.data),
    actualizar: (id: string, body: Partial<GastoFijo>) =>
      http.patch<GastoFijo>(`/api/gastos-fijos/${id}`, body).then((r) => r.data),
  },

  planificacion: {
    flujo: (año: number) =>
      http.get<FlujoCajaMes[]>(`/api/planificacion/${año}`).then((r) => r.data),
  },

  tarjetas: {
    listar: (params?: { incluir_inactivas?: boolean }) =>
      http.get<Tarjeta[]>('/api/tarjetas', { params }).then((r) => r.data),
    crear: (body: TarjetaCreate) =>
      http.post<Tarjeta>('/api/tarjetas', body).then((r) => r.data),
    toggleActivo: (id: string, activo: boolean) =>
      http.patch<Tarjeta>(`/api/tarjetas/${id}`, { activo }).then((r) => r.data),
  },

  proyectos: {
    listar: () => http.get<Proyecto[]>('/api/proyectos').then((r) => r.data),
    crear: (body: ProyectoCreate) =>
      http.post<Proyecto>('/api/proyectos', body).then((r) => r.data),
    aporte: (id: string, monto: number) =>
      http.patch<Proyecto>(`/api/proyectos/${id}/aporte`, { monto }).then((r) => r.data),
  },

  gastosDashboard: {
    mes: (mes: string) =>
      http.get<DetalleMes>('/api/gastos-dashboard/mes', { params: { mes } }).then((r) => r.data),
    semestral: () =>
      http.get<ResumenSemestral[]>('/api/gastos-dashboard/semestral').then((r) => r.data),
    semestre: (año: number, semestre: 1 | 2) =>
      http.get<SemestreResumen>('/api/gastos-dashboard/semestre', { params: { año, semestre } }).then((r) => r.data),
  },

  ingresos: {
    listar: (params?: { persona?: string; año?: number; mes?: number }) =>
      http.get<Ingreso[]>('/api/ingresos', { params }).then((r) => r.data),
    crear: (body: IngresoCreate) =>
      http.post<Ingreso>('/api/ingresos', body).then((r) => r.data),
    actualizar: (id: string, body: Partial<IngresoCreate>) =>
      http.patch<Ingreso>(`/api/ingresos/${id}`, body).then((r) => r.data),
    eliminar: (id: string) => http.delete(`/api/ingresos/${id}`),
  },

  prestamos: {
    listar: (params?: { persona?: string }) =>
      http.get<Prestamo[]>('/api/prestamos', { params }).then((r) => r.data),
    obtener: (id: string) =>
      http.get<Prestamo>(`/api/prestamos/${id}`).then((r) => r.data),
    crear: (body: PrestamoConCuotasCreate) =>
      http.post<{ prestamo: Prestamo; cuotas: CuotaPrestamo[] }>('/api/prestamos', body).then((r) => r.data),
    actualizar: (id: string, body: Partial<Prestamo>) =>
      http.patch<Prestamo>(`/api/prestamos/${id}`, body).then((r) => r.data),
    cuotasMes: (mes: string) =>
      http.get<CuotaMesResumen[]>('/api/prestamos/cuotas-mes', { params: { mes } }).then((r) => r.data),
    actualizarCuota: (id: string, cuotaId: string, body: { pagada?: boolean; monto_total?: number }) =>
      http.patch<CuotaPrestamo>(`/api/prestamos/${id}/cuotas/${cuotaId}`, body).then((r) => r.data),
  },

  gastosMercadopago: {
    listar: (params?: { mes?: string; persona?: string; categoria_id?: string; page?: number }) =>
      http
        .get<PaginatedResponse<GastoMercadopago>>('/api/gastos-mercadopago', { params })
        .then((r) => r.data),
    crear: (body: GastoMercadopagoCreate) =>
      http.post<GastoMercadopago>('/api/gastos-mercadopago', body).then((r) => r.data),
    actualizar: (id: string, body: Partial<GastoMercadopagoCreate>) =>
      http.patch<GastoMercadopago>(`/api/gastos-mercadopago/${id}`, body).then((r) => r.data),
    eliminar: (id: string) => http.delete(`/api/gastos-mercadopago/${id}`),
  },

  gastosResumenMensual: {
    mes: (mes: string) =>
      http.get<ResumenMensualProyectado>('/api/gastos-resumen-mensual', { params: { mes } }).then((r) => r.data),
  },
}
