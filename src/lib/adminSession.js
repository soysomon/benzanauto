const STORAGE_KEY = 'benzan_admin_token'
const USER_STORAGE_KEY = 'benzan_admin_user'
const CSRF_STORAGE_KEY = 'benzan_admin_csrf_token'

export const COOKIE_SESSION_TOKEN = '__cookie_session__'

export function isCookieBackedAdminSessionToken(token) {
  return token === COOKIE_SESSION_TOKEN
}

export function getStoredAdminToken() {
  return window.localStorage.getItem(STORAGE_KEY)
}

export function getStoredAdminCsrfToken() {
  return window.localStorage.getItem(CSRF_STORAGE_KEY)
}

export function getStoredAdminUser() {
  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function setStoredAdminToken(token) {
  if (!token) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, token)
}

export function setStoredAdminCsrfToken(token) {
  if (!token) {
    window.localStorage.removeItem(CSRF_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(CSRF_STORAGE_KEY, token)
}

export function setStoredAdminUser(user) {
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function setStoredAdminSession(token, user, { csrfToken = '', cookieBacked = false } = {}) {
  setStoredAdminToken(cookieBacked ? COOKIE_SESSION_TOKEN : token)
  setStoredAdminUser(user)
  setStoredAdminCsrfToken(csrfToken)
}

export function clearStoredAdminToken() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
  window.localStorage.removeItem(CSRF_STORAGE_KEY)
}
