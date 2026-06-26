import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { allowedOrigins } from './config/cors.js'

async function bootstrap() {
  await connectDatabase()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`Benzan Backend corriendo en http://localhost:${env.PORT}`)
    console.log(`MongoDB conectado`)
    console.log(`CORS: ${[...allowedOrigins].join(', ')}`)
  })

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`El puerto ${env.PORT} ya esta en uso.`)
      process.exit(1)
    }

    console.error('[Server Listen Error]', error)
    process.exit(1)
  })
}

bootstrap().catch((error) => {
  console.error('[Bootstrap Error]', error)
  process.exit(1)
})
