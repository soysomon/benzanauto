import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import { env, isProduction } from './env.js'
import { sanitizeMongoPayload } from '../middlewares/sanitize.middleware.js'

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by')

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'script-src': ["'self'", 'https://www.instagram.com'],
        'connect-src': ["'self'", 'https:', 'http:'],
        'frame-src': [
          "'self'",
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://www.instagram.com',
        ],
      },
    },
  }))
  app.use(hpp())
  app.use(express.json({
    limit: env.JSON_BODY_LIMIT,
    strict: true,
    type: ['application/json', 'application/vnd.api+json'],
  }))
  app.use(express.urlencoded({
    extended: false,
    limit: env.URLENCODED_LIMIT,
  }))
  app.use(sanitizeMongoPayload)

  app.use((req, res, next) => {
    const headers = {
      'Cache-Control': isProduction() ? 'no-store' : 'no-cache',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    }

    if (isProduction()) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    }

    res.set(headers)

    next()
  })
}
