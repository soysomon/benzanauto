const STORAGE_KEY = 'benzan_admin_token'

export function getStoredAdminToken() {
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setStoredAdminToken(token) {
  window.localStorage.setItem(STORAGE_KEY, token)
}

export function clearStoredAdminToken() {
  window.localStorage.removeItem(STORAGE_KEY)
}

