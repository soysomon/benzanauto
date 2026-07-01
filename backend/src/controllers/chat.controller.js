import { COMPANY } from '../config/company.js'
import { buildDealerSystemPrompt } from '../prompts/dealerSystemPrompt.js'
import { getPublishedChatInventorySnapshot } from '../services/chatInventory.service.js'
import { askGemini, getGeminiCooldownRemainingMs, isGeminiAvailable } from '../services/gemini.service.js'
import { askGroq } from '../services/groq.service.js'
import { detectIntent } from '../services/intent.service.js'
import { attachRecommendationContext, resolveConversationContext } from '../services/context.service.js'
import { getRecommendationResponse } from '../services/recommendation.service.js'
import { validateChatRequest } from '../utils/chat-request.js'
import { logger } from '../utils/logger.js'

const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS ?? '12000', 10)
const chatLogger = logger.child({ scope: 'chat' })

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

function getMentionedInventoryVehicleIds(reply, inventory = []) {
  const normalizedReply = normalizeText(reply)

  return inventory
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

function mentionsOnlyAllowedVehicles(reply, referenceVehicles, inventory = []) {
  const mentionedVehicleIds = getMentionedInventoryVehicleIds(reply, inventory)

  if (!mentionedVehicleIds.length) {
    return true
  }

  if (!referenceVehicles.length) {
    return false
  }

  const allowedIds = new Set(referenceVehicles.map((vehicle) => vehicle.id))
  return mentionedVehicleIds.every((vehicleId) => allowedIds.has(vehicleId))
}

function isReplyUsable(reply, intent, referenceVehicles, inventory = []) {
  if (typeof reply !== 'string' || !reply.trim()) {
    return false
  }

  const normalizedReply = reply.trim()

  if (referenceVehicles.length === 0) {
    return ![
      'cheapest_vehicle',
      'most_expensive_vehicle',
      'budget_search',
      'suv_search',
      'sedan_search',
      'pickup_search',
      'family_vehicle',
      'inventory_search',
      'compare_vehicles',
      'vehicle_details',
    ].includes(intent) && normalizedReply.length >= 40
  }

  const requiredMentions = intent === 'compare_vehicles'
    ? Math.min(2, referenceVehicles.length)
    : 1

  return normalizedReply.length >= 80
    && mentionsOnlyAllowedVehicles(normalizedReply, referenceVehicles, inventory)
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

  const inventory = await getPublishedChatInventorySnapshot()
  const intent = detectIntent({ message, currentContext, inventory })
  const {
    signals,
    updatedContext: resolvedContext,
  } = resolveConversationContext({
    message,
    intent,
    currentContext,
    inventory,
  })

  const recommendation = getRecommendationResponse({
    intent,
    message,
    currentContext,
    updatedContext: resolvedContext,
    signals,
    inventory,
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

      if (isReplyUsable(geminiReply, intent, recommendation.referenceVehicles, inventory)) {
        return res.json(buildResponsePayload({
          reply: geminiReply.trim(),
          provider: 'gemini',
          intent,
          updatedContext,
          recommendedVehicles: recommendation.recommendedVehicles,
        }))
      }

      chatLogger.warn('ai_provider_response_rejected', {
        provider: 'gemini',
        intent,
        reason: 'low_utility_reply',
      })
    } catch (geminiError) {
      chatLogger.warn('ai_provider_failed', {
        provider: 'gemini',
        intent,
        error: geminiError,
        fallbackProvider: 'groq',
      })
    }
  } else {
    const retryAfterSeconds = Math.max(1, Math.ceil(getGeminiCooldownRemainingMs() / 1000))
    chatLogger.warn('ai_provider_cooldown_active', {
      provider: 'gemini',
      intent,
      retryAfterSeconds,
      fallbackProvider: 'groq',
    })
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

    if (isReplyUsable(groqReply, intent, recommendation.referenceVehicles, inventory)) {
      return res.json(buildResponsePayload({
        reply: groqReply.trim(),
        provider: 'groq',
        intent,
        updatedContext,
        recommendedVehicles: recommendation.recommendedVehicles,
      }))
    }

    chatLogger.warn('ai_provider_response_rejected', {
      provider: 'groq',
      intent,
      reason: 'low_utility_reply',
      fallbackProvider: 'rule-engine',
    })
    return res.json(fallbackPayload)
  } catch (groqError) {
    chatLogger.error('ai_provider_failed', {
      provider: 'groq',
      intent,
      error: groqError,
      fallbackProvider: 'rule-engine',
    })
    return res.json({
      ...fallbackPayload,
      reply: recommendation.fallbackReply
        || `Ahora mismo no puedo completar la respuesta con IA, pero con gusto te ayudamos por WhatsApp en ${COMPANY.phoneDisplay}.`,
    })
  }
}
