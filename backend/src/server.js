import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { allowedOrigins } from './config/cors.js'
import { createInitialSuperAdmin } from './services/auth.service.js'

const DATABASE_RETRY_DELAY_MS = 5_000

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
      console.log('[Startup] Superadmin inicial verificado.')
    }
  } catch (error) {
    console.error('[Bootstrap Error] No se pudo conectar a MongoDB.', error)
    scheduleDatabaseReconnect()
  }
}

async function bootstrap() {
  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`Benzan Backend corriendo en http://localhost:${env.PORT}`)
    console.log(`CORS: ${[...allowedOrigins].join(', ')}`)
    void initializeDatabase()
  })

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`El puerto ${env.PORT} ya esta en uso.`)
      process.exit(1)
    }

    console.error('[Server Listen Error]', error)
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
  console.error('[Bootstrap Error]', error)
  process.exit(1)
})
