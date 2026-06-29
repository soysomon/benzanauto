import { env } from './env.js'

function normalizeSiteUrl(rawValue) {
  if (typeof rawValue !== 'string') return ''

  const trimmed = rawValue.trim().replace(/\/$/, '')
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) return `http://${trimmed}`
  return `https://${trimmed}`
}

function resolveWebsite() {
  const candidates = [
    env.FRONTEND_URL,
    ...String(env.FRONTEND_URLS ?? '').split(','),
  ]

  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate)
    if (normalized) return normalized
  }

  return ''
}

const resolvedWebsite = resolveWebsite()
const resolvedWebsiteHost = (() => {
  if (!resolvedWebsite) return ''

  try {
    return new URL(resolvedWebsite).host
  } catch {
    return ''
  }
})()

export const COMPANY = Object.freeze({
  name: 'Benzan Auto Import',
  assistantName: 'Benzan AI',
  website: resolvedWebsite,
  websiteHost: resolvedWebsiteHost,
  email: 'info@benzanautoimport.com',
  phoneDisplay: '(809) 555-0000',
  phoneHref: '+18095041974',
  whatsappNumber: '18095041974',
  addressLine1: 'Av. Juan Pablo Duarte #123',
  city: 'San Juan de la Maguana',
  country: 'República Dominicana',
  fullAddress: 'Av. Juan Pablo Duarte #123, San Juan de la Maguana, República Dominicana',
  shortAddress: 'Av. Juan Pablo Duarte #123, San Juan, RD',
  dealershipMapsQuery: 'Av. Juan Pablo Duarte #123, San Juan de la Maguana, República Dominicana',
  gasStationMapsQuery: 'QRR2+3V San Juan de la Maguana',
  hours: {
    weekdays: '8:00 AM – 6:00 PM',
    saturday: '8:00 AM – 3:00 PM',
    sunday: 'Cerrado',
    summary: 'Lun–Vie 8AM–6PM | Sáb 8AM–3PM | Dom Cerrado',
  },
})

export function buildWhatsAppUrl(message = '') {
  const baseUrl = `https://wa.me/${COMPANY.whatsappNumber}`
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl
}

export function buildPhoneUrl() {
  return `tel:${COMPANY.phoneHref}`
}

export function buildEmailUrl() {
  return `mailto:${COMPANY.email}`
}

export function buildMapsUrl(query = COMPANY.dealershipMapsQuery) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}`
}

export function buildMapsEmbedUrl(query = COMPANY.dealershipMapsQuery) {
  return `${buildMapsUrl(query)}&output=embed`
}
