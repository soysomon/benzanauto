import crypto from 'node:crypto'
import { env, isProduction } from '../config/env.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function resolveCookieSecure() {
  if (typeof env.ADMIN_AUTH_COOKIE_SECURE === 'boolean') {
    return env.ADMIN_AUTH_COOKIE_SECURE
  }

  return isProduction()
}

function getCookieBaseOptions() {
  return {
    domain: env.ADMIN_AUTH_COOKIE_DOMAIN || undefined,
    path: env.ADMIN_AUTH_COOKIE_PATH,
    sameSite: env.ADMIN_AUTH_COOKIE_SAME_SITE,
    secure: resolveCookieSecure(),
  }
}

export function buildAdminSessionCookieOptions(expiresAt) {
  return {
    ...getCookieBaseOptions(),
    httpOnly: true,
    expires: expiresAt,
  }
}

export function buildAdminSessionCookieClearOptions() {
  return {
    ...getCookieBaseOptions(),
    httpOnly: true,
  }
}

export function setAdminSessionCookie(res, token, expiresAt) {
  res.cookie(env.ADMIN_AUTH_COOKIE_NAME, token, buildAdminSessionCookieOptions(expiresAt))
}

export function clearAdminSessionCookie(res) {
  res.clearCookie(env.ADMIN_AUTH_COOKIE_NAME, buildAdminSessionCookieClearOptions())
}

export function parseCookieHeader(headerValue) {
  const parsed = {}

  if (!headerValue || typeof headerValue !== 'string') return parsed

  for (const segment of headerValue.split(';')) {
    const [rawName, ...rawValueParts] = segment.trim().split('=')
    if (!rawName) continue

    const rawValue = rawValueParts.join('=')
    const name = decodeURIComponent(rawName.trim())
    parsed[name] = decodeURIComponent(rawValue.trim())
  }

  return parsed
}

export function extractAdminSessionTokenFromRequest(req) {
  const cookies = parseCookieHeader(req.get('cookie'))
  return cookies[env.ADMIN_AUTH_COOKIE_NAME] || null
}

export function createAdminCsrfToken() {
  return crypto.randomBytes(24).toString('hex')
}

export function getAdminCsrfHeaderName() {
  return env.ADMIN_CSRF_HEADER_NAME
}

export function getAdminCsrfHeaderValue(req) {
  return req.get(getAdminCsrfHeaderName())?.trim() ?? ''
}

export function isSafeHttpMethod(method) {
  return SAFE_METHODS.has(String(method ?? '').toUpperCase())
}

export function safeCompareTokens(left, right) {
  const normalizedLeft = Buffer.from(String(left ?? ''))
  const normalizedRight = Buffer.from(String(right ?? ''))

  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false
  }

  if (normalizedLeft.length !== normalizedRight.length) {
    return false
  }

  return crypto.timingSafeEqual(normalizedLeft, normalizedRight)
}
