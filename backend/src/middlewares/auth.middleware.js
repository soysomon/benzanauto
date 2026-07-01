import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AdminSession } from '../models/AdminSession.js'
import { User } from '../models/User.js'
import { forbidden, unauthorized } from '../utils/api-error.js'
import {
  createAdminCsrfToken,
  extractAdminSessionTokenFromRequest,
  getAdminCsrfHeaderValue,
  isSafeHttpMethod,
  safeCompareTokens,
} from '../utils/admin-auth-cookie.js'
import { updateRequestContext } from '../utils/request-context-store.js'

export async function authenticateAdmin(req, _res, next) {
  try {
    const { token, transport } = extractAdminToken(req)
    if (!token) return next(unauthorized('Debes iniciar sesion para acceder.'))

    const payload = jwt.verify(token, env.JWT_SECRET)
    if (!payload?.sub || !payload?.sessionId) {
      return next(unauthorized('El token enviado no es valido.'))
    }

    const [user, session] = await Promise.all([
      User.findById(payload.sub),
      AdminSession.findById(payload.sessionId),
    ])

    if (!user || user.deletedAt || !user.isActive || user.isBlocked) {
      return next(unauthorized('Tu usuario no esta activo o ya no existe.'))
    }

    if (!session || session.revokedAt || session.user.toString() !== user.id) {
      return next(unauthorized('La sesion ya no es valida.'))
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return next(unauthorized('La sesion ha expirado.'))
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return next(unauthorized('El token ya no es valido para este usuario.'))
    }

    if (!session.csrfToken) {
      session.csrfToken = createAdminCsrfToken()
    }

    req.auth = {
      token,
      transport,
      viaCookie: transport === 'cookie',
      payload,
      user,
      session,
    }

    updateRequestContext({
      userId: user.id,
      userRole: user.role,
      authTransport: transport,
      sessionId: session.id,
    })

    session.lastSeenAt = new Date()
    void session.save().catch(() => {})

    return next()
  } catch {
    return next(unauthorized('No se pudo validar la sesion.'))
  }
}

export function requireAdminCsrf(req, _res, next) {
  if (isSafeHttpMethod(req.method)) {
    return next()
  }

  if (req.auth?.transport !== 'cookie') {
    return next()
  }

  const csrfHeaderValue = getAdminCsrfHeaderValue(req)
  if (!safeCompareTokens(csrfHeaderValue, req.auth?.session?.csrfToken)) {
    return next(forbidden('No se pudo validar la solicitud segura. Recarga e intenta nuevamente.'))
  }

  return next()
}

function extractBearerToken(req) {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

function extractAdminToken(req) {
  const bearerToken = extractBearerToken(req)
  if (bearerToken) {
    return {
      token: bearerToken,
      transport: 'bearer',
    }
  }

  const cookieToken = extractAdminSessionTokenFromRequest(req)
  if (cookieToken) {
    return {
      token: cookieToken,
      transport: 'cookie',
    }
  }

  return {
    token: null,
    transport: null,
  }
}
