import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, CalendarDays, Target, TrendingUp, LogOut, Repeat2, Tag, Wallet } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/gastos-fijos', label: 'Gastos Fijos', icon: Repeat2 },
  { to: '/ingresos', label: 'Ingresos', icon: Wallet },
  { to: '/etiquetas', label: 'Etiquetas', icon: Tag },
  { to: '/planificacion', label: 'Planificación', icon: CalendarDays },
  { to: '/proyectos', label: 'Proyectos', icon: Target },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold tracking-tight">FinanceHome</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
