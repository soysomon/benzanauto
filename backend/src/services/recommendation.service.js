import { COMPANY, buildMapsUrl, buildWhatsAppUrl } from '../../../shared/company.js'
import { vehicles } from '../data/inventory.js'
import { getUsdToDopRate, normalizeText } from './context.service.js'

const MAX_RECOMMENDATIONS = 3
const CARD_INTENTS = new Set([
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
])

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

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)))
}

function equalIdLists(a = [], b = []) {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function matchesTransmission(vehicle, transmission) {
  if (!transmission) return true

  const normalizedVehicleTransmission = normalizeText(vehicle.transmission)
  const normalizedRequested = normalizeText(transmission)

  if (normalizedRequested === 'automatico' || normalizedRequested === 'automático') {
    return normalizedVehicleTransmission.includes('automatico') || normalizedVehicleTransmission.includes('cvt')
  }

  if (normalizedRequested === 'manual') {
    return normalizedVehicleTransmission.includes('manual')
  }

  return normalizedVehicleTransmission.includes(normalizedRequested)
}

function matchesDrivetrain(vehicle, drivetrain) {
  if (!drivetrain) return true

  const normalizedVehicleTraction = normalizeText(vehicle.traction)
  const normalizedRequested = normalizeText(drivetrain)

  if (normalizedRequested === '4x4') {
    return normalizedVehicleTraction.includes('4x4') || normalizedVehicleTraction.includes('4wd')
  }

  return normalizedVehicleTraction.includes(normalizedRequested)
}

function getVehicleById(id) {
  return vehicles.find((vehicle) => vehicle.id === id) ?? null
}

function getVehiclesByIds(ids = []) {
  return ids
    .map((id) => getVehicleById(id))
    .filter(Boolean)
}

function getCategoryFromIntent(intent, context) {
  if (intent === 'suv_search') return 'SUV'
  if (intent === 'sedan_search') return 'Sedán'
  if (intent === 'pickup_search') return 'Pickup'
  return context.vehicleType
}

function buildReason(vehicle, context, intent, isAlternative = false) {
  const parts = []

  if (isAlternative) {
    parts.push('Alternativa cercana')
  }

  if (intent === 'family_vehicle' || context.usage === 'familiar') {
    parts.push(`${vehicle.specs.capacidad} pasajeros`)
  }

  if (context.vehicleType && vehicle.category === context.vehicleType) {
    parts.push(vehicle.category)
  } else if (!parts.includes(vehicle.category)) {
    parts.push(vehicle.category)
  }

  if (context.fuelType && context.fuelType !== 'Eléctrico' && vehicle.fuel === context.fuelType) {
    parts.push(vehicle.fuel)
  } else if (!parts.includes(vehicle.fuel) && (intent === 'budget_search' || intent === 'inventory_search')) {
    parts.push(vehicle.fuel)
  }

  if (context.drivetrain && matchesDrivetrain(vehicle, context.drivetrain)) {
    parts.push(vehicle.traction)
  } else if (!parts.includes(vehicle.traction) && (intent === 'family_vehicle' || intent === 'compare_vehicles')) {
    parts.push(vehicle.traction)
  }

  return [...new Set(parts)].join(' · ')
}

function scoreVehicle(vehicle, context, intent) {
  let score = 0

  if (context.preferredBrand && vehicle.brand === context.preferredBrand) score += 32
  if (context.fuelType && context.fuelType !== 'Eléctrico' && vehicle.fuel === context.fuelType) score += 28
  if (context.transmission && matchesTransmission(vehicle, context.transmission)) score += 10
  if (context.drivetrain && matchesDrivetrain(vehicle, context.drivetrain)) score += 18

  const desiredCategory = getCategoryFromIntent(intent, context)
  if (desiredCategory && vehicle.category === desiredCategory) score += 34

  if (intent === 'family_vehicle' || context.usage === 'familiar') {
    score += vehicle.specs.capacidad >= 7 ? 30 : vehicle.specs.capacidad >= 5 ? 18 : -20
    score += vehicle.category === 'SUV' ? 14 : 0
  }

  if (context.usage === 'trabajo') {
    score += vehicle.category === 'Pickup' ? 24 : 0
  }

  if (context.usage === 'ciudad') {
    score += vehicle.fuel === 'Híbrido' ? 14 : 0
    score += vehicle.category === 'SUV' ? 6 : 0
  }

  if (context.usage === 'aventura') {
    score += matchesDrivetrain(vehicle, '4x4') || matchesDrivetrain(vehicle, 'AWD') ? 16 : 0
  }

  if (context.usage === 'lujo') {
    score += vehicle.brand === 'Lexus' ? 18 : 0
    score += vehicle.price >= 70000 ? 10 : 0
  }

  if (context.budgetUsd) {
    score += vehicle.price <= context.budgetUsd ? 16 : -Math.min(42, Math.ceil((vehicle.price - context.budgetUsd) / 5000))
  }

  score += vehicle.status === 'Nuevo' ? 4 : 0
  score += Math.max(0, vehicle.year - 2021)

  return score
}

function applyBaseFilters(intent, context, options = {}) {
  const desiredCategory = getCategoryFromIntent(intent, context)
  const ignoreBudget = options.ignoreBudget === true
  const allowElectricFallback = options.allowElectricFallback === true

  return vehicles.filter((vehicle) => {
    if (desiredCategory && vehicle.category !== desiredCategory) return false
    if (context.preferredBrand && vehicle.brand !== context.preferredBrand) return false
    if (context.transmission && !matchesTransmission(vehicle, context.transmission)) return false
    if (context.drivetrain && !matchesDrivetrain(vehicle, context.drivetrain)) return false
    if (context.fuelType && context.fuelType !== 'Eléctrico' && vehicle.fuel !== context.fuelType) return false
    if (context.fuelType === 'Eléctrico' && !allowElectricFallback) return false
    if (intent === 'family_vehicle' && vehicle.specs.capacidad < 5) return false
    if (context.usage === 'familiar' && vehicle.specs.capacidad < 5) return false
    if (!ignoreBudget && context.budgetUsd && vehicle.price > context.budgetUsd) return false
    return true
  })
}

function rankVehicles(candidateVehicles, context, intent) {
  return candidateVehicles
    .map((vehicle) => ({
      ...vehicle,
      score: scoreVehicle(vehicle, context, intent),
    }))
    .sort((a, b) => b.score - a.score || a.price - b.price)
}

function serializeVehicle(vehicle, context, intent, isAlternative = false) {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    image: vehicle.image,
    category: vehicle.category,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    traction: vehicle.traction,
    status: vehicle.status,
    badge: vehicle.badge,
    description: vehicle.description,
    specs: vehicle.specs,
    reason: buildReason(vehicle, context, intent, isAlternative),
  }
}

