import { vehicles } from '../data/inventory.js'

const USD_TO_DOP = Number.parseFloat(process.env.USD_TO_DOP ?? '60')

const VEHICLE_TYPE_ALIASES = {
  SUV: ['suv', 'jeepeta', 'jeepetas'],
  Pickup: ['pickup', 'pickups', 'camioneta', 'camionetas'],
  'Sedán': ['sedan', 'sedán', 'sedanes'],
  Compacto: ['compacto', 'compacta', 'hatchback'],
  'Coupé': ['coupe', 'coupé', 'coupes'],
}

const FUEL_ALIASES = {
  Gasolina: ['gasolina', 'de gasolina', 'de gas', 'gas'],
  Diesel: ['diesel', 'diésel', 'gasoil'],
  'Híbrido': ['hibrido', 'híbrido', 'hybrid', 'hibrida', 'híbrida'],
  'Eléctrico': ['electrico', 'eléctrico', 'electricos', 'eléctricos', 'ev', 'tesla'],
}

const TRANSMISSION_ALIASES = {
  Automático: ['automatico', 'automático', 'aut', 'cvt'],
  Manual: ['manual'],
}

const DRIVETRAIN_ALIASES = {
  '4x4': ['4x4', '4wd', 'doble traccion', 'doble tracción', 'traccion total', 'tracción total'],
  AWD: ['awd', 'all wheel drive'],
  FWD: ['fwd', 'delantera', 'traccion delantera', 'tracción delantera'],
  RWD: ['rwd', 'trasera', 'traccion trasera', 'tracción trasera'],
}

const USAGE_ALIASES = {
  familiar: ['familiar', 'familia', 'hijos', '7 pasajeros', 'siete pasajeros', '3 filas'],
  trabajo: ['trabajo', 'trabajar', 'carga', 'negocio', 'empresa'],
  aventura: ['aventura', 'campo', 'viajes largos', 'montaña', 'montana', 'off road', 'todoterreno'],
  ciudad: ['ciudad', 'diario', 'uso diario', 'urbano'],
  lujo: ['lujo', 'premium', 'executive', 'ejecutivo'],
}

const FOLLOW_UP_HINTS = [
  'y ', 'y si', 'y algo', 'algo ', 'otra ', 'otras ', 'otro ', 'más ', 'mas ',
  'de esas', 'de esos', 'de lo que me mostraste', 'de lo que me enseñaste',
  'esa misma', 'ese mismo',
]

const KNOWN_BRANDS = [...new Set(vehicles.map((vehicle) => vehicle.brand))]

export const DEFAULT_CHAT_CONTEXT = Object.freeze({
  budgetUsd: null,
  budgetDop: null,
  budgetDisplay: null,
  vehicleType: null,
  transmission: null,
  preferredBrand: null,
  usage: null,
  wantsFinancing: null,
  fuelType: null,
  drivetrain: null,
  requestedVehicleIds: [],
  lastIntent: null,
  lastRecommendedVehicleIds: [],
})

function isFinitePositiveNumber(value) {
  return Number.isFinite(value) && value > 0
}

export function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function includesAny(text, candidates) {
  return candidates.some((candidate) => text.includes(normalizeText(candidate)))
}

function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDop(amount) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseBudget(message) {
  const patterns = [
    {
      regex: /(?:hasta|maximo|máximo|presupuesto|budget|menos de|tengo|cuento con|dispongo de|de)\s*(rd\$|\$|usd|dolares|dólares|pesos)?\s*([\d.,]+)\s*(k|mil)?\s*(pesos|rd\$|rd|dolares|dólares|usd)?/i,
      amountIndex: 2,
      multiplierIndex: 3,
      currencyIndexes: [1, 4],
    },
    {
      regex: /(rd\$|\$|usd|dolares|dólares)\s*([\d.,]+)\s*(k|mil)?/i,
      amountIndex: 2,
      multiplierIndex: 3,
      currencyIndexes: [1],
    },
    {
      regex: /([\d.,]+)\s*(k|mil)?\s*(pesos|rd\$|rd|dolares|dólares|usd)/i,
      amountIndex: 1,
      multiplierIndex: 2,
      currencyIndexes: [3],
    },
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern.regex)
    if (!match) continue

    const rawAmount = match[pattern.amountIndex]
    const amount = Number.parseFloat(rawAmount.replace(/,/g, ''))
    if (!isFinitePositiveNumber(amount)) continue

    const multiplier = match[pattern.multiplierIndex] ? 1000 : 1
    const currencyToken = normalizeText(
      pattern.currencyIndexes.map((index) => match[index]).filter(Boolean).join(' '),
    )
    const finalAmount = amount * multiplier
    const isDop = currencyToken.includes('peso') || currencyToken.includes('rd')

    return {
      budgetUsd: isDop ? finalAmount / USD_TO_DOP : finalAmount,
      budgetDop: isDop ? finalAmount : Math.round(finalAmount * USD_TO_DOP),
      budgetDisplay: isDop ? formatDop(finalAmount) : formatUsd(finalAmount),
    }
  }

  return {
    budgetUsd: null,
    budgetDop: null,
    budgetDisplay: null,
  }
}

