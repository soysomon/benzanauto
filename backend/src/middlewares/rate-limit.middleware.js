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

export const apiRateLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Demasiadas solicitudes. Intenta de nuevo en unos segundos.'),
})

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Demasiados intentos de inicio de sesion. Intenta mas tarde.'),
})