function buildBudgetLead(context) {
  if (!context.budgetUsd) return ''

  if (context.budgetDop) {
    return `Con ${formatDop(context.budgetDop)}, equivalente aproximado a ${formatUsd(context.budgetUsd)},`
  }

  return `Con un presupuesto de ${formatUsd(context.budgetUsd)},`
}

function buildDealerInfoReply(message) {
  const text = normalizeText(message)

  if (includesAny(text, ['horario', 'abren', 'hora'])) {
    return [
      `Nuestro horario es ${COMPANY.hours.summary}.`,
      `Si quieres, también te comparto la ubicación exacta o te coordino por WhatsApp para visitarnos.`,
    ].join('\n\n')
  }

  if (includesAny(text, ['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde estan', 'dónde están'])) {
    return [
      `Estamos ubicados en ${COMPANY.fullAddress}.`,
      `Si quieres llegar directo, aquí tienes el mapa: ${buildMapsUrl()}.`,
    ].join('\n\n')
  }

  if (includesAny(text, ['telefono', 'teléfono', 'llamar', 'whatsapp', 'contacto', 'correo', 'email'])) {
    return [
      `Puedes contactarnos al ${COMPANY.phoneDisplay} o por WhatsApp en ${buildWhatsAppUrl()}.`,
      `Si prefieres, también te sigo orientando por aquí y luego te paso con un asesor.`,
    ].join('\n\n')
  }

  if (includesAny(text, ['taller', 'mantenimiento', 'servicio'])) {
    return [
      `Sí, contamos con servicio de taller y mantenimiento para apoyarte después de la compra.`,
      `Si quieres, te indico horario, ubicación o te paso con un asesor para coordinar.`,
    ].join('\n\n')
  }

  return [
    `Puedo ayudarte con inventario, presupuesto, financiamiento, ubicación, horario y coordinación con un asesor de ${COMPANY.name}.`,
    `Cuéntame qué necesitas y te lo respondo con gusto.`,
  ].join('\n\n')
}

