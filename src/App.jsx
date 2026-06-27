import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CustomCursor from './components/ui/CustomCursor'
import ChatWidget from './components/ui/ChatWidget'
import Home from './pages/Home'
import Inventario from './pages/Inventario'
import VehiculoDetalle from './pages/VehiculoDetalle'
import Taller from './pages/Taller'
import BarGrill from './pages/BarGrill'
import BombaGasolina from './pages/BombaGasolina'
import Nosotros from './pages/Nosotros'
import Contacto from './pages/Contacto'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminForgotPasswordPage from './pages/AdminForgotPasswordPage'
import AdminResetPasswordPage from './pages/AdminResetPasswordPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAuditPage from './pages/AdminAuditPage'
import AdminSecurityPage from './pages/AdminSecurityPage'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
}

const pageTransition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1],
  duration: 0.4,
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/vehiculo/:slug" element={<VehiculoDetalle />} />
            <Route path="/taller" element={<Taller />} />
            <Route path="/bar-grill" element={<BarGrill />} />
            <Route path="/bomba-gasolina" element={<BombaGasolina />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Navigate to="/admin-login" replace />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
            <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/security" element={<AdminSecurityPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatWidget />}
    </>
  )
}

export default function App() {
  return (
    <Router>
      <RouteAwareChrome />
    </Router>
  )
}

function RouteAwareChrome() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <CustomCursor />}
      <ScrollToTop />
      <main>
        <AnimatedRoutes />
      </main>
    </>
  )
}