function parseAliasValue(text, aliases) {
  for (const [value, candidates] of Object.entries(aliases)) {
    if (includesAny(text, candidates)) {
      return value
    }
  }

  return null
}

function parseBrand(text) {
  for (const brand of KNOWN_BRANDS) {
    if (text.includes(normalizeText(brand))) {
      return brand
    }
  }

  return null
}

function parseUsage(text) {
  for (const [usage, candidates] of Object.entries(USAGE_ALIASES)) {
    if (includesAny(text, candidates)) {
      return usage
    }
  }

  return null
}

function parseRequestedVehicles(message) {
  const normalizedMessage = normalizeText(message)
  const matched = []

  for (const vehicle of vehicles) {
    const fullName = normalizeText(`${vehicle.brand} ${vehicle.model}`)
    const modelName = normalizeText(vehicle.model)
    const byId = normalizedMessage.includes(`id ${vehicle.id}`) || normalizedMessage.includes(`id:${vehicle.id}`) || normalizedMessage.includes(`vehiculo ${vehicle.id}`) || normalizedMessage.includes(`vehículo ${vehicle.id}`)

    if (byId || normalizedMessage.includes(fullName) || normalizedMessage.includes(modelName)) {
      matched.push(vehicle)
    }
  }

  return [...new Map(matched.map((vehicle) => [vehicle.id, vehicle])).values()]
}

function sanitizeVehicleIds(value) {
  if (!Array.isArray(value)) return []

  return [...new Set(
    value
      .map((item) => Number.parseInt(item, 10))
      .filter((item) => Number.isInteger(item) && vehicles.some((vehicle) => vehicle.id === item)),
  )]
}

function sanitizeNullableString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function sanitizeNullableBoolean(value) {
  return typeof value === 'boolean' ? value : null
}

export function normalizeChatContext(rawContext = {}) {
  return {
    budgetUsd: isFinitePositiveNumber(rawContext?.budgetUsd) ? rawContext.budgetUsd : null,
    budgetDop: isFinitePositiveNumber(rawContext?.budgetDop) ? rawContext.budgetDop : null,
    budgetDisplay: sanitizeNullableString(rawContext?.budgetDisplay),
    vehicleType: sanitizeNullableString(rawContext?.vehicleType),
    transmission: sanitizeNullableString(rawContext?.transmission),
    preferredBrand: sanitizeNullableString(rawContext?.preferredBrand),
    usage: sanitizeNullableString(rawContext?.usage),
    wantsFinancing: sanitizeNullableBoolean(rawContext?.wantsFinancing),
    fuelType: sanitizeNullableString(rawContext?.fuelType),
    drivetrain: sanitizeNullableString(rawContext?.drivetrain),
    requestedVehicleIds: sanitizeVehicleIds(rawContext?.requestedVehicleIds),
    lastIntent: sanitizeNullableString(rawContext?.lastIntent),
    lastRecommendedVehicleIds: sanitizeVehicleIds(rawContext?.lastRecommendedVehicleIds),
  }
}

export function extractMessageSignals(message) {
  const rawMessage = String(message ?? '').trim()
  const normalizedMessage = normalizeText(rawMessage)
  const budget = parseBudget(rawMessage)
  const requestedVehicles = parseRequestedVehicles(rawMessage)

  return {
    rawMessage,
    normalizedMessage,
    isFollowUp: FOLLOW_UP_HINTS.some((hint) => normalizedMessage.startsWith(normalizeText(hint))),
    budgetUsd: budget.budgetUsd,
    budgetDop: budget.budgetDop,
    budgetDisplay: budget.budgetDisplay,
    vehicleType: parseAliasValue(normalizedMessage, VEHICLE_TYPE_ALIASES),
    transmission: parseAliasValue(normalizedMessage, TRANSMISSION_ALIASES),
    preferredBrand: parseBrand(normalizedMessage),
    usage: parseUsage(normalizedMessage),
    wantsFinancing: includesAny(normalizedMessage, ['financiar', 'financiamiento', 'cuota', 'inicial', 'prestamo', 'préstamo'])
      ? true
      : null,
    fuelType: parseAliasValue(normalizedMessage, FUEL_ALIASES),
    drivetrain: parseAliasValue(normalizedMessage, DRIVETRAIN_ALIASES),
    requestedVehicleIds: requestedVehicles.map((vehicle) => vehicle.id),
    requestedVehicles,
  }
}

