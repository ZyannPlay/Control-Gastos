import { lazy, Suspense, useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import NuevoGasto from './pages/NuevoGasto'
import Movimientos from './pages/Movimientos'
import Ajustes from './pages/Ajustes'
import { syncRecurring } from './lib/syncRecurring'
import { initNative } from './lib/native'
import Privacidad from './pages/Privacidad'
import EliminarCuenta from './pages/EliminarCuenta'

const Presupuestos = lazy(() => import('./pages/Presupuestos'))
const Fijos = lazy(() => import('./pages/Fijos'))
const Reportes = lazy(() => import('./pages/Reportes'))

export default function App() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pathRef = useRef(pathname)
  pathRef.current = pathname
  useEffect(() => initNative((d) => navigate(d), () => pathRef.current), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) void syncRecurring().catch(() => {})
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (pathname === '/privacidad' || pathname === '/eliminar-cuenta') {
    return (
      <Routes>
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/eliminar-cuenta" element={<EliminarCuenta user={!!user} />} />
      </Routes>
    )
  }
  if (loading) return <div className="grid h-dvh place-items-center text-slate-500">Cargando…</div>
  if (!user) return <Login />
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-20">
      <Suspense fallback={<div className="p-6 text-center text-slate-500">Cargando…</div>}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/nuevo" element={<NuevoGasto />} />
        <Route path="/editar/:id" element={<NuevoGasto />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/fijos" element={<Fijos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Suspense>
      <BottomNav />
    </div>
  )
}
