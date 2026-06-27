import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AdminSession } from '../models/AdminSession.js'
import { User } from '../models/User.js'
import { unauthorized } from '../utils/api-error.js'

export async function authenticateAdmin(req, _res, next) {
  try {
    const token = extractBearerToken(req)
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

    req.auth = {
      token,
      payload,
      user,
      session,
    }

    session.lastSeenAt = new Date()
    void session.save().catch(() => {})

    return next()
  } catch {
    return next(unauthorized('No se pudo validar la sesion.'))
  }
}

function extractBearerToken(req) {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}
