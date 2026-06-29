const DEFAULT_SITE_NAME = 'Benzan Auto Import'
const DEFAULT_DESCRIPTION = 'Benzan Auto Import: inventario real, taller especializado y atención automotriz premium en República Dominicana.'
const DEFAULT_OG_IMAGE_PATH = '/images/banner-desktop.webp'
const DEFAULT_LOCALE = 'es_DO'

export function normalizeAbsoluteUrl(rawValue) {
  if (typeof rawValue !== 'string') return ''

  const trimmed = rawValue.trim().replace(/\/$/, '')
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed

  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`
  }

  return `https://${trimmed}`
}

export function getSiteUrl() {
  const configuredSiteUrl = normalizeAbsoluteUrl(import.meta.env.VITE_SITE_URL)
  if (configuredSiteUrl) return configuredSiteUrl

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeAbsoluteUrl(window.location.origin)
  }

  return ''
}

export function getSiteName() {
  return DEFAULT_SITE_NAME
}

export function getDefaultDescription() {
  return DEFAULT_DESCRIPTION
}

export function getDefaultLocale() {
  return DEFAULT_LOCALE
}

export function buildAbsoluteUrl(pathOrUrl, siteUrl = getSiteUrl()) {
  if (typeof pathOrUrl !== 'string' || !pathOrUrl.trim()) return siteUrl || ''

  const trimmed = pathOrUrl.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (!siteUrl) return trimmed

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return new URL(normalizedPath, `${siteUrl}/`).toString()
}

export function buildCanonicalUrl(pathname = '/') {
  return buildAbsoluteUrl(pathname)
}

export function getDefaultOgImage() {
  const configuredImage = import.meta.env.VITE_DEFAULT_OG_IMAGE?.trim()
  return buildAbsoluteUrl(configuredImage || DEFAULT_OG_IMAGE_PATH)
}

export function buildPageTitle(title) {
  return title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_SITE_NAME
}

export function truncateDescription(text, maxLength = 180) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (!normalized) return DEFAULT_DESCRIPTION
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