function buildOutOfScopeReply() {
  return [
    `Puedo ayudarte con vehículos, inventario, presupuesto, financiamiento, ubicación y coordinación con el dealer.`,
    `Si quieres, dime qué tipo de vehículo buscas y te recomiendo opciones reales del inventario.`,
  ].join('\n\n')
}

function buildFinancingReply(context, referenceVehicles) {
  const lead = context.budgetUsd ? `${buildBudgetLead(context)} ` : ''
  const nextVehicle = referenceVehicles[0]

  if (nextVehicle) {
    return [
      `${lead}podemos orientarte con opciones de financiamiento para unidades como el ${nextVehicle.brand} ${nextVehicle.model} ${nextVehicle.year}, que está en ${formatUsd(nextVehicle.price)}.`,
      `No te puedo prometer aprobación, pero sí ayudarte a estimar una inicial razonable y decirte qué tipo de rango podrías evaluar.`,
      `Si quieres, te hago una orientación rápida según tu presupuesto y si prefieres cuota baja o menor inicial.`,
    ].join('\n\n')
  }

  return [
    `${lead}podemos orientarte con financiamiento y ayudarte a aterrizar una opción realista del inventario.`,
    `No te puedo prometer aprobación, pero sí ayudarte a estimar inicial, rango de cuota y qué tipo de unidad te convendría mirar.`,
    `Si quieres, dime tu presupuesto aproximado y si prefieres SUV, sedan o pickup.`,
  ].join('\n\n')
}

function buildAppointmentReply(referenceVehicles) {
  const vehicle = referenceVehicles[0]
  const intro = vehicle
    ? `Podemos coordinar para que veas el ${vehicle.brand} ${vehicle.model} ${vehicle.year}.`
    : `Podemos coordinar una visita o una prueba de manejo.`

  return [
    intro,
    `Lo más rápido es escribirnos por WhatsApp: ${buildWhatsAppUrl('Hola, quiero coordinar una visita o prueba de manejo')}.`,
    `También puedes visitarnos en ${COMPANY.fullAddress}.`,
  ].join('\n\n')
}

function buildWhatsappReply() {
  return [
    `Claro. Puedes escribirnos directo por WhatsApp aquí: ${buildWhatsAppUrl('Hola, quiero hablar con un asesor de ventas')}.`,
    `Si quieres, antes de pasarte con un asesor también te puedo dejar una preselección según tu presupuesto o el tipo de vehículo que buscas.`,
  ].join('\n\n')
}

function buildVehicleDetailsReply(vehicle) {
  if (!vehicle) {
    return [
      `Puedo darte el detalle de cualquier unidad del inventario.`,
      `Solo dime el modelo exacto o el vehículo que viste y te resumo precio, motorización, combustible, tracción y para qué tipo de uso conviene.`,
    ].join('\n\n')
  }

  return [
    `El ${vehicle.brand} ${vehicle.model} ${vehicle.year} está en ${formatUsd(vehicle.price)}.`,
    `Es un ${vehicle.category} ${vehicle.fuel}, transmisión ${vehicle.transmission}, tracción ${vehicle.traction} y capacidad para ${vehicle.specs.capacidad} pasajeros.`,
    `${vehicle.description} Si quieres, también te lo comparo con otra opción del inventario o te digo si conviene más para familia, ciudad o trabajo.`,
  ].join('\n\n')
}

