import { COMPANY, buildWhatsAppUrl } from '../../shared/company.js'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const REQUEST_TIMEOUT_MS = 15_000
const LOCAL_API_BASES = ['http://localhost:4000', 'http://127.0.0.1:4000']

function buildEndpoint(baseUrl) {
  if (!baseUrl) return null

  const normalized = baseUrl.replace(/\/$/, '')
  return normalized.endsWith('/api/chat') ? normalized : `${normalized}/api/chat`
}

function getChatEndpointCandidates() {
  const seen = new Set()
  const endpoints = []

  const append = (baseUrl) => {
    const endpoint = buildEndpoint(baseUrl)
    if (!endpoint || seen.has(endpoint)) return

    seen.add(endpoint)
    endpoints.push(endpoint)
  }

  append(API_BASE_URL)

  if (typeof window !== 'undefined') {
    if (window.location.protocol !== 'file:' && window.location.origin && window.location.origin !== 'null') {
      append(window.location.origin)
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      LOCAL_API_BASES.forEach(append)
    }
  }

  if (!endpoints.length) {
    LOCAL_API_BASES.forEach(append)
  }

  return endpoints
}

function normalizeChatReply(text) {
  if (typeof text !== 'string') return ''

  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\*\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Send a message to the Benzan AI backend.
 * params.history: { role: 'user' | 'assistant', content: string }[]
 * params.currentContext: current resolved backend context
 */
export async function sendMessage({ history, currentContext = {} }) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      ok: false,
      text: `En este momento no puedo responder. Contáctanos al ${COMPANY.phoneDisplay} o por WhatsApp: ${buildWhatsAppUrl()}.`,
      recommendedVehicles: [],
    }
  }

  const lastMessage = history.at(-1)
  const previousHistory = history.slice(0, -1)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const endpoints = getChatEndpointCandidates()
  const payload = JSON.stringify({
    message: lastMessage.content,
    history: previousHistory,
    currentContext,
  })
  let lastError = null

  try {
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: payload,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }

        const data = await res.json()
        return {
          ok: true,
          text: normalizeChatReply(data.reply),
          intent: data.intent ?? null,
          updatedContext: data.updatedContext ?? currentContext,
          provider: data.provider,
          recommendedVehicles: Array.isArray(data.recommendedVehicles) ? data.recommendedVehicles : [],
        }
      } catch (error) {
        lastError = error
        console.error(`[Benzan AI] fallo en ${endpoint}`, error)
      }
    }
  } catch (error) {
    lastError = error
  } finally {
    clearTimeout(timeoutId)
  }

  console.error('[Benzan AI] sin respuesta disponible', lastError)
  return {
    ok: false,
    text: `En este momento no puedo responder. Verifica que el backend esté encendido. Si prefieres, contáctanos al ${COMPANY.phoneDisplay} o por WhatsApp: ${buildWhatsAppUrl()}.`,
    recommendedVehicles: [],
  }
}
