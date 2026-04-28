import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import { COMPANY } from '../../shared/company.js'
import chatRoutes from './routes/chat.routes.js'
import { apiRateLimit } from './middleware/rate-limit.middleware.js'

const app  = express()
const PORT = process.env.PORT ?? 4000
const DEFAULT_ALLOWED_ORIGINS = [
  COMPANY.website,
  'https://www.benzanautoimport.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

function isLoopbackOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin)
    return (protocol === 'http:' || protocol === 'https:')
      && (hostname === 'localhost' || hostname === '127.0.0.1')
  } catch {
    return false
  }
}

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin) || isLoopbackOrigin(origin)
}

function getAllowedOrigins() {
  return new Set(
    [process.env.FRONTEND_URLS, process.env.FRONTEND_URL]
      .filter(Boolean)
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean)
      .concat(DEFAULT_ALLOWED_ORIGINS),
  )
}

const allowedOrigins = getAllowedOrigins()

app.disable('x-powered-by')

/* ── Middleware ── */
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }

    return callback(null, false)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86_400,
}))
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  })
  next()
})
app.use(express.json({ limit: '100kb', strict: true, type: 'application/json' }))
app.use('/api', (req, res, next) => {
  const origin = req.get('origin')

  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Origen no permitido.' })
  }

  return next()
})
app.use('/api', apiRateLimit)

/* ── Routes ── */
app.use('/api/chat', chatRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'Benzan Auto AI Backend' }))

/* ── 404 ── */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }))

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud excede el tamaño permitido.' })
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido.' })
  }

  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

const server = app.listen(PORT, () => {
  console.log(`✅  Benzan AI Backend corriendo en http://localhost:${PORT}`)
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✓ configurado' : '✗ falta GEMINI_API_KEY'}`)
  console.log(`   Groq:   ${process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'REEMPLAZAR_CON_TU_GROQ_KEY' ? '✓ configurado' : '✗ falta GROQ_API_KEY'}`)
  console.log(`   CORS:   ${[...allowedOrigins].join(', ')}`)
})

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`❌  El puerto ${PORT} ya está en uso. Ya hay otra instancia del backend corriendo.`)
    console.error('   Cierra la otra instancia o usa un PORT diferente antes de volver a iniciar.')
    process.exit(1)
  }

  console.error('[Server Listen Error]', error)
  process.exit(1)
})

const aiTimeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS ?? '12000', 10)
server.requestTimeout = Number.isFinite(aiTimeoutMs) && aiTimeoutMs > 0 ? aiTimeoutMs + 5000 : 17000
server.headersTimeout = server.requestTimeout + 1000
