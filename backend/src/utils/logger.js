import { env } from '../config/env.js'
import { getRequestContext } from './request-context-store.js'

const LOG_LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
})

const RESERVED_ENTRY_FIELDS = new Set([
  'timestamp',
  'level',
  'service',
  'env',
  'pid',
  'message',
  'requestId',
  'scope',
  'http',
  'actor',
  'context',
  'bindings',
])

const REDACTED_MARKER = '[REDACTED]'
const MAX_DEPTH = 6
const MAX_ARRAY_ITEMS = 25
const MAX_STRING_LENGTH = 4_000

const activeLogLevel = resolveActiveLogLevel()
const serviceName = env.LOG_SERVICE_NAME?.trim() || 'benzan-auto-backend'

function resolveActiveLogLevel() {
  const candidate = String(
    env.LOG_LEVEL
    || (env.NODE_ENV === 'development' ? 'debug' : 'info'),
  )
    .trim()
    .toLowerCase()

  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, candidate)
    ? candidate
    : 'info'
}

function shouldWrite(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[activeLogLevel]
}

function isSensitiveKey(key) {
  return /pass(word)?|secret|token|authorization|cookie|jwt|csrf|api[-_]?key|access[-_]?key/i.test(key)
}

function truncateString(value) {
  if (value.length <= MAX_STRING_LENGTH) return value
  return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`
}

function serializeError(error, depth, seen) {
  const serialized = {
    name: error.name ?? 'Error',
    message: error.message ?? 'Unknown error',
  }

  if (error.code !== undefined) serialized.code = error.code
  if (error.status !== undefined) serialized.status = error.status
  if (error.statusCode !== undefined) serialized.statusCode = error.statusCode
  if (typeof error.stack === 'string' && error.stack.trim()) {
    serialized.stack = truncateString(error.stack)
  }
  if (error.cause && depth < MAX_DEPTH) {
    serialized.cause = sanitizeValue(error.cause, depth + 1, seen)
  }

  return serialized
}

function sanitizeValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return truncateString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return String(value)
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return serializeError(value, depth, seen)

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return `[Array(${value.length})]`
    const sanitized = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1, seen))

    if (value.length > MAX_ARRAY_ITEMS) {
      sanitized.push(`...[${value.length - MAX_ARRAY_ITEMS} more items]`)
    }

    return sanitized
  }

  if (value instanceof Map) {
    return sanitizeValue(Object.fromEntries(value.entries()), depth + 1, seen)
  }

  if (value instanceof Set) {
    return sanitizeValue(Array.from(value.values()), depth + 1, seen)
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]'
    if (depth >= MAX_DEPTH) return '[Object]'

    seen.add(value)
    const sanitizedObject = {}

    for (const [key, nestedValue] of Object.entries(value)) {
      sanitizedObject[key] = isSensitiveKey(key)
        ? REDACTED_MARKER
        : sanitizeValue(nestedValue, depth + 1, seen)
    }

    seen.delete(value)
    return sanitizedObject
  }

  return String(value)
}

function mergeBindings(entry, bindings = {}) {
  const sanitizedBindings = sanitizeValue(bindings)
  if (!sanitizedBindings || typeof sanitizedBindings !== 'object' || Array.isArray(sanitizedBindings)) {
    return
  }

  if (sanitizedBindings.scope) {
    entry.scope = sanitizedBindings.scope
  }

  const extraBindings = Object.fromEntries(
    Object.entries(sanitizedBindings).filter(([key]) => key !== 'scope'),
  )

  if (Object.keys(extraBindings).length > 0) {
    entry.bindings = extraBindings
  }
}

function mergeRequestContext(entry) {
  const requestContext = getRequestContext()
  if (!requestContext) return

  if (requestContext.requestId) {
    entry.requestId = requestContext.requestId
  }

  const httpContext = {}
  if (requestContext.method) httpContext.method = requestContext.method
  if (requestContext.path) httpContext.path = requestContext.path
  if (requestContext.route) httpContext.route = requestContext.route
  if (requestContext.statusCode) httpContext.statusCode = requestContext.statusCode
  if (requestContext.durationMs !== undefined) httpContext.durationMs = requestContext.durationMs
  if (requestContext.ip) httpContext.ip = requestContext.ip

  if (Object.keys(httpContext).length > 0) {
    entry.http = {
      ...(entry.http ?? {}),
      ...sanitizeValue(httpContext),
    }
  }

  const actorContext = {}
  if (requestContext.userId) actorContext.id = requestContext.userId
  if (requestContext.userRole) actorContext.role = requestContext.userRole
  if (requestContext.authTransport) actorContext.transport = requestContext.authTransport
  if (requestContext.sessionId) actorContext.sessionId = requestContext.sessionId

  if (Object.keys(actorContext).length > 0) {
    entry.actor = {
      ...(entry.actor ?? {}),
      ...sanitizeValue(actorContext),
    }
  }
}

function mergeContext(entry, meta = {}) {
  const sanitizedMeta = sanitizeValue(meta)
  if (
    sanitizedMeta === null
    || sanitizedMeta === undefined
    || (typeof sanitizedMeta === 'object' && !Array.isArray(sanitizedMeta) && Object.keys(sanitizedMeta).length === 0)
  ) {
    return
  }

  if (typeof sanitizedMeta === 'object' && !Array.isArray(sanitizedMeta)) {
    for (const [key, value] of Object.entries(sanitizedMeta)) {
      if (!RESERVED_ENTRY_FIELDS.has(key) && entry[key] === undefined) {
        entry[key] = value
        continue
      }

      entry.context = {
        ...(entry.context ?? {}),
        [key]: value,
      }
    }
    return
  }

  entry.context = sanitizedMeta
}

function writeLog(level, message, meta = {}, bindings = {}) {
  if (!shouldWrite(level)) return

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: serviceName,
    env: env.NODE_ENV,
    pid: process.pid,
    message: String(message),
  }

  mergeBindings(entry, bindings)
  mergeRequestContext(entry)
  mergeContext(entry, meta)

  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout
  stream.write(`${JSON.stringify(entry)}\n`)
}

function createLogger(bindings = {}) {
  return {
    child(childBindings = {}) {
      return createLogger({
        ...bindings,
        ...childBindings,
      })
    },
    debug(message, meta = {}) {
      writeLog('debug', message, meta, bindings)
    },
    info(message, meta = {}) {
      writeLog('info', message, meta, bindings)
    },
    warn(message, meta = {}) {
      writeLog('warn', message, meta, bindings)
    },
    error(message, meta = {}) {
      writeLog('error', message, meta, bindings)
    },
  }
}

export const logger = createLogger()

export function logDebug(message, meta = {}) {
  logger.debug(message, meta)
}

export function logInfo(message, meta = {}) {
  logger.info(message, meta)
}

export function logWarn(message, meta = {}) {
  logger.warn(message, meta)
}

export function logError(message, meta = {}) {
  logger.error(message, meta)
}
