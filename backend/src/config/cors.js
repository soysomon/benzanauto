import cors from 'cors'
import { COMPANY } from '../config/company.js'
import { env } from './env.js'

const DEFAULT_ALLOWED_ORIGINS = [
  COMPANY.website,
  COMPANY.websiteHost && !COMPANY.websiteHost.startsWith('www.')
    ? `https://www.${COMPANY.websiteHost}`
    : '',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

export function normalizeOrigin(origin, { assumeHttps = false } = {}) {
  if (typeof origin !== 'string') return ''

  const trimmed = origin.trim().replace(/\/$/, '')
  if (!trimmed) return ''

  const candidate = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : assumeHttps
      ? `https://${trimmed}`
      : trimmed

  try {
    return new URL(candidate).origin
  } catch {
    return candidate
  }
}

function isLoopbackOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin)
    return (protocol === 'http:' || protocol === 'https:')
      && (hostname === 'localhost' || hostname === '127.0.0.1')
  } catch {
    return false
  }
}

function splitOriginList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => normalizeOrigin(item, { assumeHttps: true }))
    .filter(Boolean)
}

export const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS.map((origin) => normalizeOrigin(origin)),
  ...splitOriginList(env.FRONTEND_URLS),
  ...splitOriginList(env.FRONTEND_URL),
].filter(Boolean))

export function isAllowedOrigin(origin) {
  if (!origin) return true

  const normalizedOrigin = normalizeOrigin(origin)
  return allowedOrigins.has(normalizedOrigin) || isLoopbackOrigin(normalizedOrigin)
}

export const corsOptions = cors({
  origin(origin, callback) {
    return callback(null, isAllowedOrigin(origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', env.ADMIN_CSRF_HEADER_NAME],
  maxAge: 86_400,
})