function buildComparisonReply(referenceVehicles) {
  if (referenceVehicles.length < 2) {
    return [
      `Puedo compararte dos o tres unidades del inventario con precio, tipo de uso y puntos fuertes.`,
      `Solo dime cuáles modelos quieres poner frente a frente y te hago una comparación clara.`,
    ].join('\n\n')
  }

  const [first, second, third] = referenceVehicles
  const lines = [
    `Te hago una comparación rápida entre ${first.brand} ${first.model} ${first.year} (${formatUsd(first.price)}) y ${second.brand} ${second.model} ${second.year} (${formatUsd(second.price)}).`,
    `${first.brand} ${first.model}: ${first.category}, ${first.fuel}, ${first.traction} y ${first.specs.capacidad} pasajeros.`,
    `${second.brand} ${second.model}: ${second.category}, ${second.fuel}, ${second.traction} y ${second.specs.capacidad} pasajeros.`,
  ]

  if (third) {
    lines.push(`También puedo incluir el ${third.brand} ${third.model} ${third.year} (${formatUsd(third.price)}) si quieres una tercera referencia.`)
  } else {
    lines.push('Si me dices qué valoras más, te digo cuál conviene más por comodidad, consumo o capacidad.')
  }

  return lines.join('\n\n')
}

function buildVehicleListReply(referenceVehicles, intent, context) {
  if (!referenceVehicles.length) {
    return [
      `No encontré una coincidencia exacta con esos criterios ahora mismo.`,
      `Si quieres, puedo abrir un poco la búsqueda por presupuesto, combustible o tipo de vehículo para enseñarte la alternativa más cercana.`,
    ].join('\n\n')
  }

  if (intent === 'cheapest_vehicle') {
    const vehicle = referenceVehicles[0]
    return [
      `El vehículo más económico disponible actualmente es el ${vehicle.brand} ${vehicle.model} ${vehicle.year}, con precio de ${formatUsd(vehicle.price)}.`,
      `Es una buena opción si buscas entrada más accesible al inventario actual, con ${vehicle.fuel}, tracción ${vehicle.traction} y formato ${vehicle.category}.`,
      `Si quieres, te lo comparo con las otras opciones cercanas por precio o te digo cuál conviene más para tu uso.`,
    ].join('\n\n')
  }

  if (intent === 'most_expensive_vehicle') {
    const vehicle = referenceVehicles[0]
    return [
      `El vehículo de mayor precio disponible actualmente es el ${vehicle.brand} ${vehicle.model} ${vehicle.year}, con precio de ${formatUsd(vehicle.price)}.`,
      `Es una propuesta premium dentro del inventario, con configuración ${vehicle.fuel}, tracción ${vehicle.traction} y capacidad para ${vehicle.specs.capacidad} pasajeros.`,
      `Si quieres, también te lo comparo con otras opciones de lujo o familiares para ver cuál te conviene más.`,
    ].join('\n\n')
  }

  const intro = intent === 'family_vehicle'
    ? 'Estas son las opciones que mejor encajan si buscas un vehículo familiar:'
    : 'Estas son las opciones disponibles que mejor encajan contigo ahora mismo:'

  const lines = referenceVehicles.map((vehicle) => (
    `- ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${formatUsd(vehicle.price)}) · ${buildReason(vehicle, context, intent)}`
  ))

  return [
    intro,
    ...lines,
    '',
    'Si quieres, te las ordeno por precio, te digo cuál conviene más según tu uso o te ayudo a bajar la selección a una sola opción.',
  ].join('\n')
}

