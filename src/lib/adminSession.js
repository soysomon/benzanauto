const STORAGE_KEY = 'benzan_admin_token'
const USER_STORAGE_KEY = 'benzan_admin_user'

export function getStoredAdminToken() {
  return window.localStorage.getItem(STORAGE_KEY)
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
  window.localStorage.setItem(STORAGE_KEY, token)
}

export function setStoredAdminUser(user) {
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function setStoredAdminSession(token, user) {
  setStoredAdminToken(token)
  setStoredAdminUser(user)
}

export function clearStoredAdminToken() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}
