import {
  extractMessageSignals,
  normalizeChatContext,
  normalizeText,
} from './context.service.js'

const DEALER_QUESTION_KEYWORDS = [
  'horario',
  'hora',
  'abren',
  'abierto',
  'ubicacion',
  'ubicación',
  'direccion',
  'dirección',
  'donde estan',
  'dónde están',
  'telefono',
  'teléfono',
  'whatsapp',
  'correo',
  'email',
  'dealer',
  'concesionario',
  'sucursal',
  'taller',
  'mantenimiento',
  'garantia',
  'garantía',
  'prueba de manejo',
  'test drive',
]

const GREETING_KEYWORDS = [
  'hola',
  'buenas',
  'buenos dias',
  'buen día',
  'buenas tardes',
  'buenas noches',
  'saludos',
]

const OUT_OF_SCOPE_KEYWORDS = [
  'clima',
  'tiempo',
  'temperatura',
  'noticias',
  'presidente',
  'politica',
  'política',
  'bitcoin',
  'receta',
  'matematica',
  'matemática',
  'tarea',
  'programacion',
  'programación',
]

const CHEAPEST_KEYWORDS = [
  'mas economico',
  'más economico',
  'mas económico',
  'más económico',
  'mas barato',
  'más barato',
  'menor precio',
  'lo mas economico',
  'lo más económico',
  'opcion mas barata',
  'opción más barata',
]

const MOST_EXPENSIVE_KEYWORDS = [
  'mas caro',
  'más caro',
  'mas costoso',
  'más costoso',
  'mayor precio',
  'tope de gama',
  'mas exclusivo',
  'más exclusivo',
]

const FINANCING_KEYWORDS = [
  'financiar',
  'financiamiento',
  'financian',
  'cuota',
  'cuotas',
  'inicial',
  'prestamo',
  'préstamo',
  'credito',
  'crédito',
  'banco',
]

const APPOINTMENT_KEYWORDS = [
  'agendar',
  'agenda',
  'cita',
  'test drive',
  'prueba de manejo',
  'verlo',
  'verla',
  'ver ese',
  'visitar',
  'pasar por alla',
  'pasar por allá',
]

const WHATSAPP_KEYWORDS = [
  'whatsapp',
  'asesor',
  'contacto',
  'contactarme',
  'hablar con alguien',
  'hablar con un asesor',
  'llamar',
  'telefono',
  'teléfono',
]

const COMPARE_KEYWORDS = [
  'compar',
  'vs',
  'versus',
  'diferencia',
  'cual conviene mas',
  'cuál conviene más',
  'cual me recomiendas entre',
  'cuál me recomiendas entre',
]

const DETAILS_KEYWORDS = [
  'detalle',
  'detalles',
  'especificaciones',
  'specs',
  'ficha',
  'hablame de',
  'háblame de',
  'cuentame de',
  'cuéntame de',
  'mas sobre',
  'más sobre',
  'informacion de',
  'información de',
]

const INVENTORY_SIGNAL_KEYWORDS = [
  'vehiculo',
  'vehículo',
  'carro',
  'carros',
  'jeepeta',
  'jeepetas',
  'pickup',
  'pickups',
  'suv',
  'sedan',
  'sedán',
  'gasolina',
  'diesel',
  'diésel',
  'hibrido',
  'híbrido',
  'electrico',
  'eléctrico',
  '4x4',
  'awd',
  'marca',
  'toyota',
  'lexus',
  'honda',
  'jeep',
  'isuzu',
]

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)))
}

function looksLikeVehicleQuestion(text, signals) {
  return Boolean(
    signals.budgetUsd
    || signals.vehicleType
    || signals.preferredBrand
    || signals.fuelType
    || signals.transmission
    || signals.drivetrain
    || signals.requestedVehicleIds.length
    || signals.usage
    || signals.wantsFinancing !== null
    || includesAny(text, INVENTORY_SIGNAL_KEYWORDS)
  )
}

export function detectIntent({ message, currentContext = {} }) {
  const text = normalizeText(String(message ?? '').trim())
  const signals = extractMessageSignals(message)
  const context = normalizeChatContext(currentContext)

  if (!text) return 'general_dealer_question'

  if (includesAny(text, WHATSAPP_KEYWORDS) && !looksLikeVehicleQuestion(text, signals)) {
    return 'whatsapp_contact'
  }

  if (
    includesAny(text, APPOINTMENT_KEYWORDS)
    || (signals.requestedVehicleIds.length > 0 && includesAny(text, ['quiero verlo', 'quiero verla']))
  ) {
    return 'appointment_request'
  }

  if (
    includesAny(text, COMPARE_KEYWORDS)
    || signals.requestedVehicleIds.length >= 2
    || (includesAny(text, ['comparalo', 'compáralo', 'comparalos', 'compáralos']) && context.lastRecommendedVehicleIds.length >= 2)
  ) {
    return 'compare_vehicles'
  }

  if (
    includesAny(text, DETAILS_KEYWORDS)
    || (signals.requestedVehicleIds.length === 1 && !includesAny(text, CHEAPEST_KEYWORDS) && !includesAny(text, MOST_EXPENSIVE_KEYWORDS))
  ) {
    return 'vehicle_details'
  }

  if (includesAny(text, CHEAPEST_KEYWORDS)) {
    return 'cheapest_vehicle'
  }

  if (includesAny(text, MOST_EXPENSIVE_KEYWORDS)) {
    return 'most_expensive_vehicle'
  }

  if (includesAny(text, FINANCING_KEYWORDS) || signals.wantsFinancing === true) {
    return 'financing_question'
  }

  if (signals.budgetUsd) {
    return 'budget_search'
  }

  if (signals.vehicleType === 'SUV') {
    return 'suv_search'
  }

  if (signals.vehicleType === 'Sedán') {
    return 'sedan_search'
  }

  if (signals.vehicleType === 'Pickup') {
    return 'pickup_search'
  }

  if (signals.usage === 'familiar' || includesAny(text, ['familiar', 'familia', 'hijos', '7 pasajeros', 'siete pasajeros'])) {
    return 'family_vehicle'
  }

  if (looksLikeVehicleQuestion(text, signals)) {
    return 'inventory_search'
  }

  if (includesAny(text, DEALER_QUESTION_KEYWORDS) || includesAny(text, GREETING_KEYWORDS)) {
    return 'general_dealer_question'
  }

  if (includesAny(text, OUT_OF_SCOPE_KEYWORDS)) {
    return 'out_of_scope'
  }

  return 'out_of_scope'
}
