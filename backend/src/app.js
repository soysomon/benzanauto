import express from 'express'
import path from 'node:path'
import compression from 'compression'
import { corsOptions, isAllowedOrigin } from './config/cors.js'
import { env, isProduction } from './config/env.js'
import { applySecurityMiddleware } from './config/security.js'
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js'
import { requestContext } from './middlewares/request-context.middleware.js'
import { apiRateLimiter, publicCatalogRateLimiter } from './middlewares/rate-limit.middleware.js'
import chatRoutes from './routes/chat.routes.js'
import publicVehicleRoutes from './routes/public/vehicle.routes.js'
import vehicleDataRoutes from './routes/public/vehicleData.routes.js'
import adminAuthRoutes from './routes/admin/auth.routes.js'
import adminUserRoutes from './routes/admin/user.routes.js'
import adminAuditRoutes from './routes/admin/audit.routes.js'
import adminVehicleRoutes from './routes/admin/vehicle.routes.js'
import adminDashboardRoutes from './routes/admin/dashboard.routes.js'
import { getDatabaseHealth } from './config/database.js'
import { getEmailHealth } from './services/email.service.js'
import { UPLOADS_ROOT } from './services/storage.service.js'
import { logger } from './utils/logger.js'

const appLogger = logger.child({ scope: 'app' })

function buildPublicHealthSummary({ status }) {
  return {
    status,
    service: 'Benzan Auto Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  }
}

export function createApp() {
  const app = express()

  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1)
  }

  app.use(requestContext)
  app.use(corsOptions)
  applySecurityMiddleware(app)
  app.use(compression({
    threshold: 1024,
    filter(req, res) {
      if (req.path?.startsWith('/uploads')) return false
      return compression.filter(req, res)
    },
  }))

  app.use('/uploads', express.static(UPLOADS_ROOT, {
    fallthrough: false,
    index: false,
    setHeaders(res, filePath) {
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  }))

  app.get('/health', (_req, res) => {
    const database = getDatabaseHealth()
    const email = getEmailHealth()
    const emailIsHealthy = email.status === 'ready' || email.status === 'disabled'
    const status = database.connected && emailIsHealthy ? 'ok' : 'degraded'

    if (isProduction()) {
      return res.json(buildPublicHealthSummary({ status }))
    }

    return res.json({
      ...buildPublicHealthSummary({ status }),
      database,
      email,
    })
  })

  app.get('/ready', (_req, res) => {
    const database = getDatabaseHealth()

    if (!database.connected) {
      return res.status(503).json({
        status: 'not_ready',
        service: 'Benzan Auto Backend',
        timestamp: new Date().toISOString(),
        ...(isProduction() ? {} : { database }),
      })
    }

    return res.json({
      status: 'ready',
      service: 'Benzan Auto Backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database,
    })
  })

  app.use('/api', (req, res, next) => {
    const origin = req.get('origin')

    if (!isAllowedOrigin(origin)) {
      appLogger.warn('request_blocked_forbidden_origin', {
        origin,
        method: req.method,
        path: req.originalUrl,
      })
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Origen no permitido.',
        },
      })
    }

    return next()
  })

  app.use('/api', apiRateLimiter)
  app.use('/api/chat', chatRoutes)
  app.use('/api/vehicles', publicCatalogRateLimiter, publicVehicleRoutes)
  app.use('/api/vehicle-data', publicCatalogRateLimiter, vehicleDataRoutes)
  app.use('/api/admin/auth', adminAuthRoutes)
  app.use('/api/admin/users', adminUserRoutes)
  app.use('/api/admin/audit', adminAuditRoutes)
  app.use('/api/admin/vehicles', adminVehicleRoutes)
  app.use('/api/admin/dashboard', adminDashboardRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
