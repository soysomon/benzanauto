import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

function buildHandler(message) {
  return (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    })
  }
}

function isPublicCatalogReadRequest(req) {
  const method = req.method?.toUpperCase?.() ?? ''
  const path = req.path ?? ''

  if (!['GET', 'HEAD'].includes(method)) return false

  return path.startsWith('/vehicles') || path.startsWith('/vehicle-data')
}

export const apiRateLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPublicCatalogReadRequest,
  handler: buildHandler('Demasiadas solicitudes. Intenta de nuevo en unos segundos.'),
})

export const publicCatalogRateLimiter = rateLimit({
  windowMs: env.PUBLIC_CATALOG_RATE_LIMIT_WINDOW_MS,
  max: env.PUBLIC_CATALOG_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('El catalogo esta recibiendo mucho trafico. Intenta de nuevo en unos segundos.'),
})

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Demasiados intentos de inicio de sesion. Intenta mas tarde.'),
})
