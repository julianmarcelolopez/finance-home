import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Planificacion from './pages/Planificacion'
import Proyectos from './pages/Proyectos'
import Inversiones from './pages/Inversiones'
import GastosFijos from './pages/GastosFijos'
import Ingresos from './pages/Ingresos'
import Etiquetas from './pages/Etiquetas'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="gastos-fijos" element={<GastosFijos />} />
            <Route path="ingresos" element={<Ingresos />} />
            <Route path="etiquetas" element={<Etiquetas />} />
            <Route path="planificacion" element={<Planificacion />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="inversiones" element={<Inversiones />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
