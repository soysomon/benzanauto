import { describe, expect, it } from 'vitest'
import {
  clearStoredAdminToken,
  COOKIE_SESSION_TOKEN,
  getStoredAdminCsrfToken,
  getStoredAdminToken,
  getStoredAdminUser,
  setStoredAdminSession,
} from '../adminSession'

describe('adminSession storage hardening', () => {
  it('stores cookie-backed admin session data in sessionStorage', () => {
    setStoredAdminSession(COOKIE_SESSION_TOKEN, { id: 'user-1', role: 'admin' }, {
      csrfToken: 'csrf-session-token',
      cookieBacked: true,
    })

    expect(window.sessionStorage.getItem('benzan_admin_token')).toBe(COOKIE_SESSION_TOKEN)
    expect(window.localStorage.getItem('benzan_admin_token')).toBeNull()
    expect(getStoredAdminToken()).toBe(COOKIE_SESSION_TOKEN)
    expect(getStoredAdminCsrfToken()).toBe('csrf-session-token')
    expect(getStoredAdminUser()).toEqual({ id: 'user-1', role: 'admin' })
  })

  it('migrates legacy localStorage values into sessionStorage transparently', () => {
    window.localStorage.setItem('benzan_admin_token', COOKIE_SESSION_TOKEN)
    window.localStorage.setItem('benzan_admin_csrf_token', 'legacy-csrf')
    window.localStorage.setItem('benzan_admin_user', JSON.stringify({ id: 'legacy-user', role: 'editor' }))

    expect(getStoredAdminToken()).toBe(COOKIE_SESSION_TOKEN)
    expect(getStoredAdminCsrfToken()).toBe('legacy-csrf')
    expect(getStoredAdminUser()).toEqual({ id: 'legacy-user', role: 'editor' })
    expect(window.sessionStorage.getItem('benzan_admin_token')).toBe(COOKIE_SESSION_TOKEN)
    expect(window.localStorage.getItem('benzan_admin_token')).toBeNull()
  })

  it('clears both storages when the admin session is removed', () => {
    setStoredAdminSession(COOKIE_SESSION_TOKEN, { id: 'user-2', role: 'superadmin' }, {
      csrfToken: 'csrf-clear-test',
      cookieBacked: true,
    })
    window.localStorage.setItem('benzan_admin_token', COOKIE_SESSION_TOKEN)

    clearStoredAdminToken()

    expect(window.sessionStorage.getItem('benzan_admin_token')).toBeNull()
    expect(window.sessionStorage.getItem('benzan_admin_csrf_token')).toBeNull()
    expect(window.sessionStorage.getItem('benzan_admin_user')).toBeNull()
    expect(window.localStorage.getItem('benzan_admin_token')).toBeNull()
  })
})