function buildBudgetReply(context, exactMatches, alternatives, intent) {
  if (exactMatches.length > 0) {
    const lead = `${buildBudgetLead(context)} estas son las opciones reales que sí caen dentro de ese rango o muy alineadas a lo que buscas:`
    const lines = exactMatches.map((vehicle) => (
      `- ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${formatUsd(vehicle.price)}) · ${buildReason(vehicle, context, intent)}`
    ))

    return [
      lead,
      ...lines,
      '',
      'Si quieres, ahora mismo te las puedo ordenar por precio o decirte cuál da más valor por tu dinero.',
    ].join('\n')
  }

  const closest = alternatives[0]

  if (!closest) {
    return [
      `${buildBudgetLead(context)} no tenemos una unidad dentro de ese rango ahora mismo.`,
      `Si quieres, puedo ayudarte a revisar alternativas por financiamiento o a subir el rango de búsqueda paso a paso.`,
    ].join('\n\n')
  }

  return [
    `${buildBudgetLead(context)} no tenemos una unidad dentro de ese rango.`,
    `La opción más cercana disponible ahora mismo es el ${closest.brand} ${closest.model} ${closest.year} por ${formatUsd(closest.price)}.`,
    `Si estás abierto a financiamiento, puedo ayudarte a estimar una inicial razonable o enseñarte las alternativas más cercanas.`,
  ].join('\n\n')
}

function buildElectricFallbackReply(alternatives) {
  if (!alternatives.length) {
    return [
      `Ahora mismo no contamos con vehículos eléctricos en inventario.`,
      `Si quieres, te puedo mostrar opciones híbridas reales que son lo más cercano en eficiencia y uso diario.`,
    ].join('\n\n')
  }

  return [
    `Ahora mismo no contamos con vehículos eléctricos en inventario.`,
    `Lo más cercano que sí tenemos son estas opciones híbridas reales, que te pueden funcionar muy bien por consumo y uso diario.`,
  ].join('\n\n')
}

function buildPromptFacts({ intent, context, referenceVehicles, fallbackReply, note }) {
  const contextFacts = [
    `Intencion actual: ${intent}`,
    `Presupuesto USD: ${context.budgetUsd ?? 'none'}`,
    `Presupuesto DOP: ${context.budgetDop ?? 'none'}`,
    `Tipo de vehiculo: ${context.vehicleType ?? 'none'}`,
    `Marca preferida: ${context.preferredBrand ?? 'none'}`,
    `Combustible: ${context.fuelType ?? 'none'}`,
    `Transmision: ${context.transmission ?? 'none'}`,
    `Traccion: ${context.drivetrain ?? 'none'}`,
    `Uso: ${context.usage ?? 'none'}`,
    `Busca financiamiento: ${context.wantsFinancing === null ? 'unknown' : String(context.wantsFinancing)}`,
  ]

  const vehicleFacts = referenceVehicles.length > 0
    ? referenceVehicles.map((vehicle, index) => (
      `${index + 1}. ${vehicle.brand} ${vehicle.model} ${vehicle.year} | ${formatUsd(vehicle.price)} | ${vehicle.category} | ${vehicle.fuel} | ${vehicle.traction} | ${vehicle.transmission} | ${vehicle.specs.capacidad} pasajeros`
    ))
    : ['No hay vehiculos recomendados para mostrar en esta respuesta.']

  return [
    ...contextFacts,
    `Nota adicional: ${note || 'none'}`,
    'Vehiculos relevantes del turno:',
    ...vehicleFacts,
    'Borrador factual que debes respetar:',
    fallbackReply,
  ].join('\n')
}

function dedupeRecommendedVehicles(intent, referenceVehicles, currentContext) {
  if (!CARD_INTENTS.has(intent)) return []

  const serialized = referenceVehicles.slice(0, MAX_RECOMMENDATIONS)
  const currentIds = serialized.map((vehicle) => vehicle.id)
  const previousIds = Array.isArray(currentContext?.lastRecommendedVehicleIds)
    ? currentContext.lastRecommendedVehicleIds
    : []

  if (equalIdLists(currentIds, previousIds)) {
    return []
  }

  return serialized
}

