import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminMe, logoutAdmin } from '../lib/adminApi'
import {
  COOKIE_SESSION_TOKEN,
  clearStoredAdminToken,
  getStoredAdminToken,
  getStoredAdminUser,
  setStoredAdminSession,
} from '../lib/adminSession'
import { UNAUTHORIZED_EVENT_NAME } from '../lib/apiClient'

function getInitialSession() {
  const cachedUser = getStoredAdminUser()
  return cachedUser ? { user: cachedUser, session: null } : null
}

export function useAdminPageSession({ redirectOnMissingToken = true } = {}) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => getStoredAdminToken())
  const [session, setSession] = useState(() => getInitialSession())
  const [loading, setLoading] = useState(() => redirectOnMissingToken || Boolean(getStoredAdminUser()))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const clearSession = useCallback(() => {
    clearStoredAdminToken()
    setToken('')
    setSession(null)
  }, [])

  const refreshSession = useCallback(async (activeToken = token) => {
    setLoading(true)
    setRefreshing(true)
    setError('')

    try {
      const response = await getAdminMe(activeToken)
      setSession(response)
      setStoredAdminSession(activeToken || COOKIE_SESSION_TOKEN, response.user, {
        csrfToken: response.csrfToken ?? '',
        cookieBacked: true,
      })
      setToken(activeToken || COOKIE_SESSION_TOKEN)
      return response
    } catch (loadError) {
      clearSession()
      setError(loadError.message ?? 'Tu sesión ya no es válida.')
      if (redirectOnMissingToken) {
        navigate('/admin-login', {
          replace: true,
          state: { message: 'Tu sesión expiró. Vuelve a iniciar sesión.' },
        })
      }
      return null
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clearSession, navigate, redirectOnMissingToken, token])

  useEffect(() => {
    if (!redirectOnMissingToken && !token && !session?.user) {
      setLoading(false)
      return
    }

    let ignore = false

    refreshSession(token).then((response) => {
      if (ignore || response) return
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [navigate, redirectOnMissingToken, refreshSession, token])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
      setError('Tu sesión expiró o dejó de ser válida. Vuelve a iniciar sesión.')
      if (redirectOnMissingToken) {
        navigate('/admin-login', {
          replace: true,
          state: { message: 'Tu sesión expiró o dejó de ser válida.' },
        })
      }
    }

    window.addEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized)
  }, [clearSession, navigate, redirectOnMissingToken])

  const syncSession = useCallback((nextToken, user, sessionMeta = null, sessionOptions = {}) => {
    setStoredAdminSession(nextToken, user, {
      csrfToken: sessionOptions.csrfToken ?? '',
      cookieBacked: sessionOptions.cookieBacked ?? true,
    })
    setToken(COOKIE_SESSION_TOKEN)
    setSession({ user, session: sessionMeta })
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutAdmin(token)
      }
    } catch {
      // noop: local session should still be cleared
    } finally {
      clearSession()
      navigate('/admin-login', { replace: true })
    }
  }, [clearSession, navigate, token])

  return {
    token,
    session,
    user: session?.user ?? null,
    loading,
    refreshing,
    error,
    isSuperadmin: session?.user?.role === 'superadmin',
    refreshSession,
    setError,
    clearSession,
    syncSession,
    logout,
  }
}
