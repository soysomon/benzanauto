import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { allowedOrigins } from './config/cors.js'
import { createInitialSuperAdmin } from './services/auth.service.js'
import { verifyEmailTransport } from './services/email.service.js'
import { logger } from './utils/logger.js'

const DATABASE_RETRY_DELAY_MS = 5_000
const serverLogger = logger.child({ scope: 'server' })

let databaseRetryTimer = null
let superAdminInitialized = false
let shuttingDown = false

function scheduleDatabaseReconnect() {
  if (shuttingDown || databaseRetryTimer) return

  databaseRetryTimer = setTimeout(() => {
    databaseRetryTimer = null
    void initializeDatabase()
  }, DATABASE_RETRY_DELAY_MS)
}

async function initializeDatabase() {
  try {
    await connectDatabase()

    if (!superAdminInitialized && env.SUPERADMIN_NAME && env.SUPERADMIN_USERNAME && env.SUPERADMIN_PASSWORD) {
      await createInitialSuperAdmin({
        name: env.SUPERADMIN_NAME,
        username: env.SUPERADMIN_USERNAME,
        email: env.SUPERADMIN_EMAIL,
        password: env.SUPERADMIN_PASSWORD,
      })
      superAdminInitialized = true
      serverLogger.info('superadmin_bootstrap_verified', {
        username: env.SUPERADMIN_USERNAME,
      })
    }
  } catch (error) {
    serverLogger.error('database_bootstrap_failed', {
      error,
      retryDelayMs: DATABASE_RETRY_DELAY_MS,
    })
    scheduleDatabaseReconnect()
  }
}

async function initializeEmail() {
  if (env.EMAIL_PROVIDER !== 'smtp' || !env.SMTP_VERIFY_ON_STARTUP) {
    return
  }

  try {
    await verifyEmailTransport({ force: true })
    serverLogger.info('smtp_bootstrap_verified')
  } catch (error) {
    serverLogger.warn('smtp_bootstrap_verification_failed', {
      error,
    })
  }
}

async function bootstrap() {
  const app = createApp()
  const server = app.listen(env.PORT, () => {
    serverLogger.info('server_started', {
      port: env.PORT,
      nodeVersion: process.version,
      corsOrigins: [...allowedOrigins],
    })
    void initializeDatabase()
    void initializeEmail()
  })

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      serverLogger.error('server_port_in_use', {
        port: env.PORT,
        error,
      })
      process.exit(1)
    }

    serverLogger.error('server_listen_failed', {
      port: env.PORT,
      error,
    })
    process.exit(1)
  })

  server.on('close', () => {
    shuttingDown = true
    if (databaseRetryTimer) {
      clearTimeout(databaseRetryTimer)
      databaseRetryTimer = null
    }
  })
}

bootstrap().catch((error) => {
  serverLogger.error('bootstrap_failed', {
    error,
  })
  process.exit(1)
})
