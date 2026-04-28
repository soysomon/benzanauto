import { COMPANY } from '../../../shared/company.js'
import { vehicles } from '../data/inventory.js'
import { buildDealerSystemPrompt } from '../prompts/dealerSystemPrompt.js'
import { askGemini, getGeminiCooldownRemainingMs, isGeminiAvailable } from '../services/gemini.service.js'
import { askGroq } from '../services/groq.service.js'
import { detectIntent } from '../services/intent.service.js'
import { attachRecommendationContext, resolveConversationContext } from '../services/context.service.js'
import { getRecommendationResponse } from '../services/recommendation.service.js'
import { validateChatRequest } from '../utils/chat-request.js'

const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS ?? '12000', 10)

async function withTimeout(promise, label) {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} tardó demasiado en responder.`))
        }, AI_TIMEOUT_MS)
      }),
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getMentionedInventoryVehicleIds(reply) {
  const normalizedReply = normalizeText(reply)

  return vehicles
    .filter((vehicle) => {
      const fullName = normalizeText(`${vehicle.brand} ${vehicle.model}`)
      const fullNameWithYear = normalizeText(`${vehicle.brand} ${vehicle.model} ${vehicle.year}`)
      return normalizedReply.includes(fullName) || normalizedReply.includes(fullNameWithYear)
    })
    .map((vehicle) => vehicle.id)
}

function countVehicleMentions(reply, referenceVehicles) {
  const normalizedReply = normalizeText(reply)

  return referenceVehicles.reduce((count, vehicle) => {
    const brand = normalizeText(vehicle.brand)
    const model = normalizeText(vehicle.model)
    const fullName = `${brand} ${model}`

    return normalizedReply.includes(fullName) || normalizedReply.includes(model) || normalizedReply.includes(brand)
      ? count + 1
      : count
  }, 0)
}

function mentionsOnlyAllowedVehicles(reply, referenceVehicles) {
  const mentionedVehicleIds = getMentionedInventoryVehicleIds(reply)

  if (!mentionedVehicleIds.length) {
    return true
  }

  if (!referenceVehicles.length) {
    return false
  }

  const allowedIds = new Set(referenceVehicles.map((vehicle) => vehicle.id))
  return mentionedVehicleIds.every((vehicleId) => allowedIds.has(vehicleId))
}

function isReplyUsable(reply, intent, referenceVehicles) {
  if (typeof reply !== 'string' || !reply.trim()) {
    return false
  }

  const normalizedReply = reply.trim()

  if (referenceVehicles.length === 0) {
    return normalizedReply.length >= 40
  }

  const requiredMentions = intent === 'compare_vehicles'
    ? Math.min(2, referenceVehicles.length)
    : 1

  return normalizedReply.length >= 80
    && mentionsOnlyAllowedVehicles(normalizedReply, referenceVehicles)
    && countVehicleMentions(normalizedReply, referenceVehicles) >= requiredMentions
}

function buildResponsePayload({ reply, provider, intent, updatedContext, recommendedVehicles }) {
  return {
    reply,
    intent,
    updatedContext,
    recommendedVehicles,
    provider,
  }
}

export async function handleChat(req, res) {
  const {
    error,
    message,
    history,
    currentContext,
  } = validateChatRequest(req.body)

  if (error) {
    return res.status(400).json({ error })
  }

  const intent = detectIntent({ message, currentContext })
  const {
    signals,
    updatedContext: resolvedContext,
  } = resolveConversationContext({
    message,
    intent,
    currentContext,
  })

  const recommendation = getRecommendationResponse({
    intent,
    message,
    currentContext,
    updatedContext: resolvedContext,
    signals,
  })

  const updatedContext = attachRecommendationContext({
    updatedContext: resolvedContext,
    intent,
    recommendedVehicles: recommendation.referenceVehicles,
  })

  const systemPrompt = buildDealerSystemPrompt({
    intent,
    promptFacts: recommendation.promptFacts,
  })

  const fallbackPayload = buildResponsePayload({
    reply: recommendation.fallbackReply,
    provider: 'rule-engine',
    intent,
    updatedContext,
    recommendedVehicles: recommendation.recommendedVehicles,
  })

  if (isGeminiAvailable()) {
    try {
      const geminiReply = await withTimeout(
        askGemini({
          message,
          history,
          systemPrompt,
        }),
        'Gemini',
      )

      if (isReplyUsable(geminiReply, intent, recommendation.referenceVehicles)) {
        return res.json(buildResponsePayload({
          reply: geminiReply.trim(),
          provider: 'gemini',
          intent,
          updatedContext,
          recommendedVehicles: recommendation.recommendedVehicles,
        }))
      }

      console.warn('[Benzan AI] Gemini devolvió una respuesta poco útil; usando fallback.')
    } catch (geminiError) {
      console.warn('[Benzan AI] Gemini no disponible; usando Groq como fallback:', geminiError?.message ?? geminiError)
    }
  } else {
    const retryAfterSeconds = Math.max(1, Math.ceil(getGeminiCooldownRemainingMs() / 1000))
    console.warn(`[Benzan AI] Gemini en cooldown por cuota; se omite por ${retryAfterSeconds}s y se usa Groq.`)
  }

  try {
    const groqReply = await withTimeout(
      askGroq({
        message,
        history,
        systemPrompt,
      }),
      'Groq',
    )

    if (isReplyUsable(groqReply, intent, recommendation.referenceVehicles)) {
      return res.json(buildResponsePayload({
        reply: groqReply.trim(),
        provider: 'groq',
        intent,
        updatedContext,
        recommendedVehicles: recommendation.recommendedVehicles,
      }))
    }

    console.warn('[Benzan AI] Groq devolvió una respuesta poco útil; usando motor determinista.')
    return res.json(fallbackPayload)
  } catch (groqError) {
    console.error('[Benzan AI] Groq también falló:', groqError?.message ?? groqError)
    return res.json({
      ...fallbackPayload,
      reply: recommendation.fallbackReply
        || `Ahora mismo no puedo completar la respuesta con IA, pero con gusto te ayudamos por WhatsApp en ${COMPANY.phoneDisplay}.`,
    })
  }
}
