const STORAGE_KEY = 'benzan_admin_token'
const USER_STORAGE_KEY = 'benzan_admin_user'
const CSRF_STORAGE_KEY = 'benzan_admin_csrf_token'

export const COOKIE_SESSION_TOKEN = '__cookie_session__'

function getSessionStorage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function getLegacyStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readStorageValue(key) {
  const sessionStorage = getSessionStorage()
  const sessionValue = sessionStorage?.getItem(key)
  if (sessionValue !== null && sessionValue !== undefined) {
    return sessionValue
  }

  const legacyStorage = getLegacyStorage()
  const legacyValue = legacyStorage?.getItem(key)
  if (legacyValue !== null && legacyValue !== undefined && sessionStorage) {
    sessionStorage.setItem(key, legacyValue)
    legacyStorage.removeItem(key)
  }

  return legacyValue ?? null
}

function setStorageValue(key, value) {
  const sessionStorage = getSessionStorage()
  if (sessionStorage) {
    sessionStorage.setItem(key, value)
  }

  const legacyStorage = getLegacyStorage()
  legacyStorage?.removeItem(key)
}

function removeStorageValue(key) {
  getSessionStorage()?.removeItem(key)
  getLegacyStorage()?.removeItem(key)
}

export function isCookieBackedAdminSessionToken(token) {
  return token === COOKIE_SESSION_TOKEN
}

export function getStoredAdminToken() {
  return readStorageValue(STORAGE_KEY)
}

export function getStoredAdminCsrfToken() {
  return readStorageValue(CSRF_STORAGE_KEY)
}

export function getStoredAdminUser() {
  const rawUser = readStorageValue(USER_STORAGE_KEY)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    removeStorageValue(USER_STORAGE_KEY)
    return null
  }
}

export function setStoredAdminToken(token) {
  if (!token) {
    removeStorageValue(STORAGE_KEY)
    return
  }

  setStorageValue(STORAGE_KEY, token)
}

export function setStoredAdminCsrfToken(token) {
  if (!token) {
    removeStorageValue(CSRF_STORAGE_KEY)
    return
  }

  setStorageValue(CSRF_STORAGE_KEY, token)
}

export function setStoredAdminUser(user) {
  if (!user) {
    removeStorageValue(USER_STORAGE_KEY)
    return
  }

  setStorageValue(USER_STORAGE_KEY, JSON.stringify(user))
}

export function setStoredAdminSession(token, user, { csrfToken = '', cookieBacked = false } = {}) {
  setStoredAdminToken(cookieBacked ? COOKIE_SESSION_TOKEN : token)
  setStoredAdminUser(user)
  setStoredAdminCsrfToken(csrfToken)
}

export function clearStoredAdminToken() {
  removeStorageValue(STORAGE_KEY)
  removeStorageValue(USER_STORAGE_KEY)
  removeStorageValue(CSRF_STORAGE_KEY)
}
