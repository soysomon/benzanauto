import { render, screen, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
}))

vi.mock('./components/layout/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('./components/layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('./hooks/useIdleActivation', () => ({
  default: () => true,
}))

vi.mock('./components/ui/CustomCursor', () => ({
  default: () => <div data-testid="custom-cursor">Cursor</div>,
}))

vi.mock('./components/ui/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">ChatWidget</div>,
}))

vi.mock('./components/campaigns/PromotionalCampaignModal', () => ({
  default: () => <div data-testid="promo-campaign-modal">PromoCampaignModal</div>,
}))

vi.mock('./pages/Home', () => ({
  default: () => <div>Home Page</div>,
}))

vi.mock('./pages/Inventario', () => ({
  default: () => <div>Inventario Page</div>,
}))

vi.mock('./pages/VehiculoDetalle', () => ({
  default: () => <div>Vehiculo Detalle Page</div>,
}))

vi.mock('./pages/Taller', () => ({
  default: () => <div>Taller Page</div>,
}))

vi.mock('./pages/BarGrill', () => ({
  default: () => <div>Bar & Grill Page</div>,
}))

vi.mock('./pages/BombaGasolina', () => ({
  default: () => <div>Bomba Gasolina Page</div>,
}))

vi.mock('./pages/Nosotros', () => ({
  default: () => <div>Nosotros Page</div>,
}))

vi.mock('./pages/Contacto', () => ({
  default: () => <div>Contacto Page</div>,
}))

vi.mock('./pages/NotFoundPage', () => ({
  default: () => <div>Not Found Page</div>,
}))

vi.mock('./pages/AdminLoginPage', () => ({
  default: () => <div>Admin Login Page</div>,
}))

vi.mock('./pages/AdminDashboardPage', () => ({
  default: () => <div>Admin Dashboard Page</div>,
}))

vi.mock('./pages/AdminForgotPasswordPage', () => ({
  default: () => <div>Admin Forgot Password Page</div>,
}))

vi.mock('./pages/AdminResetPasswordPage', () => ({
  default: () => <div>Admin Reset Password Page</div>,
}))

vi.mock('./pages/AdminUsersPage', () => ({
  default: () => <div>Admin Users Page</div>,
}))

vi.mock('./pages/AdminAuditPage', () => ({
  default: () => <div>Admin Audit Page</div>,
}))

vi.mock('./pages/AdminSecurityPage', () => ({
  default: () => <div>Admin Security Page</div>,
}))

vi.mock('./pages/AdminCampaignsPage', () => ({
  default: () => <div>Admin Campaigns Page</div>,
}))

describe('App critical routing', () => {
  function renderApp() {
    return render(
      <HelmetProvider>
        <App />
      </HelmetProvider>,
    )
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders public chrome on public routes', async () => {
    window.history.pushState({}, '', '/')

    renderApp()

    expect(await screen.findByText('Home Page')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /saltar al contenido principal/i })).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('chat-widget')).toBeInTheDocument()
    expect(screen.getByTestId('custom-cursor')).toBeInTheDocument()
    expect(screen.getByTestId('promo-campaign-modal')).toBeInTheDocument()
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('redirects /login to /admin-login and removes public chrome', async () => {
    window.history.pushState({}, '', '/login')

    renderApp()

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin-login')
    })

    expect(await screen.findByText('Admin Login Page')).toBeInTheDocument()
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument()
    expect(screen.queryByTestId('custom-cursor')).not.toBeInTheDocument()
  })

  it('redirects legacy /dashboard to /admin', async () => {
    window.history.pushState({}, '', '/dashboard')

    renderApp()

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin')
    })

    expect(await screen.findByText('Admin Dashboard Page')).toBeInTheDocument()
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
  })

  it('renders a controlled 404 route instead of leaving the screen blank', async () => {
    window.history.pushState({}, '', '/ruta-inexistente')

    renderApp()

    expect(await screen.findByText('Not Found Page')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
