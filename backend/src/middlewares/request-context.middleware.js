import crypto from 'node:crypto'
import { logger } from '../utils/logger.js'
import { runWithRequestContext, updateRequestContext } from '../utils/request-context-store.js'

export function requestContext(req, res, next) {
  const requestId = crypto.randomUUID()
  const startedAt = process.hrtime.bigint()

  runWithRequestContext({
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
  }, () => {
    req.requestId = requestId
    req.logger = logger.child({ scope: 'http' })
    res.setHeader('X-Request-Id', requestId)

    let completionLogged = false

    const logCompletion = ({ aborted = false } = {}) => {
      if (completionLogged) return
      completionLogged = true

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
      updateRequestContext({
        route: req.route?.path ?? req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        userId: req.auth?.user?.id ?? req.auth?.user?._id?.toString?.(),
        userRole: req.auth?.user?.role ?? null,
        authTransport: req.auth?.transport ?? null,
        sessionId: req.auth?.session?.id ?? req.auth?.session?._id?.toString?.(),
      })

      const level = resolveRequestLogLevel(req.originalUrl || req.url, res.statusCode)
      logger[level]('http_request_completed', {
        request: {
          aborted,
          contentLength: normalizeHeaderNumber(res.getHeader('content-length')),
          origin: req.get('origin') || undefined,
          referer: req.get('referer') || undefined,
        },
      })
    }

    res.on('finish', () => logCompletion())
    res.on('close', () => {
      if (!res.writableEnded) {
        logCompletion({ aborted: true })
      }
    })

    next()
  })
}

function normalizeHeaderNumber(value) {
  if (value === undefined || value === null) return null
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function resolveRequestLogLevel(path, statusCode) {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  if (path === '/health' || path === '/ready') return 'debug'
  return 'info'
}
