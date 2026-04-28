const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 30
const requestsByIp = new Map()

function getRateLimitConfig() {
  const windowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? `${DEFAULT_WINDOW_MS}`, 10)
  const maxRequests = Number.parseInt(process.env.RATE_LIMIT_MAX ?? `${DEFAULT_MAX_REQUESTS}`, 10)

  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS,
    maxRequests: Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : DEFAULT_MAX_REQUESTS,
  }
}

function cleanupExpiredBuckets(now, windowMs) {
  for (const [key, bucket] of requestsByIp.entries()) {
    if (now - bucket.windowStart >= windowMs) {
      requestsByIp.delete(key)
    }
  }
}

export function apiRateLimit(req, res, next) {
  const { windowMs, maxRequests } = getRateLimitConfig()
  const now = Date.now()
  const key = req.ip ?? req.socket?.remoteAddress ?? 'unknown'
  const bucket = requestsByIp.get(key)

  if (!bucket || now - bucket.windowStart >= windowMs) {
    requestsByIp.set(key, { count: 1, windowStart: now })

    if (requestsByIp.size > 500) {
      cleanupExpiredBuckets(now, windowMs)
    }

    return next()
  }

  if (bucket.count >= maxRequests) {
    const retryAfter = Math.ceil((windowMs - (now - bucket.windowStart)) / 1000)
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
    })
  }

  bucket.count += 1
  return next()
}
