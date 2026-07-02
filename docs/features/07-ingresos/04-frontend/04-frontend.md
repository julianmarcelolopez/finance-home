# 07-04 — Frontend — Página Ingresos

## Estado

- [x] Completado — 2026-07-01

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `apps/web/src/pages/Ingresos.tsx` | Crear |
| `apps/web/src/components/Layout.tsx` | Agregar ítem al sidebar |
| `apps/web/src/App.tsx` | Agregar ruta `/ingresos` |
| `apps/web/src/lib/api.ts` | Agregar cliente `ingresos` |
| `packages/shared/types/index.ts` | Agregar `IngresoCreate` |

## Layout.tsx — cambio en sidebar

```typescript
import { ..., Wallet } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/gastos-fijos', label: 'Gastos Fijos', icon: Repeat2 },
  { to: '/ingresos', label: 'Ingresos', icon: Wallet },       // ← nuevo
  { to: '/etiquetas', label: 'Etiquetas', icon: Tag },
  { to: '/planificacion', label: 'Planificación', icon: CalendarDays },
  { to: '/proyectos', label: 'Proyectos', icon: Target },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp },
]
```

## api.ts — cliente ingresos

```typescript
ingresos: {
  listar: (params?: { persona?: string; año?: number; mes?: number }) =>
    http.get<Ingreso[]>('/api/ingresos', { params }).then(r => r.data),
  crear: (body: IngresoCreate) =>
    http.post<Ingreso>('/api/ingresos', body).then(r => r.data),
  actualizar: (id: string, body: Partial<IngresoCreate>) =>
    http.patch<Ingreso>(`/api/ingresos/${id}`, body).then(r => r.data),
  eliminar: (id: string) =>
    http.delete(`/api/ingresos/${id}`),
},
```

## Ingresos.tsx — estructura de la página

### Estado local

```typescript
const [ingresos, setIngresos] = useState<Ingreso[]>([])
const [filtroPersona, setFiltroPersona] = useState<string>('')
const [modalOpen, setModalOpen] = useState(false)
const [editando, setEditando] = useState<Ingreso | null>(null)
```

### Agrupación por mes

Los ingresos se agrupan por `YYYY-MM` de la fecha para mostrar secciones mensuales.
Dentro de cada mes se muestran subtotales ARS y USD por persona.

### Modal — campos del formulario

| Campo | Tipo | Opciones |
|-------|------|---------|
| Descripción | text input | libre |
| Monto | number input | positivo |
| Moneda | select | ARS / USD |
| Persona | select | Julian / Patricia / Compartido |
| Tipo | select | Sueldo / Freelance / Renta / Otro |
| Fecha | date input | |

### Acciones por fila

- **Editar** → abre el modal con los datos precargados
- **Eliminar** → confirm dialog → DELETE

## Criterios de aceptación

- [ ] El sidebar muestra "Ingresos" entre "Gastos Fijos" y "Etiquetas"
- [ ] La página lista todos los ingresos agrupados por mes, más reciente primero
- [ ] Filtro por persona funciona sin recargar la página
- [ ] Se puede crear un ingreso desde el modal y aparece en la lista inmediatamente
- [ ] Se puede editar un ingreso existente
- [ ] Se puede eliminar con confirmación
- [ ] Subtotales ARS y USD correctos por mes
- [ ] Funciona en producción (EasyPanel)