export function getRecommendationResponse({ intent, message, currentContext, updatedContext, signals }) {
  const referenceVehicles = []
  let recommendedVehicles = []
  let fallbackReply = ''
  let note = ''

  if (updatedContext.fuelType === 'Eléctrico') {
    const hybridAlternatives = rankVehicles(
      vehicles.filter((vehicle) => vehicle.fuel === 'Híbrido'),
      { ...updatedContext, fuelType: 'Híbrido' },
      'inventory_search',
    )
      .slice(0, MAX_RECOMMENDATIONS)
      .map((vehicle) => serializeVehicle(vehicle, { ...updatedContext, fuelType: 'Híbrido' }, 'inventory_search', true))

    fallbackReply = buildElectricFallbackReply(hybridAlternatives)
    note = 'No hay unidades electricas; ofrecer alternativas hibridas reales.'

    return {
      fallbackReply,
      note,
      promptFacts: buildPromptFacts({
        intent,
        context: updatedContext,
        referenceVehicles: hybridAlternatives,
        fallbackReply,
        note,
      }),
      referenceVehicles: hybridAlternatives,
      recommendedVehicles: dedupeRecommendedVehicles(intent, hybridAlternatives, currentContext),
    }
  }

  switch (intent) {
    case 'cheapest_vehicle': {
      const results = applyBaseFilters(intent, updatedContext, { ignoreBudget: true })
        .sort((a, b) => a.price - b.price || b.year - a.year)
        .slice(0, 1)

      referenceVehicles.push(...results.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent)))
      fallbackReply = buildVehicleListReply(results, intent, updatedContext)
      note = 'Responder con la unidad de menor precio disponible para la intencion actual.'
      break
    }

    case 'most_expensive_vehicle': {
      const results = applyBaseFilters(intent, updatedContext, { ignoreBudget: true })
        .sort((a, b) => b.price - a.price || b.year - a.year)
        .slice(0, 1)

      referenceVehicles.push(...results.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent)))
      fallbackReply = buildVehicleListReply(results, intent, updatedContext)
      note = 'Responder con la unidad de mayor precio disponible para la intencion actual.'
      break
    }

    case 'budget_search': {
      const basePool = applyBaseFilters(intent, updatedContext, { ignoreBudget: true })
      const exactMatches = rankVehicles(
        basePool.filter((vehicle) => !updatedContext.budgetUsd || vehicle.price <= updatedContext.budgetUsd),
        updatedContext,
        intent,
      ).slice(0, MAX_RECOMMENDATIONS)

      const alternatives = basePool
        .slice()
        .sort((a, b) => (
          Math.abs(a.price - updatedContext.budgetUsd) - Math.abs(b.price - updatedContext.budgetUsd)
          || a.price - b.price
        ))
        .slice(0, MAX_RECOMMENDATIONS)

      const vehiclesForCards = exactMatches.length > 0 ? exactMatches : alternatives
      referenceVehicles.push(
        ...vehiclesForCards.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent, exactMatches.length === 0)),
      )
      fallbackReply = buildBudgetReply(updatedContext, exactMatches, alternatives, intent)
      note = `Usar conversion USD_TO_DOP=${getUsdToDopRate()} cuando el presupuesto venga en pesos dominicanos.`
      break
    }

    case 'suv_search':
    case 'sedan_search':
    case 'pickup_search':
    case 'family_vehicle':
    case 'inventory_search': {
      const exactMatches = rankVehicles(
        applyBaseFilters(intent, updatedContext),
        updatedContext,
        intent,
      ).slice(0, MAX_RECOMMENDATIONS)

      const relaxedMatches = rankVehicles(
        applyBaseFilters(intent, updatedContext, { ignoreBudget: true }),
        updatedContext,
        intent,
      ).slice(0, MAX_RECOMMENDATIONS)

      const vehiclesForCards = exactMatches.length > 0 ? exactMatches : relaxedMatches
      referenceVehicles.push(
        ...vehiclesForCards.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent, exactMatches.length === 0)),
      )

      if (intent === 'family_vehicle' && vehiclesForCards.length === 0) {
        fallbackReply = [
          'No encontré una coincidencia exacta para un vehículo familiar con esos criterios ahora mismo.',
          'Si quieres, te puedo abrir un poco la búsqueda y enseñarte las opciones más cercanas por espacio, precio o tracción.',
        ].join('\n\n')
      } else {
        fallbackReply = buildVehicleListReply(vehiclesForCards, intent, updatedContext)
      }

      note = exactMatches.length > 0
        ? 'Se encontraron coincidencias reales en inventario.'
        : 'No hubo coincidencia exacta; ofrecer alternativas cercanas sin inventar disponibilidad.'
      break
    }

    case 'compare_vehicles': {
      const comparisonIds = signals.requestedVehicleIds.length >= 2
        ? signals.requestedVehicleIds
        : updatedContext.requestedVehicleIds.length >= 2
          ? updatedContext.requestedVehicleIds
          : updatedContext.lastRecommendedVehicleIds.slice(0, 2)

      const comparisonVehicles = getVehiclesByIds(comparisonIds).slice(0, MAX_RECOMMENDATIONS)
      referenceVehicles.push(...comparisonVehicles.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent)))
      fallbackReply = buildComparisonReply(comparisonVehicles)
      note = 'Comparar solo vehiculos reales del inventario mencionados o sugeridos previamente.'
      break
    }

    case 'vehicle_details': {
      const detailVehicle = getVehiclesByIds(
        signals.requestedVehicleIds.length > 0
          ? signals.requestedVehicleIds
          : updatedContext.requestedVehicleIds.length > 0
            ? updatedContext.requestedVehicleIds
            : updatedContext.lastRecommendedVehicleIds.slice(0, 1),
      )[0]

      if (detailVehicle) {
        referenceVehicles.push(serializeVehicle(detailVehicle, updatedContext, intent))
      }

      fallbackReply = buildVehicleDetailsReply(detailVehicle)
      note = 'Responder con detalles factuales de la unidad seleccionada.'
      break
    }

    case 'financing_question': {
      const financingVehicles = getVehiclesByIds(updatedContext.lastRecommendedVehicleIds).slice(0, MAX_RECOMMENDATIONS)
      referenceVehicles.push(...financingVehicles.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent)))
      fallbackReply = buildFinancingReply(updatedContext, financingVehicles)
      note = 'No prometer aprobacion; orientar con inicial y rango de cuota.'
      break
    }

    case 'appointment_request': {
      const appointmentVehicles = getVehiclesByIds(
        signals.requestedVehicleIds.length > 0
          ? signals.requestedVehicleIds
          : updatedContext.lastRecommendedVehicleIds.slice(0, 1),
      )
      referenceVehicles.push(...appointmentVehicles.map((vehicle) => serializeVehicle(vehicle, updatedContext, intent)))
      fallbackReply = buildAppointmentReply(appointmentVehicles)
      note = 'Invitar a coordinar por WhatsApp o visita fisica.'
      break
    }

    case 'whatsapp_contact': {
      fallbackReply = buildWhatsappReply()
      note = 'Proveer canal directo de WhatsApp.'
      break
    }

    case 'out_of_scope': {
      fallbackReply = buildOutOfScopeReply()
      note = 'Redirigir con cortesia a temas del dealer.'
      break
    }

    case 'general_dealer_question':
    default: {
      fallbackReply = buildDealerInfoReply(message)
      note = 'Responder solo con informacion del dealer y dejar la conversacion abierta.'
      break
    }
  }

  recommendedVehicles = dedupeRecommendedVehicles(intent, referenceVehicles, currentContext)

  return {
    fallbackReply,
    note,
    promptFacts: buildPromptFacts({
      intent,
      context: updatedContext,
      referenceVehicles,
      fallbackReply,
      note,
    }),
    referenceVehicles,
    recommendedVehicles,
  }
}
