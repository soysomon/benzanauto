import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import RouteSeoDefaults from './components/seo/RouteSeoDefaults'
import useIdleActivation from './hooks/useIdleActivation'
import { RouteLoader } from './components/ui/RouteLoader'
import {
  loadAdminAuditPage,
  loadAdminDashboardPage,
  loadAdminForgotPasswordPage,
  loadAdminLoginPage,
  loadAdminResetPasswordPage,
  loadAdminSecurityPage,
  loadAdminUsersPage,
  loadBarGrillPage,
  loadBombaGasolinaPage,
  loadChatWidget,
  loadContactoPage,
  loadCustomCursor,
  loadHomePage,
  loadInventarioPage,
  loadNotFoundPage,
  loadNosotrosPage,
  loadTallerPage,
  loadVehiculoDetallePage,
} from './lib/routeModules'

const CustomCursor = lazy(loadCustomCursor)
const ChatWidget = lazy(loadChatWidget)
const Home = lazy(loadHomePage)
const Inventario = lazy(loadInventarioPage)
const VehiculoDetalle = lazy(loadVehiculoDetallePage)
const Taller = lazy(loadTallerPage)
const BarGrill = lazy(loadBarGrillPage)
const BombaGasolina = lazy(loadBombaGasolinaPage)
const Nosotros = lazy(loadNosotrosPage)
const Contacto = lazy(loadContactoPage)
const NotFoundPage = lazy(loadNotFoundPage)
const AdminLoginPage = lazy(loadAdminLoginPage)
const AdminDashboardPage = lazy(loadAdminDashboardPage)
const AdminForgotPasswordPage = lazy(loadAdminForgotPasswordPage)
const AdminResetPasswordPage = lazy(loadAdminResetPasswordPage)
const AdminUsersPage = lazy(loadAdminUsersPage)
const AdminAuditPage = lazy(loadAdminAuditPage)
const AdminSecurityPage = lazy(loadAdminSecurityPage)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppRoutes() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <Suspense fallback={<RouteLoader admin={isAdminRoute} />}>
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
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
  const deferredPublicChromeReady = useIdleActivation(!isAdminRoute)

  return (
    <>
      {!isAdminRoute && deferredPublicChromeReady ? (
        <Suspense fallback={null}>
          <CustomCursor />
        </Suspense>
      ) : null}
      <RouteSeoDefaults />
      <ScrollToTop />
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:font-semibold focus:text-neutral-900 focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      {!isAdminRoute ? <Navbar /> : null}
      <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">
        <AppRoutes />
      </main>
      {!isAdminRoute ? <Footer /> : null}
      {!isAdminRoute && deferredPublicChromeReady ? (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      ) : null}
    </>
  )
}
