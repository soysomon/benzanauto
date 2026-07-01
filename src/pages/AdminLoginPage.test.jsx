import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLoginPage from './AdminLoginPage'

const getAdminMeMock = vi.fn()
const loginAdminMock = vi.fn()
const clearStoredAdminTokenMock = vi.fn()
const getStoredAdminTokenMock = vi.fn()
const setStoredAdminSessionMock = vi.fn()
const isCookieBackedAdminSessionTokenMock = vi.fn()

vi.mock('../components/admin/AdminAuthLayout', () => ({
  default: ({ eyebrow, title, description, children, footer }) => (
    <div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
      {footer}
    </div>
  ),
}))

vi.mock('../lib/adminApi', () => ({
  getAdminMe: (...args) => getAdminMeMock(...args),
  loginAdmin: (...args) => loginAdminMock(...args),
}))

vi.mock('../lib/adminSession', () => ({
  COOKIE_SESSION_TOKEN: '__cookie_session__',
  clearStoredAdminToken: () => clearStoredAdminTokenMock(),
  getStoredAdminToken: () => getStoredAdminTokenMock(),
  isCookieBackedAdminSessionToken: (...args) => isCookieBackedAdminSessionTokenMock(...args),
  setStoredAdminSession: (...args) => setStoredAdminSessionMock(...args),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}{location.search}</div>
}

function renderPage(initialPath = '/admin-login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <LocationProbe />
              <AdminLoginPage />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStoredAdminTokenMock.mockReturnValue(null)
    isCookieBackedAdminSessionTokenMock.mockReturnValue(false)
    getAdminMeMock.mockRejectedValue(new Error('UNAUTHORIZED'))
  })

  it('clears a stale cookie-backed marker instead of bouncing blindly to /admin', async () => {
    getStoredAdminTokenMock.mockReturnValue('__cookie_session__')
    isCookieBackedAdminSessionTokenMock.mockReturnValue(true)

    renderPage()

    await waitFor(() => {
      expect(clearStoredAdminTokenMock).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByTestId('location')).toHaveTextContent('/admin-login')
  })

  it('shows a targeted error when the browser does not activate the cookie session after login', async () => {
    loginAdminMock.mockResolvedValue({
      user: { id: 'user-1', mustChangePassword: true },
      csrfToken: 'csrf-login',
    })

    getAdminMeMock
      .mockRejectedValueOnce(new Error('UNAUTHORIZED'))
      .mockResolvedValueOnce(null)

    renderPage()

    fireEvent.change(screen.getByLabelText(/usuario o correo/i), {
      target: { value: 'superadmin' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'TuClaveTemporalSegura123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar al panel/i }))

    expect(
      await screen.findByText(/no pudimos activar la sesión en este navegador/i),
    ).toBeInTheDocument()

    expect(clearStoredAdminTokenMock).toHaveBeenCalled()
    expect(screen.getByTestId('location')).toHaveTextContent('/admin-login')
  })
})
