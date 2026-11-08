import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useSesion } from './data/store'
import Caja from './pages/Caja'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import Inventario from './pages/Inventario'
import Login from './pages/Login'
import Resumen from './pages/Resumen'
import Ventas from './pages/Ventas'

export default function App() {
  const location = useLocation()
  const sesion = useSesion()

  // Al cambiar de página, sube al inicio con suavidad
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  // Tema guardado también en la pantalla de login
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', localStorage.getItem('tema') === 'oscuro')
    } catch {
      /* nada */
    }
  }, [])

  if (location.pathname === '/login') {
    return sesion ? <Navigate to="/" replace /> : (
      <MotionConfig reducedMotion="user">
        <Login />
      </MotionConfig>
    )
  }
  if (!sesion) return <Navigate to="/login" replace />

  return (
    <MotionConfig reducedMotion="user">
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Resumen />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="*" element={<Resumen />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </MotionConfig>
  )
}
