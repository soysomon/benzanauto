import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
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

vi.mock('./components/ui/CustomCursor', () => ({
  default: () => <div data-testid="custom-cursor">Cursor</div>,
}))

vi.mock('./components/ui/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">ChatWidget</div>,
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

describe('App critical routing', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders public chrome on public routes', () => {
    window.history.pushState({}, '', '/')

    render(<App />)

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('chat-widget')).toBeInTheDocument()
    expect(screen.getByTestId('custom-cursor')).toBeInTheDocument()
  })

  it('redirects /login to /admin-login and removes public chrome', async () => {
    window.history.pushState({}, '', '/login')

    render(<App />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin-login')
    })

    expect(screen.getByText('Admin Login Page')).toBeInTheDocument()
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument()
    expect(screen.queryByTestId('custom-cursor')).not.toBeInTheDocument()
  })

  it('redirects legacy /dashboard to /admin', async () => {
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin')
    })

    expect(screen.getByText('Admin Dashboard Page')).toBeInTheDocument()
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
  })
})
