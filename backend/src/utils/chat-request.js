import { normalizeChatContext } from '../services/context.service.js'

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const VALID_ROLES = new Set(['user', 'assistant'])
const MAX_MESSAGE_LENGTH = 1200
const MAX_HISTORY_MESSAGES = 12
const MAX_HISTORY_MESSAGE_LENGTH = 1600

function normalizeText(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return null
  const normalized = normalizeText(value)
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

export function normalizeHistory(rawHistory = []) {
  if (!Array.isArray(rawHistory)) return []

  return rawHistory
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      if (!item || !VALID_ROLES.has(item.role)) return null

      const content = sanitizeText(item.content, MAX_HISTORY_MESSAGE_LENGTH)
      if (!content) return null

      return { role: item.role, content }
    })
    .filter(Boolean)
}

export function validateChatRequest(body) {
  const rawMessage = body?.message

  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return { error: 'El campo "message" es requerido y debe ser texto.' }
  }

  if (rawMessage.trim().length > MAX_MESSAGE_LENGTH) {
    return { error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres.` }
  }

  return {
    message: sanitizeText(rawMessage, MAX_MESSAGE_LENGTH),
    history: normalizeHistory(body?.history),
    currentContext: normalizeChatContext(body?.currentContext),
  }
}
