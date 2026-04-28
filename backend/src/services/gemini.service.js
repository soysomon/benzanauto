import { GoogleGenAI } from '@google/genai'

let ai
let geminiCooldownUntil = 0

const DEFAULT_GEMINI_COOLDOWN_MS = 60_000

/**
 * Transform frontend message history to Gemini format.
 * Frontend: { role: 'user' | 'assistant', content: string }
 * Gemini:   { role: 'user' | 'model',     parts: [{ text }] }
 */
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada.')
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }

  return ai
}

function toGeminiHistory(history) {
  return history.map((messageItem) => ({
    role: messageItem.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: messageItem.content }],
  }))
}

function createGeminiCooldownError(retryAfterMs) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  const error = new Error(`Gemini en cooldown por cuota. Reintenta en ${seconds}s.`)
  error.code = 'GEMINI_COOLDOWN'
  error.retryAfterMs = retryAfterMs
  return error
}

function parseRetryDelayMs(error) {
  const message = String(error?.message ?? '')
  const retryInMatch = message.match(/retry in\s+([\d.]+)s/i)
  if (retryInMatch) {
    return Math.ceil(Number.parseFloat(retryInMatch[1]) * 1000)
  }

  const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i)
  if (retryDelayMatch) {
    return Number.parseInt(retryDelayMatch[1], 10) * 1000
  }

  return DEFAULT_GEMINI_COOLDOWN_MS
}

function isGeminiQuotaError(error) {
  const message = String(error?.message ?? '')

  return message.includes('RESOURCE_EXHAUSTED')
    || message.includes('Quota exceeded')
    || message.includes('"code":429')
}

function setGeminiCooldown(retryAfterMs) {
  const safeRetryAfterMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
    ? retryAfterMs
    : DEFAULT_GEMINI_COOLDOWN_MS

  geminiCooldownUntil = Date.now() + safeRetryAfterMs
}

export function getGeminiCooldownRemainingMs() {
  return Math.max(0, geminiCooldownUntil - Date.now())
}

export function isGeminiAvailable() {
  return getGeminiCooldownRemainingMs() <= 0
}

export async function askGemini({ message, history = [], systemPrompt }) {
  const cooldownRemainingMs = getGeminiCooldownRemainingMs()
  if (cooldownRemainingMs > 0) {
    throw createGeminiCooldownError(cooldownRemainingMs)
  }

  const client = getClient()
  const contents = [
    ...toGeminiHistory(history),
    { role: 'user', parts: [{ text: message }] },
  ]

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.65,
        maxOutputTokens: 900,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    })

    return response.text ?? ''
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      const retryAfterMs = parseRetryDelayMs(error)
      setGeminiCooldown(retryAfterMs)
      throw createGeminiCooldownError(retryAfterMs)
    }

    throw error
  }
}