function hasActiveSearchContext(context) {
  return Boolean(
    context.vehicleType
    || context.transmission
    || context.preferredBrand
    || context.usage
    || context.fuelType
    || context.drivetrain
    || context.budgetUsd
    || context.requestedVehicleIds.length
  )
}

function shouldCarryForwardContext({ intent, signals, currentContext }) {
  if (signals.isFollowUp) return true

  if (!hasActiveSearchContext(currentContext)) return false

  const hasExplicitSearchSignal = Boolean(
    signals.vehicleType
    || signals.preferredBrand
    || signals.fuelType
    || signals.drivetrain
    || signals.transmission
    || signals.budgetUsd
    || signals.requestedVehicleIds.length
  )

  if (!hasExplicitSearchSignal && (signals.usage || signals.wantsFinancing !== null)) {
    return true
  }

  return intent === 'budget_search' && !hasExplicitSearchSignal
}

function getSuspendedFields(intent) {
  switch (intent) {
    case 'cheapest_vehicle':
    case 'most_expensive_vehicle':
      return new Set(['budgetUsd', 'budgetDop', 'budgetDisplay'])
    case 'general_dealer_question':
    case 'out_of_scope':
      return new Set([
        'budgetUsd',
        'budgetDop',
        'budgetDisplay',
        'vehicleType',
        'transmission',
        'preferredBrand',
        'usage',
        'fuelType',
        'drivetrain',
        'requestedVehicleIds',
      ])
    case 'compare_vehicles':
    case 'vehicle_details':
      return new Set(['budgetUsd', 'budgetDop', 'budgetDisplay'])
    default:
      return new Set()
  }
}

export function resolveConversationContext({ message, intent, currentContext }) {
  const normalizedContext = normalizeChatContext(currentContext)
  const signals = extractMessageSignals(message)
  const carryForward = shouldCarryForwardContext({ intent, signals, currentContext: normalizedContext })
  const suspendedFields = getSuspendedFields(intent)
  const baseContext = carryForward
    ? { ...normalizedContext }
    : {
        ...DEFAULT_CHAT_CONTEXT,
        lastIntent: normalizedContext.lastIntent,
        lastRecommendedVehicleIds: normalizedContext.lastRecommendedVehicleIds,
      }

  for (const field of suspendedFields) {
    baseContext[field] = Array.isArray(DEFAULT_CHAT_CONTEXT[field])
      ? []
      : DEFAULT_CHAT_CONTEXT[field]
  }

  const updatedContext = { ...baseContext }

  if (signals.budgetUsd !== null) {
    updatedContext.budgetUsd = signals.budgetUsd
    updatedContext.budgetDop = signals.budgetDop
    updatedContext.budgetDisplay = signals.budgetDisplay
  }

  if (signals.vehicleType) updatedContext.vehicleType = signals.vehicleType
  if (signals.transmission) updatedContext.transmission = signals.transmission
  if (signals.preferredBrand) updatedContext.preferredBrand = signals.preferredBrand
  if (signals.usage) updatedContext.usage = signals.usage
  if (signals.fuelType) updatedContext.fuelType = signals.fuelType
  if (signals.drivetrain) updatedContext.drivetrain = signals.drivetrain
  if (signals.wantsFinancing !== null) updatedContext.wantsFinancing = signals.wantsFinancing
  if (signals.requestedVehicleIds.length) updatedContext.requestedVehicleIds = signals.requestedVehicleIds

  updatedContext.lastIntent = intent

  return {
    signals,
    carryForward,
    updatedContext,
  }
}

export function attachRecommendationContext({ updatedContext, intent, recommendedVehicles }) {
  return {
    ...updatedContext,
    lastIntent: intent,
    lastRecommendedVehicleIds: recommendedVehicles.map((vehicle) => vehicle.id),
  }
}

export function getUsdToDopRate() {
  return USD_TO_DOP
}
