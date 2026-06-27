import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COMPANY } from '../../shared/company.js'
import StatePanel from '../components/ui/StatePanel'
import {
  createAdminVehicle,
  deleteAdminVehicle,
  deleteAdminVehicleImage,
  getAdminDashboardStats,
  getAdminMe,
  getAdminVehicle,
  listAdminVehicles,
  logoutAdmin,
  markAdminVehicleSold,
  publishAdminVehicle,
  toggleAdminVehicleFeatured,
  unpublishAdminVehicle,
  updateAdminVehicle,
  updateAdminVehicleImagePresentation,
  uploadAdminVehicleImages,
} from '../lib/adminApi'
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  getStoredAdminUser,
  setStoredAdminUser,
} from '../lib/adminSession'
import { ApiError, UNAUTHORIZED_EVENT_NAME } from '../lib/apiClient'
import {
  fetchVehicleEnrichment,
  fetchVehicleMakes,
  fetchVehicleModels,
  fetchVehicleYears,
} from '../lib/vehicleEnrichmentApi'

const OTHER_OPTION = '__other__'

const WIZARD_STEPS = [
  {
    id: 'details',
    title: 'Datos del vehículo',
    description: 'Información clave, precio y condición en un solo paso.',
  },
  {
    id: 'features',
    title: 'Características',
    description: 'Qué lo hace atractivo y qué incluye.',
  },
  {
    id: 'images',
    title: 'Imágenes',
    description: 'Sube varias fotos, elige portada y ordena la galería.',
  },
  {
    id: 'preview',
    title: 'Vista previa',
    description: 'Revisa cómo se presentará antes de publicarlo.',
  },
  {
    id: 'publish',
    title: 'Publicar',
    description: 'Decide si lo dejas como borrador o si sale en vivo.',
  },
]

const VIEW_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'draft', label: 'Borradores' },
  { id: 'sold', label: 'Vendidos' },
  { id: 'featured', label: 'Destacados' },
]

// Static list used for toFormState normalization — must cover all brands likely in DB
const BRAND_OPTIONS = [
  'Acura', 'Alfa Romeo', 'Audi',
  'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën',
  'Daihatsu', 'Dodge',
  'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC',
  'Honda', 'Hyundai',
  'Infiniti', 'Isuzu',
  'Jaguar', 'Jeep',
  'Kia',
  'Land Rover', 'Lexus', 'Lincoln',
  'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan',
  'Peugeot', 'Porsche',
  'RAM', 'Renault',
  'Subaru', 'Suzuki',
  'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
  OTHER_OPTION,
]

const COLOR_OPTIONS = [
  'Blanco',
  'Negro',
  'Gris',
  'Plata',
  'Azul',
  'Rojo',
  'Beige',
  OTHER_OPTION,
]

const LOCATION_OPTIONS = [
  COMPANY.shortAddress,
  'Santo Domingo, RD',
  'Santiago, RD',
  'Puerto Plata, RD',
  OTHER_OPTION,
]

const BODY_TYPE_OPTIONS = ['SUV', 'Pickup', 'Sedan', 'Coupe', 'Hatchback', 'Van', 'Crossover', 'Comercial', OTHER_OPTION]
const CONDITION_OPTIONS = ['Nuevo', 'Usado', 'Certificado']
const CURRENCY_OPTIONS = ['USD', 'DOP', 'EUR']
const TRANSMISSION_OPTIONS = ['Automático', 'Manual', 'CVT', 'DCT', 'eCVT', OTHER_OPTION]
const FUEL_OPTIONS = ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'GLP', OTHER_OPTION]
const DRIVETRAIN_OPTIONS = ['4x4', 'AWD', '4x2', 'FWD', 'RWD', OTHER_OPTION]
const BADGE_OPTIONS = ['', 'Nuevo', 'Oferta', 'Recién importado', 'Full', 'Popular']
const FEATURE_OPTIONS = [
  'Camara 360',
  'Apple CarPlay',
  'Android Auto',
  'Asientos en piel',
  'Asientos ventilados',
  'Sunroof',
  'Sensores de parqueo',
  'Pantalla táctil',
  'Control crucero',
  'Faros LED',
  'Llave inteligente',
  'Aros de lujo',
]

const PREMIUM_BRANDS = new Set([
  'BMW', 'Mercedes-Benz', 'Lexus', 'Audi', 'Porsche', 'Cadillac',
  'Genesis', 'Volvo', 'Land Rover', 'Infiniti', 'Acura', 'Lincoln',
])

function suggestFeaturesForVehicle(brand, yearStr, bodyType) {
  const year = Number(yearStr) || 0
  const features = new Set()
  if (year >= 2019) {
    features.add('Apple CarPlay')
    features.add('Android Auto')
    features.add('Pantalla táctil')
  }
  if (year >= 2018) features.add('Camara 360')
  if (year >= 2017) {
    features.add('Sensores de parqueo')
    features.add('Control crucero')
    features.add('Faros LED')
  }
  if (year >= 2016) features.add('Llave inteligente')
  if (PREMIUM_BRANDS.has(brand)) {
    features.add('Asientos en piel')
    features.add('Aros de lujo')
    if (year >= 2017) {
      features.add('Asientos ventilados')
      features.add('Sunroof')
    }
  }
  return [...features].filter((f) => FEATURE_OPTIONS.includes(f))
}

const FINAL_ACTION_OPTIONS = [
  {
    value: 'draft',
    label: 'Guardar como borrador',
    description: 'Ideal si aún faltan fotos o si quieres revisarlo luego.',
  },
  {
    value: 'published',
    label: 'Publicar vehículo',
    description: 'Listo para mostrarse en la web pública.',
  },
]

function roleCanManageVehicles(role) {
  return ['superadmin', 'admin', 'editor'].includes(role)
}

function roleCanDeleteVehicles(role) {
  return ['superadmin', 'admin'].includes(role)
}

function createSpecRow(key = '', value = '') {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    key,
    value,
  }
}

function createPendingUpload(file) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: file.name,
    size: file.size,
    previewUrl: URL.createObjectURL(file),
  }
}

function releasePendingUploads(items = []) {
  items.forEach((item) => {
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
}

function normalizeVehicleSnapshot(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return vehicle

  const normalizedImages = Array.isArray(vehicle.images)
    ? vehicle.images
      .map((image, index) => ({
        ...image,
        id: image?.id ?? image?._id ?? null,
        order: Number.isFinite(image?.order) ? image.order : index,
      }))
      .sort((left, right) => left.order - right.order)
    : []

  const normalizedVehicle = {
    ...vehicle,
    id: vehicle.id ?? vehicle._id ?? null,
    images: normalizedImages,
  }

  if (!normalizedVehicle.mainImage) {
    normalizedVehicle.mainImage = normalizedImages.find((image) => image.isMain)?.url ?? normalizedImages[0]?.url ?? ''
  }

  return normalizedVehicle
}

function normalizeChoice(value, options) {
  if (!value) return { choice: options[0], custom: '' }
  return options.includes(value)
    ? { choice: value, custom: '' }
    : { choice: OTHER_OPTION, custom: value }
}

function resolveChoiceValue(choice, customValue) {
  return choice === OTHER_OPTION ? customValue.trim() : String(choice).trim()
}

function buildSuggestedTitle(form) {
  const brand = resolveChoiceValue(form.brandChoice, form.customBrand)
  return [brand, form.model.trim(), form.year.trim()].filter(Boolean).join(' ')
}

function splitFeatures(features) {
  const selected = []
  const custom = []

  for (const feature of features ?? []) {
    if (FEATURE_OPTIONS.includes(feature)) {
      selected.push(feature)
    } else {
      custom.push(feature)
    }
  }

  return {
    selected,
    customText: custom.join(', '),
  }
}

function createInitialForm() {
  const currentYear = String(new Date().getFullYear())

  return {
    title: '',
    brandChoice: 'Toyota',
    customBrand: '',
    model: '',
    year: currentYear,
    bodyType: 'SUV',
    customBodyType: '',
    colorChoice: 'Blanco',
    customColor: '',
    locationChoice: COMPANY.shortAddress,
    customLocation: '',
    price: '',
    currency: 'USD',
    mileage: '0',
    condition: 'Nuevo',
    transmission: 'Automático',
    customTransmission: '',
    fuelType: 'Gasolina',
    customFuelType: '',
    drivetrain: '4x4',
    customDrivetrain: '',
    description: '',
    selectedFeatures: [],
    customFeaturesText: '',
    specRows: [createSpecRow()],
    badge: '',
    featured: false,
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
  }
}

function toFormState(vehicle) {
  if (!vehicle) return createInitialForm()

  const brand = normalizeChoice(vehicle.brand, BRAND_OPTIONS)
  const color = normalizeChoice(vehicle.color, COLOR_OPTIONS)
  const location = normalizeChoice(vehicle.location, LOCATION_OPTIONS)
  const bodyType = normalizeChoice(vehicle.bodyType, BODY_TYPE_OPTIONS)
  const transmission = normalizeChoice(vehicle.transmission, TRANSMISSION_OPTIONS)
  const fuelType = normalizeChoice(vehicle.fuelType, FUEL_OPTIONS)
  const drivetrain = normalizeChoice(vehicle.drivetrain || '', DRIVETRAIN_OPTIONS)
  const features = splitFeatures(vehicle.features)
  const specEntries = Object.entries(vehicle.specs ?? {})

  return {
    title: vehicle.title ?? '',
    brandChoice: brand.choice,
    customBrand: brand.custom,
    model: vehicle.model ?? '',
    year: String(vehicle.year ?? new Date().getFullYear()),
    bodyType: bodyType.choice,
    customBodyType: bodyType.custom,
    colorChoice: color.choice,
    customColor: color.custom,
    locationChoice: location.choice,
    customLocation: location.custom,
    price: String(vehicle.price ?? ''),
    currency: vehicle.currency ?? 'USD',
    mileage: String(vehicle.mileage ?? 0),
    condition: vehicle.condition ?? 'Nuevo',
    transmission: transmission.choice,
    customTransmission: transmission.custom,
    fuelType: fuelType.choice,
    customFuelType: fuelType.custom,
    drivetrain: drivetrain.choice || '4x4',
    customDrivetrain: drivetrain.custom,
    description: vehicle.description ?? '',
    selectedFeatures: features.selected,
    customFeaturesText: features.customText,
    specRows: specEntries.length > 0
      ? specEntries.map(([key, value]) => createSpecRow(key, String(value)))
      : [createSpecRow()],
    badge: vehicle.badge ?? '',
    featured: Boolean(vehicle.featured),
    status: vehicle.status ?? 'draft',
    seoTitle: vehicle.seoTitle ?? '',
    seoDescription: vehicle.seoDescription ?? '',
  }
}

function parseCommaList(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildSpecsObject(rows) {
  return rows.reduce((accumulator, row) => {
    const key = row.key.trim()
    const value = row.value.trim()
    if (key && value) {
      accumulator[key] = value
    }
    return accumulator
  }, {})
}

function optionalPayloadString(value) {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}

function buildVehiclePayload(form, statusOverride = null) {
  const title = form.title.trim() || buildSuggestedTitle(form)
  const features = [
    ...form.selectedFeatures,
    ...parseCommaList(form.customFeaturesText),
  ]

  return {
    title,
    brand: resolveChoiceValue(form.brandChoice, form.customBrand),
    model: form.model.trim(),
    year: Number.parseInt(form.year, 10),
    price: Number.parseFloat(form.price),
    currency: form.currency,
    mileage: Number.parseInt(form.mileage || '0', 10),
    transmission: resolveChoiceValue(form.transmission, form.customTransmission),
    fuelType: resolveChoiceValue(form.fuelType, form.customFuelType),
    bodyType: resolveChoiceValue(form.bodyType, form.customBodyType),
    drivetrain: optionalPayloadString(resolveChoiceValue(form.drivetrain, form.customDrivetrain)),
    color: resolveChoiceValue(form.colorChoice, form.customColor),
    condition: form.condition,
    location: resolveChoiceValue(form.locationChoice, form.customLocation),
    description: form.description.trim(),
    features: [...new Set(features)],
    specs: buildSpecsObject(form.specRows),
    badge: optionalPayloadString(form.badge),
    featured: Boolean(form.featured),
    status: statusOverride ?? form.status,
    seoTitle: optionalPayloadString(form.seoTitle),
    seoDescription: optionalPayloadString(form.seoDescription),
  }
}

function getFieldErrorsForStep(stepId, form, selectedVehicle) {
  const errors = {}
  const title = form.title.trim() || buildSuggestedTitle(form)
  const brand = resolveChoiceValue(form.brandChoice, form.customBrand)
  const bodyType = resolveChoiceValue(form.bodyType, form.customBodyType)
  const color = resolveChoiceValue(form.colorChoice, form.customColor)
  const location = resolveChoiceValue(form.locationChoice, form.customLocation)
  const transmission = resolveChoiceValue(form.transmission, form.customTransmission)
  const fuelType = resolveChoiceValue(form.fuelType, form.customFuelType)
  const imageCount = Array.isArray(selectedVehicle?.images) ? selectedVehicle.images.length : 0

  if (stepId === 'details') {
    if (!title || title.length < 4) errors.title = 'Dale un nombre claro al anuncio.'
    if (!brand || brand.length < 2) errors.brandChoice = 'Selecciona o escribe una marca.'
    if (!form.model.trim()) errors.model = 'Escribe el modelo.'
    if (!form.year.trim()) errors.year = 'Indica el año.'
    if (!bodyType) errors.bodyType = 'Selecciona la categoría del vehículo.'
    if (!color || color.length < 2) errors.colorChoice = 'Selecciona un color.'
    if (!location || location.length < 2) errors.locationChoice = 'Selecciona la ubicación.'
    if (!form.price || Number.parseFloat(form.price) < 0) errors.price = 'Indica un precio válido.'
    if (!form.currency) errors.currency = 'Selecciona la moneda.'
    if (!form.condition) errors.condition = 'Selecciona la condición.'
    if (!transmission) errors.transmission = 'Selecciona la transmisión.'
    if (!fuelType) errors.fuelType = 'Selecciona el combustible.'
    if (form.mileage === '' || Number.parseInt(form.mileage, 10) < 0) errors.mileage = 'Indica el kilometraje.'
  }

  if (stepId === 'features') {
    if (form.description.trim().length < 20) {
      errors.description = 'Describe el vehículo con al menos una o dos frases cortas.'
    }
    if (form.specRows.some((row) => row.key.trim() && !row.value.trim())) {
      errors.specRows = 'Completa o elimina los detalles incompletos.'
    }
    if (form.specRows.some((row) => !row.key.trim() && row.value.trim())) {
      errors.specRows = 'Cada detalle necesita un nombre y un valor.'
    }
  }

  if (stepId === 'publish') {
    if (form.status === 'published' && imageCount === 0) {
      errors.publishImages = 'Antes de publicar, agrega por lo menos una imagen.'
    }
  }

  return errors
}

// Maps backend field names → frontend form keys (for fields that differ)
const BACKEND_TO_FORM_KEY = {
  brand: 'brandChoice',
  color: 'colorChoice',
  location: 'locationChoice',
}

// Backend field → wizard step id (used to navigate when backend validation fails)
const BACKEND_FIELD_STEP = {
  title: 'details', brand: 'details', model: 'details', year: 'details',
  bodyType: 'details', color: 'details', location: 'details',
  price: 'details', currency: 'details', condition: 'details',
  mileage: 'details', transmission: 'details', fuelType: 'details', drivetrain: 'details',
  description: 'features', specs: 'features', features: 'features',
  badge: 'publish', seoTitle: 'publish', seoDescription: 'publish', status: 'publish', featured: 'publish',
}

// Human-readable names for backend fields (used in fallback messages)
const BACKEND_FIELD_LABEL = {
  title: 'el nombre', brand: 'la marca', model: 'el modelo', year: 'el año',
  bodyType: 'la categoría', color: 'el color', location: 'la ubicación',
  price: 'el precio', currency: 'la moneda', condition: 'la condición',
  mileage: 'el kilometraje', transmission: 'la transmisión',
  fuelType: 'el combustible', drivetrain: 'la tracción',
  description: 'la descripción',
  badge: 'la etiqueta', seoTitle: 'el título para Google', seoDescription: 'la descripción para Google',
}

// Specific friendly overrides for generic Zod messages per field
const BACKEND_FIELD_FRIENDLY = {
  transmission: 'Selecciona la transmisión.',
  fuelType: 'Selecciona el tipo de combustible.',
  condition: 'Selecciona la condición del vehículo.',
  currency: 'Selecciona la moneda.',
  bodyType: 'Selecciona la categoría del vehículo.',
  year: 'Indica el año del vehículo.',
  price: 'Indica un precio válido.',
  mileage: 'Indica el kilometraje.',
  brand: 'Selecciona o escribe una marca.',
  model: 'Escribe el modelo.',
  color: 'Selecciona un color.',
  location: 'Selecciona la ubicación.',
  description: 'Describe el vehículo con al menos una o dos frases cortas.',
  badge: 'La etiqueta del anuncio no es válida.',
  seoTitle: 'El título para Google no es válido.',
  seoDescription: 'La descripción para Google no es válida.',
}

function mapBackendFieldErrors(fieldErrors) {
  const errors = {}
  let firstStep = null

  for (const [backendKey, messages] of Object.entries(fieldErrors)) {
    const rawMsg = messages?.[0]
    if (!rawMsg) continue

    const formKey = BACKEND_TO_FORM_KEY[backendKey] ?? backendKey

    // If Zod gave a generic message, replace with a specific friendly one
    const isGeneric = rawMsg === 'Required'
      || rawMsg.startsWith('Invalid enum value')
      || rawMsg.startsWith('Expected')
      || rawMsg.startsWith('Invalid type')
    const label = BACKEND_FIELD_LABEL[backendKey]
    const specificFriendly = BACKEND_FIELD_FRIENDLY[backendKey]

    errors[formKey] = isGeneric
      ? (specificFriendly ?? (label ? `Indica ${label} correctamente.` : 'Este campo es obligatorio.'))
      : rawMsg

    const step = BACKEND_FIELD_STEP[backendKey]
    if (step && !firstStep) firstStep = step
  }

  return { errors, firstStep }
}

function buildPublishChecklist(form, selectedVehicle) {
  const title = form.title.trim() || buildSuggestedTitle(form)
  const brand = resolveChoiceValue(form.brandChoice, form.customBrand)
  const bodyType = resolveChoiceValue(form.bodyType, form.customBodyType)
  const color = resolveChoiceValue(form.colorChoice, form.customColor)
  const location = resolveChoiceValue(form.locationChoice, form.customLocation)
  const imageCount = Array.isArray(selectedVehicle?.images) ? selectedVehicle.images.length : 0

  return [
    { label: 'Nombre del anuncio', done: title.length >= 4 },
    { label: 'Marca y modelo', done: Boolean(brand) && Boolean(form.model.trim()) },
    { label: 'Año y categoría', done: Boolean(form.year.trim()) && Boolean(bodyType) },
    { label: 'Precio definido', done: Boolean(form.price) && Number.parseFloat(form.price) >= 0 },
    { label: 'Color y ubicación', done: Boolean(color) && Boolean(location) },
    { label: 'Descripción clara', done: form.description.trim().length >= 20 },
    { label: 'Al menos una imagen', done: imageCount > 0 },
  ]
}

function formatFriendlyError(error, fallback) {
  if (import.meta.env.DEV && error?.request) {
    console.error('[Admin Request Error]', {
      status: error.status,
      code: error.code,
      request: error.request,
    })
  }

  const fieldErrors = error?.details?.fieldErrors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstEntry = Object.values(fieldErrors).find((messages) => Array.isArray(messages) && messages.length > 0)
    if (firstEntry?.[0]) return firstEntry[0]
  }
  return error?.message ?? fallback
}

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatRelativeTime(value) {
  if (!value) return 'Ahora'
  const difference = Date.now() - new Date(value).getTime()
  const minutes = Math.round(difference / 60_000)
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `Hace ${days} d`
  return formatDate(value)
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusLabel(status) {
  switch (status) {
    case 'published': return 'Publicado'
    case 'draft': return 'Borrador'
    case 'sold': return 'Vendido'
    case 'archived': return 'Archivado'
    default: return status || 'Sin estado'
  }
}

// ─── Display components ────────────────────────────────────────────────────

function StatusChip({ status }) {
  const configs = {
    published: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-amber-50 text-amber-700',
    sold: 'bg-blue-50 text-blue-700',
    archived: 'bg-neutral-100 text-neutral-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${configs[status] ?? configs.archived}`}>
      {getStatusLabel(status)}
    </span>
  )
}

function ChoicePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3.5 py-2 text-sm transition-all duration-150',
        active
          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
          : 'border-[#E8E8E8] bg-white text-[#666] hover:border-[#C0C0C0] hover:text-[#0A0A0A]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function FieldShell({ label, hint, error, children, optional = false, suggested = false }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-body text-sm font-medium text-[#0A0A0A]">{label}</span>
        {optional && <span className="text-xs text-[#C0C0C0]">Opcional</span>}
        {suggested && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
            Sugerido
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="mt-2.5 text-[13px] text-[#AAA] leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="mt-2.5 text-[13px] text-[#d4001a] leading-relaxed">{error}</p>
      )}
    </div>
  )
}

function AdminInput({ error, className = '', ...props }) {
  return (
    <input
      {...props}
      className={[
        'w-full bg-[#F5F5F5] border rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C0C0C0] transition-all duration-200 focus:outline-none focus:bg-white',
        error
          ? 'border-[#d4001a]/30 focus:border-[#d4001a]'
          : 'border-transparent focus:border-[#E0E0E0]',
        className,
      ].join(' ')}
    />
  )
}

function AdminTextarea({ error, className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={[
        'w-full bg-[#F5F5F5] border rounded-3xl px-4 py-3.5 text-sm text-[#0A0A0A] placeholder:text-[#C0C0C0] transition-all duration-200 focus:outline-none focus:bg-white resize-none',
        error
          ? 'border-[#d4001a]/30 focus:border-[#d4001a]'
          : 'border-transparent focus:border-[#E0E0E0]',
        className,
      ].join(' ')}
    />
  )
}

function AdminSelect({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={[
          'w-full bg-[#F5F5F5] border rounded-2xl px-4 py-3.5 text-sm text-[#0A0A0A] transition-all duration-200 focus:outline-none focus:bg-white appearance-none cursor-pointer pr-10',
          error
            ? 'border-[#d4001a]/30 focus:border-[#d4001a]'
            : 'border-transparent focus:border-[#E0E0E0]',
          className,
        ].join(' ')}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <svg className="w-4 h-4 text-[#BBB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

function EnrichSpinner({ label }) {
  return (
    <div className="flex items-center gap-2.5 bg-[#F5F5F5] rounded-2xl px-4 py-3.5">
      <div className="w-4 h-4 border-2 border-[#CCC] border-t-[#888] rounded-full animate-spin flex-shrink-0" />
      <span className="text-sm text-[#AAA]">{label}</span>
    </div>
  )
}

function highlightMatch(text, query) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-[#0A0A0A]">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function SmartSelect({ options, value, onChange, placeholder, error, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const normalized = useMemo(
    () => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    [options],
  )

  const filtered = useMemo(() => {
    if (!query) return normalized
    const q = query.toLowerCase()
    return normalized.filter((o) => o.label.toLowerCase().includes(q))
  }, [normalized, query])

  const selected = normalized.find((o) => o.value === value)

  useEffect(() => { setFocused(0) }, [query, open])
  useEffect(() => { if (!open) setQuery('') }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    items[focused]?.scrollIntoView({ block: 'nearest' })
  }, [focused, open])

  const select = (optValue) => {
    onChange(optValue)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocused((i) => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocused((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[focused]) select(filtered[focused].value)
        break
      case 'Escape':
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={[
          'flex items-center gap-2 w-full bg-[#F5F5F5] border rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-text',
          open ? 'bg-white border-[#E0E0E0] shadow-[0_0_0_3px_rgba(0,0,0,0.04)]' : 'border-transparent',
          error ? '!border-[#d4001a]/40' : '',
          disabled ? 'opacity-50 pointer-events-none' : '',
        ].join(' ')}
        onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus() } }}
      >
        <input
          ref={inputRef}
          value={open ? query : (selected?.label ?? '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Seleccionar...'}
          readOnly={disabled}
          className="flex-1 bg-transparent text-sm text-[#0A0A0A] placeholder:text-[#C0C0C0] focus:outline-none min-w-0 cursor-text"
        />
        <svg
          className={[
            'w-4 h-4 text-[#BBB] flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div
        className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          transition: 'opacity 0.13s ease, transform 0.13s ease',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.99)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div ref={listRef} className="max-h-60 overflow-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#CCC]">
              {query ? `Sin resultados para "${query}"` : 'Sin opciones'}
            </p>
          ) : (
            filtered.map((opt, idx) => (
              <button
                key={opt.value}
                data-item=""
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setFocused(idx)}
                onClick={() => select(opt.value)}
                className={[
                  'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors duration-100',
                  idx === focused ? 'bg-[#F5F5F5]' : 'bg-white',
                ].join(' ')}
              >
                <span className={['flex-1 truncate', opt.value === value ? 'font-medium text-[#0A0A0A]' : 'text-[#444]'].join(' ')}>
                  {highlightMatch(opt.label, query)}
                </span>
                {opt.value === value && (
                  <svg className="w-3.5 h-3.5 text-[#0A0A0A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function WizardStepIndicator({ steps, currentIndex, onStepClick, form, selectedVehicle }) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const stepErrors = getFieldErrorsForStep(step.id, form, selectedVehicle)
        const isCompleted = index < currentIndex && Object.keys(stepErrors).length === 0
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-start">
            <button
              type="button"
              onClick={() => onStepClick(index)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
                isCurrent
                  ? 'bg-[#0A0A0A] text-white shadow-sm'
                  : isCompleted
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-[#F0F0F0] text-[#BBB] group-hover:bg-[#E8E8E8]',
              ].join(' ')}>
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={[
                'text-[10px] hidden lg:block whitespace-nowrap transition-colors',
                isCurrent ? 'text-[#0A0A0A] font-medium' : 'text-[#CCC]',
              ].join(' ')}>
                {step.title}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className={[
                'w-8 xl:w-14 h-px mt-3.5 mx-2 transition-colors duration-300',
                isCompleted ? 'bg-[#0A0A0A]' : 'bg-[#E8E8E8]',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ImageDropZone({ onUpload, uploading, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const processFiles = (files) => {
    const valid = files.filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    if (valid.length > 0) onUpload(valid)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !uploading) setIsDragging(true) }}
      onDragEnter={(e) => { e.preventDefault(); if (!disabled && !uploading) setIsDragging(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled && !uploading) processFiles(Array.from(e.dataTransfer.files))
      }}
      onClick={() => { if (!disabled && !uploading) inputRef.current?.click() }}
      className={[
        'rounded-3xl border-2 border-dashed p-14 text-center transition-all duration-200 cursor-pointer',
        isDragging
          ? 'border-[#0A0A0A] bg-[#F5F5F5] scale-[1.005]'
          : disabled
            ? 'border-[#F0F0F0] bg-[#FAFAFA] cursor-not-allowed opacity-50'
            : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#C0C0C0] hover:bg-white',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { processFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
        disabled={disabled || uploading}
      />
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#E8E8E8] mx-auto flex items-center justify-center">
          <svg className="w-5 h-5 text-[#AAA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="font-body text-sm font-medium text-[#0A0A0A]">
            {uploading ? 'Subiendo imágenes...' : isDragging ? 'Suelta aquí' : 'Arrastra las fotos aquí'}
          </p>
          <p className="font-body text-sm text-[#BBB] mt-1">
            o haz clic para seleccionar · JPG, PNG o WebP
          </p>
        </div>
      </div>
    </div>
  )
}

function VehicleGridCard({
  vehicle,
  canManage,
  canDelete,
  onEdit,
  onPublishToggle,
  onMarkSold,
  onFeatureToggle,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden group transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
      <div className="aspect-video bg-[#F5F5F5] relative overflow-hidden">
        {vehicle.mainImage ? (
          <img
            src={vehicle.mainImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-[#DDD]">Sin imagen</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={[
            'text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm',
            vehicle.status === 'published' ? 'bg-white/90 text-emerald-700' :
            vehicle.status === 'sold' ? 'bg-white/90 text-blue-700' :
            vehicle.status === 'archived' ? 'bg-white/90 text-neutral-500' :
            'bg-white/90 text-amber-700',
          ].join(' ')}>
            {getStatusLabel(vehicle.status)}
          </span>
          {vehicle.featured && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#d4001a]/85 text-white backdrop-blur-sm">
              Destacado
            </span>
          )}
        </div>
        {Array.isArray(vehicle.images) && vehicle.images.length > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="text-[11px] text-white/80 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {vehicle.images.length} fotos
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-heading text-[17px] tracking-tight text-[#0A0A0A] leading-snug line-clamp-1">
          {vehicle.title}
        </h3>
        <p className="font-heading text-2xl tracking-tight text-[#0A0A0A] mt-1.5">
          {formatCurrency(vehicle.price, vehicle.currency)}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[11px] bg-[#F5F5F5] text-[#999] px-2.5 py-1 rounded-full">
            {vehicle.mileage === 0 ? '0 km' : `${Number(vehicle.mileage).toLocaleString()} km`}
          </span>
          {vehicle.fuelType && (
            <span className="text-[11px] bg-[#F5F5F5] text-[#999] px-2.5 py-1 rounded-full">
              {vehicle.fuelType}
            </span>
          )}
          {vehicle.transmission && (
            <span className="text-[11px] bg-[#F5F5F5] text-[#999] px-2.5 py-1 rounded-full">
              {vehicle.transmission}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 bg-[#F0F0F0] hover:bg-[#E8E8E8] text-[#0A0A0A] font-body text-sm py-2.5 rounded-full transition-colors font-medium"
          >
            Editar
          </button>
          {canManage && (
            <button
              type="button"
              onClick={onPublishToggle}
              className="flex-1 border border-[#E8E8E8] hover:border-[#C0C0C0] text-[#666] font-body text-sm py-2.5 rounded-full transition-colors"
            >
              {vehicle.status === 'published' ? 'Borrador' : 'Publicar'}
            </button>
          )}
        </div>

        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-[#CCC]">
            <button type="button" onClick={onFeatureToggle} className="hover:text-[#666] transition-colors">
              {vehicle.featured ? 'Quitar destacado' : 'Destacar'}
            </button>
            <span>·</span>
            <button type="button" onClick={onMarkSold} className="hover:text-[#666] transition-colors">
              Vendido
            </button>
            {canDelete && (
              <>
                <span>·</span>
                <button type="button" onClick={onDelete} className="hover:text-red-500 transition-colors">
                  Eliminar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const [token, setToken] = useState(() => getStoredAdminToken())
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(getStoredAdminToken()) && !getStoredAdminUser())
  const [sessionRefreshing, setSessionRefreshing] = useState(() => Boolean(getStoredAdminToken()))
  const [session, setSession] = useState(() => {
    const cachedUser = getStoredAdminUser()
    return cachedUser ? { user: cachedUser, session: null } : null
  })
  const [sessionError, setSessionError] = useState('')

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [vehiclesError, setVehiclesError] = useState('')

  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [query, setQuery] = useState('')
  const [viewFilter, setViewFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  const makesFetchedRef = useRef(false)
  const pendingUploadsRef = useRef([])
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStepIndex, setWizardStepIndex] = useState(0)
  const [editorMode, setEditorMode] = useState('create')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [form, setForm] = useState(createInitialForm())
  const [formErrors, setFormErrors] = useState({})
  const [autoTitleEnabled, setAutoTitleEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingUploads, setPendingUploads] = useState([])
  const [imageActionKey, setImageActionKey] = useState('')

  const [enrichment, setEnrichment] = useState({
    makes: [],
    loadingMakes: false,
    models: [],
    years: [],
    loadingModels: false,
    loadingYears: false,
    enriching: false,
  })
  const [suggestedFields, setSuggestedFields] = useState(new Set())
  const [customModelMode, setCustomModelMode] = useState(false)
  const [customYearMode, setCustomYearMode] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/admin-login', { replace: true })
      return
    }

    let ignore = false

    async function loadSession() {
      try {
        setSessionRefreshing(true)
        if (!session?.user) {
          setSessionLoading(true)
        }
        setSessionError('')
        const response = await getAdminMe(token)
        if (!ignore) {
          setSession(response)
          setStoredAdminUser(response.user)
        }
      } catch (loadError) {
        if (!ignore) {
          clearStoredAdminToken()
          setToken('')
          setSession(null)
          setSessionError(formatFriendlyError(loadError, 'Tu sesión expiró.'))
          navigate('/admin-login', { replace: true })
        }
      } finally {
        if (!ignore) {
          setSessionLoading(false)
          setSessionRefreshing(false)
        }
      }
    }

    loadSession()
    return () => { ignore = true }
  }, [navigate, token])

  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (!token) return

      const message = 'Tu sesión expiró o dejó de ser válida. Vuelve a iniciar sesión para continuar.'
      const requestInfo = event?.detail?.request

      if (import.meta.env.DEV && requestInfo) {
        console.error('[Admin Auth] 401 recibido', requestInfo)
      }

      clearStoredAdminToken()
      setSession(null)
      setSessionError(message)
      setActionError(message)
      setToken('')
      navigate('/admin-login', { replace: true })
    }

    window.addEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized)
  }, [navigate, token])

  useEffect(() => {
    document.body.style.overflow = wizardOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [wizardOpen])

  useEffect(() => {
    pendingUploadsRef.current = pendingUploads
  }, [pendingUploads])

  useEffect(() => {
    return () => {
      releasePendingUploads(pendingUploadsRef.current)
    }
  }, [])

  useEffect(() => {
    if (!wizardOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') closeWizard() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [wizardOpen])

  // Load vehicle makes once per page session. makesFetchedRef prevents the effect
  // from re-running when loadingMakes state changes (which caused stale=true before
  // the fetch resolved, leaving the spinner stuck forever).
  useEffect(() => {
    if (!wizardOpen || makesFetchedRef.current) return
    makesFetchedRef.current = true
    setEnrichment((e) => ({ ...e, loadingMakes: true }))
    fetchVehicleMakes()
      .then((data) => {
        const makes = (data.makes ?? []).filter((m) => m.name)
        setEnrichment((e) => ({ ...e, makes }))
      })
      .catch(() => {
        // fallback brands applied via BRAND_OPTIONS in the SmartSelect below
      })
      .finally(() => {
        setEnrichment((e) => ({ ...e, loadingMakes: false }))
      })
  }, [wizardOpen])

  const userRole = session?.user?.role ?? 'viewer'
  const canManageVehicles = roleCanManageVehicles(userRole)
  const canDeleteVehicles = roleCanDeleteVehicles(userRole)
  const currentStep = WIZARD_STEPS[wizardStepIndex]
  const suggestedTitle = useMemo(() => buildSuggestedTitle(form), [form])

  useEffect(() => {
    if (!autoTitleEnabled) return
    setForm((current) => {
      if (current.title === suggestedTitle) return current
      return { ...current, title: suggestedTitle }
    })
  }, [autoTitleEnabled, suggestedTitle])

  useEffect(() => {
    setActionError('')
  }, [wizardStepIndex])

  const loadStats = async ({ throwOnError = false } = {}) => {
    if (!token) {
      if (throwOnError) {
        throw new ApiError('No hay sesión activa.', {
          status: 401,
          code: 'UNAUTHORIZED',
          request: {
            method: 'GET',
            path: '/admin/dashboard/stats',
            hasAuthorization: false,
          },
        })
      }
      return null
    }
    try {
      setStatsLoading(true)
      const response = await getAdminDashboardStats(token)
      setStats(response)
      return response
    } catch (loadError) {
      setActionError(formatFriendlyError(loadError, 'No se pudieron cargar las métricas.'))
      if (throwOnError) throw loadError
      return null
    } finally {
      setStatsLoading(false)
    }
  }

  const loadVehicles = async ({ throwOnError = false } = {}) => {
    if (!token) {
      if (throwOnError) {
        throw new ApiError('No hay sesión activa.', {
          status: 401,
          code: 'UNAUTHORIZED',
          request: {
            method: 'GET',
            path: '/admin/vehicles',
            hasAuthorization: false,
          },
        })
      }
      return null
    }
    try {
      setVehiclesLoading(true)
      setVehiclesError('')

      const params = {
        limit: 60,
        sort: 'recent',
        q: query || undefined,
      }

      if (viewFilter === 'published') params.status = ['published']
      if (viewFilter === 'draft') params.status = ['draft']
      if (viewFilter === 'sold') params.status = ['sold']
      if (viewFilter === 'featured') params.featured = true

      const response = await listAdminVehicles(token, params)
      setVehicles(response.data ?? [])
      return response
    } catch (loadError) {
      setVehicles([])
      setVehiclesError(formatFriendlyError(loadError, 'No se pudo cargar el inventario.'))
      if (throwOnError) throw loadError
      return null
    } finally {
      setVehiclesLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user || sessionRefreshing) return
    void loadStats()
  }, [session?.user, sessionRefreshing])

  useEffect(() => {
    if (!session?.user || sessionRefreshing) return
    void loadVehicles()
  }, [query, session?.user, sessionRefreshing, viewFilter])

  const refreshAll = async ({ throwOnError = false } = {}) => {
    await Promise.all([
      loadVehicles({ throwOnError }),
      loadStats({ throwOnError }),
    ])
  }

  const resolvedBrand = useMemo(
    () => resolveChoiceValue(form.brandChoice, form.customBrand),
    [form.brandChoice, form.customBrand],
  )

  useEffect(() => {
    if (!wizardOpen || !resolvedBrand || resolvedBrand.length < 2 || form.brandChoice === OTHER_OPTION) {
      setEnrichment((e) => ({ ...e, models: [], years: [], loadingModels: false }))
      return
    }
    let stale = false
    setEnrichment((e) => ({ ...e, loadingModels: true, models: [], years: [] }))
    fetchVehicleModels(resolvedBrand)
      .then((data) => {
        if (!stale) setEnrichment((e) => ({ ...e, models: data.models ?? [], loadingModels: false }))
      })
      .catch(() => {
        if (!stale) setEnrichment((e) => ({ ...e, models: [], loadingModels: false }))
      })
    return () => { stale = true }
  }, [resolvedBrand, form.brandChoice, wizardOpen])

  const checklist = useMemo(() => buildPublishChecklist(form, selectedVehicle), [form, selectedVehicle])
  const completedChecklistCount = checklist.filter((item) => item.done).length
  const progressPercent = Math.round((completedChecklistCount / checklist.length) * 100)
  const missingChecklistItems = checklist.filter((item) => !item.done).map((item) => item.label)
  const imageStepIndex = WIZARD_STEPS.findIndex((step) => step.id === 'images')
  const shouldWarnAboutImages = wizardStepIndex >= imageStepIndex
  const visibleChecklist = useMemo(
    () => checklist.filter((item) => shouldWarnAboutImages || item.label !== 'Al menos una imagen'),
    [checklist, shouldWarnAboutImages],
  )
  const visibleMissingChecklistItems = useMemo(
    () => missingChecklistItems.filter((item) => shouldWarnAboutImages || item !== 'Al menos una imagen'),
    [missingChecklistItems, shouldWarnAboutImages],
  )
  const previewFeatures = useMemo(
    () => [...new Set([...form.selectedFeatures, ...parseCommaList(form.customFeaturesText)])],
    [form.customFeaturesText, form.selectedFeatures],
  )
  const previewSpecs = useMemo(() => buildSpecsObject(form.specRows), [form.specRows])
  const publishReady = missingChecklistItems.length === 0
  const recentVehicles = stats?.recentVehicles ?? []

  const summaryLine = useMemo(() => {
    if (statsLoading) return 'Cargando...'
    const published = stats?.counts?.publishedVehicles ?? 0
    const drafts = stats?.counts?.draftVehicles ?? 0
    const sold = stats?.counts?.soldVehicles ?? 0
    return `${published} publicados · ${drafts} borradores · ${sold} vendidos`
  }, [stats, statsLoading])

  const applyVehicleSnapshot = (vehicle, { syncForm = false } = {}) => {
    const normalizedVehicle = normalizeVehicleSnapshot(vehicle)

    setSelectedVehicle(normalizedVehicle)
    setVehicles((current) => {
      const exists = current.some((item) => item.id === normalizedVehicle.id)
      if (!exists) return [normalizedVehicle, ...current]
      return current.map((item) => (item.id === normalizedVehicle.id ? normalizedVehicle : item))
    })

    if (syncForm) {
      setForm(toFormState(normalizedVehicle))
    }
  }

  const ensureSilentDraft = async () => {
    if (selectedVehicle?.id) return selectedVehicle

    const requiredSteps = ['details', 'features']
    for (const stepId of requiredSteps) {
      const stepErrors = getFieldErrorsForStep(stepId, form, selectedVehicle)
      if (Object.keys(stepErrors).length > 0) {
        setFormErrors(stepErrors)
        setWizardStepIndex(WIZARD_STEPS.findIndex((step) => step.id === stepId))
        return null
      }
    }

    return persistVehicle({
      statusOverride: 'draft',
      silent: true,
    })
  }

  const syncAfterMutation = async ({ vehicle = null, syncForm = false, successMessage = '' } = {}) => {
    if (vehicle) {
      applyVehicleSnapshot(vehicle, { syncForm })
    }

    await refreshAll({ throwOnError: true })

    if (successMessage) {
      setFeedback(successMessage)
    }
  }

  const openCreateWizard = () => {
    releasePendingUploads(pendingUploadsRef.current)
    setEditorMode('create')
    setSelectedVehicle(null)
    setForm(createInitialForm())
    setFormErrors({})
    setAutoTitleEnabled(true)
    setWizardStepIndex(0)
    setWizardOpen(true)
    setFeedback('')
    setActionError('')
    setEnrichment((prev) => ({ ...prev, models: [], years: [], loadingModels: false, loadingYears: false, enriching: false }))
    setSuggestedFields(new Set())
    setCustomModelMode(false)
    setCustomYearMode(false)
    setPendingUploads([])
    setUploadProgress(0)
    setImageActionKey('')
  }

  const openEditWizard = async (vehicle) => {
    try {
      setActionError('')
      const response = await getAdminVehicle(token, vehicle.id)
      setEditorMode('edit')
      const normalizedVehicle = normalizeVehicleSnapshot(response.vehicle)
      setSelectedVehicle(normalizedVehicle)
      setForm(toFormState(normalizedVehicle))
      setAutoTitleEnabled(false)
      setFormErrors({})
      setWizardStepIndex(0)
      setWizardOpen(true)
      setPendingUploads([])
      setUploadProgress(0)
      setImageActionKey('')
    } catch (loadError) {
      setActionError(formatFriendlyError(loadError, 'No se pudo abrir el vehículo.'))
    }
  }

  const closeWizard = () => {
    releasePendingUploads(pendingUploadsRef.current)
    pendingUploadsRef.current = []
    setWizardOpen(false)
    setFormErrors({})
    setActionError('')
    setPendingUploads([])
    setUploadProgress(0)
    setImageActionKey('')
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setActionError('')
    if (suggestedFields.has(field)) {
      setSuggestedFields((prev) => {
        const s = new Set(prev)
        s.delete(field)
        return s
      })
    }
  }

  const validateCurrentStep = (stepId = currentStep.id) => {
    const nextErrors = getFieldErrorsForStep(stepId, form, selectedVehicle)
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const persistVehicle = async ({ statusOverride = null, successMessage = '', silent = false }) => {
    try {
      setSaving(true)
      setActionError('')
      if (!silent) {
        setFeedback('')
      }

      const payload = buildVehiclePayload(form, statusOverride)

      if (import.meta.env.DEV) {
        console.groupCollapsed('[Admin Wizard] payload before save')
        console.log('step →', currentStep.id)
        console.log('form state →', form)
        console.log('payload →', payload)
        console.groupEnd()
      }

      const response = editorMode === 'edit' && selectedVehicle
        ? await updateAdminVehicle(token, selectedVehicle.id, payload)
        : await createAdminVehicle(token, payload)

      setEditorMode('edit')
      await syncAfterMutation({
        vehicle: response.vehicle,
        syncForm: true,
        successMessage: !silent ? successMessage : '',
      })
      return response.vehicle
    } catch (saveError) {
      if (import.meta.env.DEV) {
        console.groupCollapsed('[Admin Wizard] validation/save error')
        console.error('error →', saveError)
        console.error('fieldErrors →', saveError?.details?.fieldErrors)
        console.groupEnd()
      }

      // When backend returns field-level errors, map them to the form and navigate to the right step
      const fieldErrors = saveError?.details?.fieldErrors
      if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
        const { errors, firstStep } = mapBackendFieldErrors(fieldErrors)
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors)
          let movedToDifferentStep = false
          if (firstStep) {
            const stepIdx = WIZARD_STEPS.findIndex((s) => s.id === firstStep)
            if (stepIdx >= 0) {
              movedToDifferentStep = stepIdx !== wizardStepIndex
              setWizardStepIndex(stepIdx)
            }
          }
          setActionError(movedToDifferentStep ? '' : 'Revisa los campos marcados en rojo antes de continuar.')
          return null
        }
      }

      setActionError(formatFriendlyError(saveError, 'No se pudo guardar el vehículo.'))
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = async () => {
    setActionError('')
    const isValid = validateCurrentStep()
    if (!isValid) return

    if (currentStep.id === 'features') {
      const savedVehicle = await ensureSilentDraft()
      if (!savedVehicle) return
    }

    setWizardStepIndex((current) => Math.min(current + 1, WIZARD_STEPS.length - 1))
  }

  const handleBack = () => {
    setActionError('')
    setWizardStepIndex((current) => Math.max(current - 1, 0))
  }

  const handleSaveDraft = async () => {
    const stepToValidate = ['preview', 'publish'].includes(currentStep.id) ? 'features' : currentStep.id
    const isValid = validateCurrentStep(stepToValidate)
    if (!isValid) return
    await persistVehicle({
      statusOverride: 'draft',
      successMessage: editorMode === 'edit' ? 'Cambios guardados.' : 'Borrador guardado correctamente.',
    })
  }

  const handlePublishNow = async () => {
    const requiredSteps = ['details', 'features']
    for (const stepId of requiredSteps) {
      const stepErrors = getFieldErrorsForStep(stepId, form, selectedVehicle)
      if (Object.keys(stepErrors).length > 0) {
        setFormErrors(stepErrors)
        setWizardStepIndex(WIZARD_STEPS.findIndex((step) => step.id === stepId))
        return
      }
    }

    if (!publishReady) {
      setActionError('Antes de publicar, completa lo que todavía falta en el resumen.')
      if (!selectedVehicle?.images?.length) {
        setWizardStepIndex(WIZARD_STEPS.findIndex((step) => step.id === 'images'))
      } else {
        setWizardStepIndex(WIZARD_STEPS.findIndex((step) => step.id === 'preview'))
      }
      return
    }

    await persistVehicle({
      statusOverride: 'published',
      successMessage: 'Vehículo publicado correctamente.',
    })
  }

  const handleVehicleAction = async (action, successMessage, fallbackMessage) => {
    try {
      setActionError('')
      setFeedback('')
      const response = await action()
      await refreshAll({ throwOnError: true })
      if (selectedVehicle?.id) {
        const refreshed = await getAdminVehicle(token, selectedVehicle.id).catch(() => null)
        if (refreshed?.vehicle) {
          applyVehicleSnapshot(refreshed.vehicle, { syncForm: true })
        }
      }
      if (response?.vehicle) {
        applyVehicleSnapshot(response.vehicle)
      }
      if (successMessage) setFeedback(successMessage)
    } catch (actionFailure) {
      setActionError(formatFriendlyError(actionFailure, fallbackMessage))
    }
  }

  const uploadFiles = async (files) => {
    if (!files.length) return
    const queueEntries = files.map(createPendingUpload)
    const queueEntryIds = new Set(queueEntries.map((item) => item.id))

    try {
      setUploading(true)
      setUploadProgress(0)
      setPendingUploads(queueEntries)
      setActionError('')

      const draftVehicle = await ensureSilentDraft()
      if (!draftVehicle?.id) return

      const response = await uploadAdminVehicleImages(token, draftVehicle.id, files, {
        onProgress: (progress) => setUploadProgress(progress),
      })

      await syncAfterMutation({
        vehicle: response.vehicle,
        syncForm: true,
        successMessage: files.length > 1
          ? `${files.length} imágenes cargadas correctamente.`
          : 'Imagen cargada correctamente.',
      })
    } catch (uploadError) {
      setActionError(formatFriendlyError(uploadError, 'No se pudieron cargar las imágenes.'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
      releasePendingUploads(queueEntries)
      setPendingUploads((current) => current.filter((item) => !queueEntryIds.has(item.id)))
    }
  }

  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await uploadFiles(files)
  }

  const applyEnrichmentSuggestions = (suggestions) => {
    const { bodyType, fuelType, transmission, drivetrain, cylinders, doors } = suggestions
    const newSuggested = new Set()
    setForm((prev) => {
      const next = { ...prev }
      if (bodyType && BODY_TYPE_OPTIONS.includes(bodyType)) {
        next.bodyType = bodyType
        next.customBodyType = ''
        newSuggested.add('bodyType')
      }
      if (fuelType && FUEL_OPTIONS.includes(fuelType)) {
        next.fuelType = fuelType
        next.customFuelType = ''
        newSuggested.add('fuelType')
      }
      if (transmission && TRANSMISSION_OPTIONS.includes(transmission)) {
        next.transmission = transmission
        next.customTransmission = ''
        newSuggested.add('transmission')
      }
      if (drivetrain && DRIVETRAIN_OPTIONS.includes(drivetrain)) {
        next.drivetrain = drivetrain
        next.customDrivetrain = ''
        newSuggested.add('drivetrain')
      }

      // Auto-populate spec rows with cylinders/doors from CarQuery
      const enrichedSpecs = []
      if (Number.isInteger(cylinders) && cylinders > 0) {
        enrichedSpecs.push(createSpecRow('Cilindros', String(cylinders)))
      }
      if (Number.isInteger(doors) && doors > 0) {
        enrichedSpecs.push(createSpecRow('Puertas', String(doors)))
      }
      if (enrichedSpecs.length > 0) {
        const existingKeys = new Set(
          next.specRows.filter((r) => r.key.trim()).map((r) => r.key.toLowerCase()),
        )
        const toAdd = enrichedSpecs.filter((r) => !existingKeys.has(r.key.toLowerCase()))
        if (toAdd.length > 0) {
          const nonEmpty = next.specRows.filter((r) => r.key.trim() || r.value.trim())
          next.specRows = nonEmpty.length > 0
            ? [...toAdd, ...nonEmpty]
            : [...toAdd, createSpecRow()]
        }
      }

      // Auto-suggest features based on year/brand/bodyType — only if user hasn't selected any yet
      if (next.selectedFeatures.length === 0) {
        const resolvedBodyType = bodyType || resolveChoiceValue(next.bodyType, next.customBodyType)
        const resolvedBrand = resolveChoiceValue(next.brandChoice, next.customBrand)
        const suggested = suggestFeaturesForVehicle(resolvedBrand, next.year, resolvedBodyType)
        if (suggested.length > 0) {
          next.selectedFeatures = suggested
          newSuggested.add('selectedFeatures')
        }
      }

      return next
    })
    setSuggestedFields(newSuggested)
  }

  const handleModelSelect = (value) => {
    if (value === '__custom__') {
      setCustomModelMode(true)
      updateField('model', '')
      setEnrichment((e) => ({ ...e, years: [] }))
      return
    }
    setCustomModelMode(false)
    updateField('model', value)
    setSuggestedFields(new Set())
    if (!resolvedBrand || !value) return
    setEnrichment((e) => ({ ...e, loadingYears: true, years: [] }))
    fetchVehicleYears(resolvedBrand, value)
      .then((data) => setEnrichment((e) => ({ ...e, years: data.years ?? [], loadingYears: false })))
      .catch(() => setEnrichment((e) => ({ ...e, years: [], loadingYears: false })))
  }

  const handleYearSelect = (value) => {
    if (value === '__custom__') {
      setCustomYearMode(true)
      updateField('year', '')
      return
    }
    setCustomYearMode(false)
    updateField('year', value)
    if (!resolvedBrand || !form.model || !value) return
    setEnrichment((e) => ({ ...e, enriching: true }))
    fetchVehicleEnrichment(resolvedBrand, form.model, Number(value))
      .then((data) => {
        setEnrichment((e) => ({ ...e, enriching: false }))
        if (data.suggestions) applyEnrichmentSuggestions(data.suggestions)
      })
      .catch(() => setEnrichment((e) => ({ ...e, enriching: false })))
  }

  const handleDeleteImage = async (imageId) => {
    if (!selectedVehicle?.id) return
    try {
      setImageActionKey(`delete:${imageId}`)
      setActionError('')
      const response = await deleteAdminVehicleImage(token, selectedVehicle.id, imageId)
      await syncAfterMutation({
        vehicle: response.vehicle,
        syncForm: true,
        successMessage: 'Imagen eliminada correctamente.',
      })
    } catch (deleteError) {
      setActionError(formatFriendlyError(deleteError, 'No se pudo eliminar la imagen.'))
    } finally {
      setImageActionKey('')
    }
  }

  const handleSetMainImage = async (imageId) => {
    if (!selectedVehicle?.id) return
    try {
      setImageActionKey(`main:${imageId}`)
      setActionError('')
      const response = await updateAdminVehicleImagePresentation(token, selectedVehicle.id, {
        mainImageId: imageId,
      })
      await syncAfterMutation({
        vehicle: response.vehicle,
        syncForm: true,
        successMessage: 'Portada actualizada correctamente.',
      })
    } catch (updateError) {
      setActionError(formatFriendlyError(updateError, 'No se pudo actualizar la portada.'))
    } finally {
      setImageActionKey('')
    }
  }

  const handleMoveImage = async (imageId, direction) => {
    if (!selectedVehicle?.id || !Array.isArray(selectedVehicle.images) || selectedVehicle.images.length < 2) return

    const orderedImages = [...selectedVehicle.images].sort((left, right) => left.order - right.order)
    const currentIndex = orderedImages.findIndex((image) => image.id === imageId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'left'
      ? Math.max(0, currentIndex - 1)
      : Math.min(orderedImages.length - 1, currentIndex + 1)

    if (targetIndex === currentIndex) return

    const reordered = [...orderedImages]
    const [movedImage] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, movedImage)

    try {
      setImageActionKey(`order:${imageId}`)
      setActionError('')
      const response = await updateAdminVehicleImagePresentation(token, selectedVehicle.id, {
        imageOrder: reordered.map((image) => image.id),
        mainImageId: orderedImages.find((image) => image.isMain)?.id,
      })
      await syncAfterMutation({
        vehicle: response.vehicle,
        syncForm: true,
        successMessage: 'Orden de imágenes actualizado.',
      })
    } catch (updateError) {
      setActionError(formatFriendlyError(updateError, 'No se pudo reordenar la galería.'))
    } finally {
      setImageActionKey('')
    }
  }

  const handleLogout = async () => {
    try {
      if (token) await logoutAdmin(token)
    } catch {
      // noop
    } finally {
      clearStoredAdminToken()
      setToken('')
      navigate('/admin-login', { replace: true })
    }
  }

  const updateSpecRow = (id, field, value) => {
    setForm((current) => ({
      ...current,
      specRows: current.specRows.map((row) => (
        row.id === id ? { ...row, [field]: value } : row
      )),
    }))
    setFormErrors((current) => {
      if (!current.specRows) return current
      const next = { ...current }
      delete next.specRows
      return next
    })
  }

  const addSpecRow = () => {
    setForm((current) => ({
      ...current,
      specRows: [...current.specRows, createSpecRow()],
    }))
  }

  const removeSpecRow = (id) => {
    setForm((current) => ({
      ...current,
      specRows: current.specRows.length > 1
        ? current.specRows.filter((row) => row.id !== id)
        : [createSpecRow()],
    }))
  }

  const toggleFeature = (feature) => {
    setForm((current) => ({
      ...current,
      selectedFeatures: current.selectedFeatures.includes(feature)
        ? current.selectedFeatures.filter((item) => item !== feature)
        : [...current.selectedFeatures, feature],
    }))
  }

  const handleStepNavigation = async (nextIndex) => {
    if (nextIndex === wizardStepIndex) return

    if (nextIndex < wizardStepIndex) {
      setActionError('')
      setWizardStepIndex(nextIndex)
      return
    }

    for (let index = wizardStepIndex; index < nextIndex; index += 1) {
      const stepId = WIZARD_STEPS[index].id
      const stepErrors = getFieldErrorsForStep(stepId, form, selectedVehicle)

      if (Object.keys(stepErrors).length > 0) {
        setFormErrors(stepErrors)
        setWizardStepIndex(index)
        return
      }

      if (stepId === 'features') {
        const savedVehicle = await ensureSilentDraft()
        if (!savedVehicle) return
      }
    }

    setWizardStepIndex(nextIndex)
  }

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (sessionLoading && !session?.user) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="h-16 bg-white border-b border-[#F0F0F0]" />
        <div className="mx-auto max-w-7xl px-6 pt-14 space-y-10">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-full bg-white animate-pulse" />
            <div className="h-12 w-72 rounded-2xl bg-white animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-3xl bg-white animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!token || !session?.user) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <StatePanel
            title="Sesión requerida"
            message={sessionError || 'Debes iniciar sesión para entrar al panel administrativo.'}
            actionLabel="Ir al login"
            onAction={() => navigate('/admin-login', { replace: true })}
          />
        </div>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F8F8]">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#F0F0F0]">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="font-heading text-base tracking-tight text-[#0A0A0A]">Benzan</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'overview', label: 'Inicio' },
                { id: 'inventory', label: 'Inventario' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'px-4 py-2 rounded-full font-body text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#F0F0F0] text-[#0A0A0A] font-medium'
                      : 'text-[#999] hover:text-[#0A0A0A]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {canManageVehicles && (
              <button
                type="button"
                onClick={openCreateWizard}
                className="bg-[#0A0A0A] hover:bg-[#222] text-white font-body text-sm px-5 py-2.5 rounded-full transition-colors font-medium"
              >
                Nuevo vehículo
              </button>
            )}
            <span className="font-body text-sm text-[#999] hidden sm:block">
              {session.user.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="font-body text-sm text-[#CCC] hover:text-[#666] transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {sessionRefreshing && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div className="rounded-2xl bg-white border border-[#F0F0F0] px-4 py-3 font-body text-sm text-[#888] flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#DDD] border-t-[#777] rounded-full animate-spin flex-shrink-0" />
            Verificando acceso y sincronizando tu sesión...
          </div>
        </div>
      )}

      {/* ── Toast area ── */}
      {(actionError || feedback) && !wizardOpen && (
        <div className="mx-auto max-w-7xl px-6 pt-5 space-y-2">
          {actionError && (
            <div className="rounded-2xl bg-[#FFF2F3] border border-[#ffd6da] px-5 py-3.5 font-body text-sm text-[#b31a2b]">
              {actionError}
            </div>
          )}
          {feedback && !actionError && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3.5 font-body text-sm text-emerald-700">
              {feedback}
            </div>
          )}
        </div>
      )}

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="mx-auto max-w-7xl px-6 py-14 space-y-14">

          {/* Hero */}
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#CCC] mb-4">
              Panel · {session.user.role}
            </p>
            <h1 className="font-heading text-[clamp(32px,4vw,52px)] tracking-tight text-[#0A0A0A] leading-[0.93] max-w-xl">
              Hola, {session.user.name.split(' ')[0]}.
            </h1>
            <p className="font-body text-base text-[#AAA] mt-5">{summaryLine}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Publicados', value: statsLoading ? '—' : stats?.counts?.publishedVehicles ?? 0, note: 'Visibles en el sitio' },
              { label: 'Vendidos', value: statsLoading ? '—' : stats?.counts?.soldVehicles ?? 0, note: 'Unidades cerradas' },
              { label: 'Destacados', value: statsLoading ? '—' : stats?.counts?.featuredVehicles ?? 0, note: 'Con prioridad visual' },
              { label: 'Borradores', value: statsLoading ? '—' : stats?.counts?.draftVehicles ?? 0, note: 'Pendientes de revisar' },
            ].map((metric) => (
              <div key={metric.label} className="bg-white rounded-3xl p-7">
                <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#CCC] mb-5">
                  {metric.label}
                </p>
                <p className="font-heading text-5xl tracking-tight text-[#0A0A0A] leading-none">
                  {metric.value}
                </p>
                <p className="font-body text-sm text-[#BBB] mt-4">{metric.note}</p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-7">
              <h2 className="font-heading text-2xl tracking-tight text-[#0A0A0A]">
                Actividad reciente
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="font-body text-sm text-[#AAA] hover:text-[#0A0A0A] transition-colors"
              >
                Ver todo el inventario
              </button>
            </div>

            {recentVehicles.length > 0 ? (
              <div className="bg-white rounded-3xl overflow-hidden">
                {recentVehicles.map((vehicle, index) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => openEditWizard(vehicle)}
                    className={[
                      'w-full flex items-center gap-5 px-6 py-4 text-left hover:bg-[#FAFAFA] transition-colors',
                      index < recentVehicles.length - 1 ? 'border-b border-[#F5F5F5]' : '',
                    ].join(' ')}
                  >
                    <div className="w-14 h-10 rounded-xl overflow-hidden bg-[#F5F5F5] flex-shrink-0">
                      {vehicle.mainImage && (
                        <img src={vehicle.mainImage} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-medium text-[#0A0A0A] truncate">
                        {vehicle.title}
                      </p>
                      <p className="font-body text-xs text-[#AAA] mt-0.5">
                        {formatCurrency(vehicle.price, vehicle.currency)}
                      </p>
                    </div>
                    <StatusChip status={vehicle.status} />
                    <span className="font-body text-xs text-[#CCC] flex-shrink-0 hidden sm:block">
                      {formatRelativeTime(vehicle.updatedAt || vehicle.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center">
                <p className="font-heading text-xl tracking-tight text-[#0A0A0A] mb-3">
                  Sin actividad reciente
                </p>
                <p className="font-body text-sm text-[#AAA] mb-7">
                  Publica tu primer vehículo para empezar.
                </p>
                {canManageVehicles && (
                  <button
                    type="button"
                    onClick={openCreateWizard}
                    className="bg-[#0A0A0A] hover:bg-[#222] text-white font-body text-sm px-6 py-3 rounded-full transition-colors"
                  >
                    Publicar vehículo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Inventory tab ── */}
      {activeTab === 'inventory' && (
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <h2 className="font-heading text-3xl tracking-tight text-[#0A0A0A]">Inventario</h2>
            <AdminInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar vehículo..."
              className="sm:w-64"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            {VIEW_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setViewFilter(filter.id)}
                className={[
                  'rounded-full font-body px-4 py-2 text-sm transition-colors',
                  viewFilter === filter.id
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-white text-[#666] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {!canManageVehicles && (
            <div className="bg-white rounded-2xl px-5 py-4 mb-8">
              <p className="font-body text-sm text-[#999]">
                Tu rol actual permite revisar información, pero no publicar ni editar vehículos.
              </p>
            </div>
          )}

          {vehiclesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden">
                  <div className="aspect-video bg-[#F5F5F5] animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-[#F5F5F5] rounded-full animate-pulse w-3/4" />
                    <div className="h-6 bg-[#F5F5F5] rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {vehicles.map((vehicle) => (
                <VehicleGridCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  canManage={canManageVehicles}
                  canDelete={canDeleteVehicles}
                  onEdit={() => openEditWizard(vehicle)}
                  onPublishToggle={() => handleVehicleAction(
                    () => vehicle.status === 'published'
                      ? unpublishAdminVehicle(token, vehicle.id)
                      : publishAdminVehicle(token, vehicle.id),
                    vehicle.status === 'published' ? 'Vehículo movido a borrador.' : 'Vehículo publicado correctamente.',
                    'No se pudo cambiar el estado del vehículo.',
                  )}
                  onMarkSold={() => handleVehicleAction(
                    () => markAdminVehicleSold(token, vehicle.id),
                    'Vehículo marcado como vendido.',
                    'No se pudo marcar como vendido.',
                  )}
                  onFeatureToggle={() => handleVehicleAction(
                    () => toggleAdminVehicleFeatured(token, vehicle.id, !vehicle.featured),
                    vehicle.featured ? 'Vehículo quitado de destacados.' : 'Vehículo destacado correctamente.',
                    'No se pudo cambiar el destacado.',
                  )}
                  onDelete={() => {
                    if (window.confirm(`¿Eliminar ${vehicle.title}? Esta acción no se puede deshacer.`)) {
                      void handleVehicleAction(
                        () => deleteAdminVehicle(token, vehicle.id),
                        'Vehículo eliminado correctamente.',
                        'No se pudo eliminar el vehículo.',
                      )
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center">
              <p className="font-heading text-xl tracking-tight text-[#0A0A0A] mb-3">
                {vehiclesError ? 'Error al cargar' : 'Sin vehículos'}
              </p>
              <p className="font-body text-sm text-[#AAA] mb-7">
                {vehiclesError || 'Prueba otro filtro o crea un vehículo nuevo para empezar.'}
              </p>
              <button
                type="button"
                onClick={vehiclesError ? () => void loadVehicles() : openCreateWizard}
                className="bg-[#0A0A0A] hover:bg-[#222] text-white font-body text-sm px-6 py-3 rounded-full transition-colors"
              >
                {vehiclesError ? 'Reintentar' : 'Publicar vehículo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Wizard overlay ── */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">

          {/* Wizard nav */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#F0F0F0]">
            <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
              <span className="font-heading text-base tracking-tight text-[#0A0A0A] flex-shrink-0">
                {editorMode === 'edit' ? 'Editar vehículo' : 'Nuevo vehículo'}
              </span>

              <div className="flex-1 flex justify-center overflow-x-auto">
                <WizardStepIndicator
                  steps={WIZARD_STEPS}
                  currentIndex={wizardStepIndex}
                  onStepClick={(nextIndex) => { void handleStepNavigation(nextIndex) }}
                  form={form}
                  selectedVehicle={selectedVehicle}
                />
              </div>

              <button
                type="button"
                onClick={closeWizard}
                className="font-body text-sm text-[#AAA] hover:text-[#0A0A0A] transition-colors px-4 py-2 rounded-full hover:bg-[#F5F5F5] flex-shrink-0"
              >
                Cerrar
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-[#F0F0F0]">
              <div
                className="h-full bg-[#0A0A0A] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Wizard body */}
          <div className="mx-auto max-w-7xl px-6 py-12">

            {/* Toast inside wizard */}
            {(actionError || feedback) && (
              <div className="mb-8 space-y-2">
                {actionError && (
                  <div className="rounded-2xl bg-[#FFF2F3] border border-[#ffd6da] px-5 py-3.5 font-body text-sm text-[#b31a2b]">
                    {actionError}
                  </div>
                )}
                {feedback && !actionError && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3.5 font-body text-sm text-emerald-700">
                    {feedback}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">

              {/* Form panel */}
              <div>
                <div className="mb-10">
                  <h2 className="font-heading text-3xl tracking-tight text-[#0A0A0A]">
                    {currentStep.title}
                  </h2>
                  <p className="font-body text-base text-[#AAA] mt-2">{currentStep.description}</p>
                </div>

                {/* ── Step: details ── */}
                {currentStep.id === 'details' && (
                  <div className="space-y-8">

                    <FieldShell
                      label="Nombre del anuncio"
                      hint="Se completa automáticamente con marca, modelo y año. Ajústalo si deseas."
                      error={formErrors.title}
                    >
                      <div className="space-y-3">
                        <AdminInput
                          value={form.title}
                          onChange={(e) => {
                            setAutoTitleEnabled(false)
                            updateField('title', e.target.value)
                          }}
                          error={formErrors.title}
                          placeholder="Toyota Prado VX 2025"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAutoTitleEnabled(true)
                              updateField('title', suggestedTitle)
                            }}
                            className="font-body text-sm text-[#999] hover:text-[#0A0A0A] transition-colors border border-[#E8E8E8] rounded-full px-3.5 py-1.5"
                          >
                            Usar sugerencia
                          </button>
                          {suggestedTitle && (
                            <span className="font-body text-sm text-[#CCC]">
                              {suggestedTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Marca"
                      hint="Escribe para filtrar — Toyota, Mazda, Honda, Kia y más."
                      error={formErrors.brandChoice}
                    >
                      <div className="space-y-3">
                        {enrichment.loadingMakes ? (
                          <EnrichSpinner label="Cargando marcas..." />
                        ) : (
                          <SmartSelect
                            options={[
                              ...(enrichment.makes.length > 0
                                ? enrichment.makes.map((m) => ({ value: m.name, label: m.name }))
                                : BRAND_OPTIONS.filter((b) => b !== OTHER_OPTION).map((b) => ({ value: b, label: b }))
                              ),
                              { value: OTHER_OPTION, label: 'Otra marca' },
                            ]}
                            value={form.brandChoice}
                            onChange={(v) => updateField('brandChoice', v)}
                            placeholder="Buscar marca..."
                            error={formErrors.brandChoice}
                          />
                        )}
                        {form.brandChoice === OTHER_OPTION && (
                          <AdminInput
                            value={form.customBrand}
                            onChange={(e) => updateField('customBrand', e.target.value)}
                            error={formErrors.brandChoice}
                            placeholder="Escribe la marca"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FieldShell label="Modelo" hint="Elige de la lista o escribe el modelo exacto." error={formErrors.model}>
                        {enrichment.loadingModels ? (
                          <EnrichSpinner label="Cargando modelos..." />
                        ) : enrichment.models.length > 0 && !customModelMode ? (
                          <SmartSelect
                            options={[
                              ...enrichment.models.map((m) => ({ value: m.name, label: m.name })),
                              { value: '__custom__', label: 'Otro modelo...' },
                            ]}
                            value={form.model}
                            onChange={handleModelSelect}
                            placeholder="Buscar modelo..."
                            error={formErrors.model}
                          />
                        ) : (
                          <div className="space-y-2">
                            <AdminInput
                              value={form.model}
                              onChange={(e) => updateField('model', e.target.value)}
                              error={formErrors.model}
                              placeholder="Modelo"
                            />
                            {customModelMode && (
                              <button
                                type="button"
                                onClick={() => { setCustomModelMode(false); updateField('model', '') }}
                                className="text-[12px] text-[#AAA] hover:text-[#0A0A0A] transition-colors"
                              >
                                ← Ver lista de modelos
                              </button>
                            )}
                          </div>
                        )}
                      </FieldShell>

                      <FieldShell label="Año" hint="El año exacto del modelo." error={formErrors.year}>
                        {enrichment.loadingYears ? (
                          <EnrichSpinner label="Cargando años..." />
                        ) : enrichment.years.length > 0 && !customYearMode ? (
                          <SmartSelect
                            options={[
                              ...enrichment.years.map((y) => ({ value: String(y), label: String(y) })),
                              { value: '__custom__', label: 'Otro año...' },
                            ]}
                            value={form.year}
                            onChange={handleYearSelect}
                            placeholder="Seleccionar año..."
                            error={formErrors.year}
                          />
                        ) : (
                          <div className="space-y-2">
                            <AdminInput
                              type="number"
                              value={form.year}
                              onChange={(e) => updateField('year', e.target.value)}
                              error={formErrors.year}
                              placeholder={String(new Date().getFullYear())}
                            />
                            {customYearMode && (
                              <button
                                type="button"
                                onClick={() => { setCustomYearMode(false); updateField('year', '') }}
                                className="text-[12px] text-[#AAA] hover:text-[#0A0A0A] transition-colors"
                              >
                                ← Ver lista de años
                              </button>
                            )}
                          </div>
                        )}
                      </FieldShell>
                    </div>

                    {enrichment.enriching && (
                      <div className="flex items-center gap-2.5 text-[13px] text-[#AAA]">
                        <div className="w-3.5 h-3.5 border-2 border-[#DDD] border-t-[#AAA] rounded-full animate-spin flex-shrink-0" />
                        Buscando especificaciones del vehículo...
                      </div>
                    )}

                    <FieldShell
                      label="Categoría"
                      hint="Esto ayuda a organizarlo mejor en el inventario."
                      error={formErrors.bodyType}
                      suggested={suggestedFields.has('bodyType')}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {BODY_TYPE_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.bodyType === option}
                              onClick={() => updateField('bodyType', option)}
                            >
                              {option === OTHER_OPTION ? 'Otra categoría' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.bodyType === OTHER_OPTION && (
                          <AdminInput
                            value={form.customBodyType}
                            onChange={(e) => updateField('customBodyType', e.target.value)}
                            error={formErrors.bodyType}
                            placeholder="Escribe la categoría"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Color"
                      hint="Elige un color común o escribe uno distinto."
                      error={formErrors.colorChoice}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.colorChoice === option}
                              onClick={() => updateField('colorChoice', option)}
                            >
                              {option === OTHER_OPTION ? 'Otro color' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.colorChoice === OTHER_OPTION && (
                          <AdminInput
                            value={form.customColor}
                            onChange={(e) => updateField('customColor', e.target.value)}
                            error={formErrors.colorChoice}
                            placeholder="Escribe el color"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Ubicación"
                      hint="Así el equipo y el cliente saben dónde está disponible."
                      error={formErrors.locationChoice}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {LOCATION_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.locationChoice === option}
                              onClick={() => updateField('locationChoice', option)}
                            >
                              {option === OTHER_OPTION ? 'Otra ubicación' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.locationChoice === OTHER_OPTION && (
                          <AdminInput
                            value={form.customLocation}
                            onChange={(e) => updateField('customLocation', e.target.value)}
                            error={formErrors.locationChoice}
                            placeholder="Escribe la ubicación"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <div className="pt-2 border-t border-[#F0F0F0]" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FieldShell
                        label="Precio"
                        hint="Monto final que se mostrará en el inventario."
                        error={formErrors.price}
                      >
                        <AdminInput
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => updateField('price', e.target.value)}
                          error={formErrors.price}
                          placeholder="85000"
                        />
                      </FieldShell>

                      <FieldShell
                        label="Moneda"
                        hint="La mayoría del inventario usa USD."
                        error={formErrors.currency}
                      >
                        <div className="flex flex-wrap gap-2">
                          {CURRENCY_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.currency === option}
                              onClick={() => updateField('currency', option)}
                            >
                              {option}
                            </ChoicePill>
                          ))}
                        </div>
                      </FieldShell>
                    </div>

                    <FieldShell
                      label="Condición"
                      hint="Comunica si es nuevo, usado o certificado."
                      error={formErrors.condition}
                    >
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map((option) => (
                          <ChoicePill
                            key={option}
                            active={form.condition === option}
                            onClick={() => updateField('condition', option)}
                          >
                            {option}
                          </ChoicePill>
                        ))}
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Kilometraje"
                      hint="Si es nuevo, puedes dejar 0 km."
                      error={formErrors.mileage}
                    >
                      <AdminInput
                        type="number"
                        value={form.mileage}
                        onChange={(e) => updateField('mileage', e.target.value)}
                        error={formErrors.mileage}
                      />
                    </FieldShell>

                    <FieldShell
                      label="Transmisión"
                      hint="Selecciona la opción que verá el cliente."
                      error={formErrors.transmission}
                      suggested={suggestedFields.has('transmission')}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {TRANSMISSION_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.transmission === option}
                              onClick={() => updateField('transmission', option)}
                            >
                              {option === OTHER_OPTION ? 'Otra transmisión' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.transmission === OTHER_OPTION && (
                          <AdminInput
                            value={form.customTransmission}
                            onChange={(e) => updateField('customTransmission', e.target.value)}
                            error={formErrors.transmission}
                            placeholder="Escribe la transmisión"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Combustible"
                      hint="Ayuda al cliente a filtrar mejor el inventario."
                      error={formErrors.fuelType}
                      suggested={suggestedFields.has('fuelType')}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {FUEL_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.fuelType === option}
                              onClick={() => updateField('fuelType', option)}
                            >
                              {option === OTHER_OPTION ? 'Otro combustible' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.fuelType === OTHER_OPTION && (
                          <AdminInput
                            value={form.customFuelType}
                            onChange={(e) => updateField('customFuelType', e.target.value)}
                            error={formErrors.fuelType}
                            placeholder="Escribe el combustible"
                          />
                        )}
                      </div>
                    </FieldShell>

                    <FieldShell label="Tracción" hint="Si no aplica, elige la opción más cercana." optional suggested={suggestedFields.has('drivetrain')}>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {DRIVETRAIN_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option}
                              active={form.drivetrain === option}
                              onClick={() => updateField('drivetrain', option)}
                            >
                              {option === OTHER_OPTION ? 'Otra tracción' : option}
                            </ChoicePill>
                          ))}
                        </div>
                        {form.drivetrain === OTHER_OPTION && (
                          <AdminInput
                            value={form.customDrivetrain}
                            onChange={(e) => updateField('customDrivetrain', e.target.value)}
                            placeholder="Escribe la tracción"
                          />
                        )}
                      </div>
                    </FieldShell>
                  </div>
                )}

                {/* ── Step: features ── */}
                {currentStep.id === 'features' && (
                  <div className="space-y-8">
                    <FieldShell
                      label="Descripción"
                      hint="Piensa en una explicación que alguien entienda en segundos: estado, sensación y puntos fuertes."
                      error={formErrors.description}
                    >
                      <AdminTextarea
                        rows={6}
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        error={formErrors.description}
                        placeholder="SUV familiar en excelente estado, interior amplio, cámara 360 y conducción muy suave para ciudad o carretera."
                      />
                    </FieldShell>

                    <FieldShell
                      label="Equipamiento destacado"
                      hint={suggestedFields.has('selectedFeatures') ? 'Preseleccionados según año y marca. Deselecciona los que no apliquen.' : 'Selecciona lo más importante. Si falta algo, lo escribes debajo.'}
                      suggested={suggestedFields.has('selectedFeatures')}
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {FEATURE_OPTIONS.map((feature) => (
                            <ChoicePill
                              key={feature}
                              active={form.selectedFeatures.includes(feature)}
                              onClick={() => toggleFeature(feature)}
                            >
                              {feature}
                            </ChoicePill>
                          ))}
                        </div>
                        <AdminInput
                          value={form.customFeaturesText}
                          onChange={(e) => updateField('customFeaturesText', e.target.value)}
                          placeholder="Extras opcionales, separados por coma"
                        />
                      </div>
                    </FieldShell>

                    <FieldShell
                      label="Detalles rápidos"
                      hint="Fichas útiles como motor, puertas, interior o garantía."
                      error={formErrors.specRows}
                    >
                      <div className="space-y-3">
                        {form.specRows.map((row) => (
                          <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                            <AdminInput
                              value={row.key}
                              onChange={(e) => updateSpecRow(row.id, 'key', e.target.value)}
                              placeholder="Motor"
                              error={formErrors.specRows}
                            />
                            <AdminInput
                              value={row.value}
                              onChange={(e) => updateSpecRow(row.id, 'value', e.target.value)}
                              placeholder="2.0 Turbo"
                              error={formErrors.specRows}
                            />
                            <button
                              type="button"
                              onClick={() => removeSpecRow(row.id)}
                              className="rounded-full border border-[#E8E8E8] px-4 py-3 font-body text-sm text-[#999] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A]"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSpecRow}
                          className="rounded-full border border-[#E8E8E8] px-4 py-2.5 font-body text-sm text-[#999] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A]"
                        >
                          Agregar detalle
                        </button>
                      </div>
                    </FieldShell>
                  </div>
                )}

                {/* ── Step: images ── */}
                {currentStep.id === 'images' && (
                  <div className="space-y-8">
                    <div className="rounded-2xl bg-[#FAFAFA] border border-[#F0F0F0] px-5 py-4">
                      <p className="font-body text-sm text-[#777] leading-relaxed">
                        Selecciona varias fotos a la vez. Guardamos tu progreso automáticamente en segundo plano para que puedas concentrarte en la publicación.
                      </p>
                    </div>

                    <FieldShell
                      label="Fotos del vehículo"
                      hint="Recomendado: 5 a 10 fotos limpias, bien iluminadas. La primera imagen queda como portada por defecto."
                      error={formErrors.images || formErrors.publishImages}
                    >
                      <ImageDropZone
                        onUpload={uploadFiles}
                        uploading={uploading}
                        disabled={!canManageVehicles || saving || Boolean(imageActionKey)}
                      />
                    </FieldShell>

                    {pendingUploads.length > 0 && (
                      <div className="bg-white rounded-3xl p-5 border border-[#F0F0F0] space-y-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-body text-sm font-medium text-[#0A0A0A]">
                              Subiendo {pendingUploads.length} {pendingUploads.length === 1 ? 'imagen' : 'imágenes'}
                            </p>
                            <p className="font-body text-xs text-[#999] mt-1">
                              {uploadProgress}% completado
                            </p>
                          </div>
                          <span className="font-body text-xs text-[#AAA]">
                            {uploading ? 'Procesando archivos...' : 'Preparando carga...'}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F3F3F3] overflow-hidden">
                          <div
                            className="h-full bg-[#0A0A0A] transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {pendingUploads.map((item) => (
                            <div key={item.id} className="rounded-2xl overflow-hidden border border-[#F0F0F0] bg-[#FAFAFA]">
                              <img src={item.previewUrl} alt="" className="w-full aspect-video object-cover" />
                              <div className="px-4 py-3">
                                <p className="font-body text-sm text-[#0A0A0A] truncate">{item.name}</p>
                                <p className="font-body text-xs text-[#AAA] mt-1">{formatFileSize(item.size)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(selectedVehicle?.images) && selectedVehicle.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedVehicle.images.map((image) => (
                          <div key={image.id} className="bg-white rounded-2xl overflow-hidden border border-[#F0F0F0]">
                            <div className="relative">
                              <img src={image.url} alt="" className="w-full aspect-video object-cover" />
                              <div className="absolute top-3 left-3 flex items-center gap-2">
                                <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] text-white">
                                  Foto {image.order + 1}
                                </span>
                                {image.isMain && (
                                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-[#0A0A0A]">
                                    Portada
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="px-4 py-4 space-y-3">
                              <div>
                                <p className="font-body text-sm text-[#0A0A0A]">
                                  {image.isMain ? 'Imagen principal del anuncio' : 'Imagen de galería'}
                                </p>
                                <p className="font-body text-xs text-[#AAA] mt-0.5">
                                  {image.width}×{image.height}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {!image.isMain && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMainImage(image.id)}
                                    disabled={uploading || Boolean(imageActionKey)}
                                    className="rounded-full border border-[#E8E8E8] px-3 py-1.5 text-xs text-[#555] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A] disabled:opacity-40"
                                  >
                                    Usar como portada
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(image.id, 'left')}
                                  disabled={uploading || Boolean(imageActionKey) || image.order === 0}
                                  className="rounded-full border border-[#E8E8E8] px-3 py-1.5 text-xs text-[#555] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A] disabled:opacity-40"
                                >
                                  Mover antes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(image.id, 'right')}
                                  disabled={uploading || Boolean(imageActionKey) || image.order === selectedVehicle.images.length - 1}
                                  className="rounded-full border border-[#E8E8E8] px-3 py-1.5 text-xs text-[#555] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A] disabled:opacity-40"
                                >
                                  Mover después
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(image.id)}
                                  disabled={uploading || Boolean(imageActionKey)}
                                  className="rounded-full px-3 py-1.5 text-xs text-red-500 transition-colors hover:text-red-700 disabled:opacity-40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedVehicle?.id && (
                      <div className="bg-white rounded-3xl p-8 text-center">
                        <p className="font-body text-sm text-[#AAA]">
                          Todavía no hay imágenes. Puedes guardarlo como borrador y volver luego, o subirlas ahora y dejarlo listo para publicar.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step: preview ── */}
                {currentStep.id === 'preview' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                      <div className="bg-white rounded-3xl overflow-hidden border border-[#F0F0F0]">
                        {selectedVehicle?.mainImage ? (
                          <img
                            src={selectedVehicle.mainImage}
                            alt=""
                            className="w-full aspect-[16/10] object-cover"
                          />
                        ) : (
                          <div className="aspect-[16/10] bg-[#FAFAFA] flex items-center justify-center px-8 text-center">
                            <p className="font-body text-sm text-[#AAA]">
                              Cuando agregues imágenes, aquí verás la portada principal del vehículo.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-3xl p-6 border border-[#F0F0F0] space-y-5">
                        <div>
                          <p className="font-body text-[11px] uppercase tracking-[0.24em] text-[#CCC] mb-3">
                            Vista pública
                          </p>
                          <h3 className="font-heading text-[28px] tracking-tight text-[#0A0A0A] leading-tight">
                            {form.title || suggestedTitle || 'Tu próximo anuncio'}
                          </h3>
                          <p className="font-body text-sm text-[#999] mt-2">
                            {resolveChoiceValue(form.brandChoice, form.customBrand) || 'Marca'}
                            {' · '}
                            {form.model || 'Modelo'}
                            {' · '}
                            {form.year || 'Año'}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="font-heading text-3xl tracking-tight text-[#0A0A0A]">
                            {form.price ? formatCurrency(form.price, form.currency) : 'Precio pendiente'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              form.condition,
                              form.transmission === OTHER_OPTION ? form.customTransmission : form.transmission,
                              form.fuelType === OTHER_OPTION ? form.customFuelType : form.fuelType,
                              form.drivetrain === OTHER_OPTION ? form.customDrivetrain : form.drivetrain,
                            ].filter(Boolean).map((item) => (
                              <span key={item} className="rounded-full bg-[#F5F5F5] px-3 py-1.5 text-xs text-[#666]">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#F0F0F0] space-y-2.5">
                          {[
                            { label: 'Ubicación', value: resolveChoiceValue(form.locationChoice, form.customLocation) || 'Pendiente' },
                            { label: 'Color', value: resolveChoiceValue(form.colorChoice, form.customColor) || 'Pendiente' },
                            { label: 'Kilometraje', value: `${Number(form.mileage || 0).toLocaleString()} km` },
                            { label: 'Fotos', value: `${selectedVehicle?.images?.length ?? 0}` },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-4">
                              <span className="font-body text-sm text-[#AAA]">{item.label}</span>
                              <span className="font-body text-sm text-[#0A0A0A]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {Array.isArray(selectedVehicle?.images) && selectedVehicle.images.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 border border-[#F0F0F0] space-y-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-heading text-xl tracking-tight text-[#0A0A0A]">Galería</h3>
                            <p className="font-body text-sm text-[#AAA] mt-1">Confirma el orden y la portada antes de publicar.</p>
                          </div>
                          <span className="font-body text-xs text-[#AAA]">{selectedVehicle.images.length} fotos</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {selectedVehicle.images.map((image) => (
                            <div key={image.id} className="rounded-2xl overflow-hidden border border-[#F0F0F0] bg-[#FAFAFA]">
                              <img src={image.url} alt="" className="w-full aspect-video object-cover" />
                              <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                                <span className="font-body text-xs text-[#666]">Foto {image.order + 1}</span>
                                {image.isMain && (
                                  <span className="font-body text-[11px] font-medium text-[#0A0A0A]">Portada</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-3xl p-6 border border-[#F0F0F0] space-y-5">
                      <div>
                        <h3 className="font-heading text-xl tracking-tight text-[#0A0A0A]">Descripción</h3>
                        <p className="font-body text-sm text-[#666] mt-3 leading-relaxed whitespace-pre-line">
                          {form.description.trim() || 'La descripción aparecerá aquí cuando la completes.'}
                        </p>
                      </div>

                      {previewFeatures.length > 0 && (
                        <div>
                          <h4 className="font-body text-sm font-medium text-[#0A0A0A] mb-3">Equipamiento</h4>
                          <div className="flex flex-wrap gap-2">
                            {previewFeatures.map((feature) => (
                              <span key={feature} className="rounded-full bg-[#F5F5F5] px-3 py-1.5 text-xs text-[#666]">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(previewSpecs).length > 0 && (
                        <div>
                          <h4 className="font-body text-sm font-medium text-[#0A0A0A] mb-3">Detalles rápidos</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(previewSpecs).map(([key, value]) => (
                              <div key={key} className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
                                <p className="font-body text-xs uppercase tracking-[0.14em] text-[#BBB]">{key}</p>
                                <p className="font-body text-sm text-[#0A0A0A] mt-1">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!publishReady && (
                      <div className="rounded-2xl bg-[#FFF8EA] border border-[#F8E5B7] px-5 py-4">
                        <p className="font-body text-sm font-medium text-[#8A6414]">
                          Antes de publicarlo, todavía faltan algunos puntos:
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {visibleMissingChecklistItems.map((item) => (
                            <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs text-[#8A6414] border border-[#F2DEAD]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step: publish ── */}
                {currentStep.id === 'publish' && (
                  <div className="space-y-8">
                    <FieldShell
                      label="Decisión final"
                      hint="Aquí decides si el anuncio se queda interno como borrador o si ya sale en vivo."
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FINAL_ACTION_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className={[
                              'rounded-2xl border p-5 text-left',
                              option.value === 'published'
                                ? 'border-[#0A0A0A] bg-[#0A0A0A]'
                                : 'border-[#E8E8E8] bg-white',
                            ].join(' ')}
                          >
                            <p className={`font-body text-sm font-medium ${option.value === 'published' ? 'text-white' : 'text-[#0A0A0A]'}`}>
                              {option.label}
                            </p>
                            <p className={`font-body text-sm mt-1.5 leading-relaxed ${option.value === 'published' ? 'text-white/60' : 'text-[#AAA]'}`}>
                              {option.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </FieldShell>

                    {!publishReady && (
                      <div className="rounded-2xl bg-[#FFF8EA] border border-[#F8E5B7] px-5 py-4">
                        <p className="font-body text-sm font-medium text-[#8A6414]">
                          Si hoy quieres publicarlo, completa antes estos puntos:
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {visibleMissingChecklistItems.map((item) => (
                            <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs text-[#8A6414] border border-[#F2DEAD]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FieldShell label="Etiqueta visible" hint="Sin etiqueta o una breve como Nuevo, Oferta o Full." optional>
                        <div className="flex flex-wrap gap-2">
                          {BADGE_OPTIONS.map((option) => (
                            <ChoicePill
                              key={option || 'none'}
                              active={form.badge === option}
                              onClick={() => updateField('badge', option)}
                            >
                              {option || 'Sin etiqueta'}
                            </ChoicePill>
                          ))}
                        </div>
                      </FieldShell>

                      <FieldShell label="Destacar este vehículo" hint="Dale prioridad en la web pública.">
                        <button
                          type="button"
                          onClick={() => updateField('featured', !form.featured)}
                          className={[
                            'w-full rounded-2xl border p-5 text-left transition-all duration-150',
                            form.featured
                              ? 'border-[#0A0A0A] bg-[#0A0A0A]'
                              : 'border-[#E8E8E8] bg-white hover:border-[#C0C0C0]',
                          ].join(' ')}
                        >
                          <p className={`font-body text-sm font-medium ${form.featured ? 'text-white' : 'text-[#0A0A0A]'}`}>
                            {form.featured ? 'Sí, marcarlo como destacado' : 'No, publicación normal'}
                          </p>
                          <p className={`font-body text-sm mt-1.5 ${form.featured ? 'text-white/60' : 'text-[#AAA]'}`}>
                            {form.featured ? 'Aparecerá con más visibilidad.' : 'Se publicará sin resalte especial.'}
                          </p>
                        </button>
                      </FieldShell>
                    </div>

                    <details className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] overflow-hidden">
                      <summary className="cursor-pointer list-none px-5 py-4 font-body text-sm font-medium text-[#0A0A0A]">
                        Ajustes opcionales para Google
                      </summary>
                      <div className="px-5 pb-5 space-y-5">
                        <p className="font-body text-sm text-[#AAA] leading-relaxed">
                          Si los dejas vacíos, el anuncio igual funciona. Úsalos solo si quieres personalizar cómo se ve en buscadores.
                        </p>
                        <FieldShell label="Título para Google" hint="Una versión más comercial o corta del título." optional>
                          <AdminInput
                            value={form.seoTitle}
                            onChange={(e) => updateField('seoTitle', e.target.value)}
                            placeholder={form.title || suggestedTitle || 'Se llenará automáticamente'}
                          />
                        </FieldShell>
                        <FieldShell label="Descripción para Google" hint="Un resumen corto para resultados de búsqueda." optional>
                          <AdminTextarea
                            rows={3}
                            value={form.seoDescription}
                            onChange={(e) => updateField('seoDescription', e.target.value)}
                            placeholder="Si no escribes nada, se usará la descripción principal."
                          />
                        </FieldShell>
                      </div>
                    </details>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-14 pt-8 border-t border-[#F0F0F0]">
                  <div className="font-body text-sm text-[#CCC]">
                    {currentStep.id === 'images'
                      ? 'Tu progreso se guarda automáticamente mientras organizas la galería.'
                      : currentStep.id === 'preview' && !publishReady
                        ? 'Revisa lo pendiente antes del paso final.'
                      : currentStep.id === 'publish' && !publishReady
                        ? 'Aún faltan algunos puntos antes de publicar.'
                        : `Paso ${wizardStepIndex + 1} de ${WIZARD_STEPS.length}`}
                  </div>

                  <div className="flex items-center gap-3">
                    {wizardStepIndex > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-full border border-[#E8E8E8] px-5 py-3 font-body text-sm text-[#666] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A]"
                      >
                        Atrás
                      </button>
                    )}

                    {wizardStepIndex < WIZARD_STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={handleContinue}
                        disabled={saving}
                        className="rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm text-white transition-colors hover:bg-[#222] disabled:opacity-40"
                      >
                        {saving ? 'Guardando...' : 'Continuar'}
                      </button>
                    )}

                    {wizardStepIndex === WIZARD_STEPS.length - 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={!canManageVehicles || saving}
                          className="rounded-full border border-[#E8E8E8] px-5 py-3 font-body text-sm text-[#666] transition-colors hover:border-[#C0C0C0] hover:text-[#0A0A0A] disabled:opacity-40"
                        >
                          {saving ? 'Guardando...' : 'Guardar borrador'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePublishNow}
                          disabled={!canManageVehicles || saving || !publishReady}
                          className="rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm text-white transition-colors hover:bg-[#222] disabled:opacity-40"
                        >
                          {saving ? 'Publicando...' : 'Publicar vehículo'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview panel */}
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="bg-[#F8F8F8] rounded-3xl p-6">
                  <p className="font-body text-[11px] uppercase tracking-[0.22em] text-[#CCC] mb-5">
                    Resumen del anuncio
                  </p>

                  <div className="space-y-5">
                    <div>
                      <p className="font-heading text-xl tracking-tight text-[#0A0A0A] leading-tight">
                        {form.title || suggestedTitle || 'Tu próximo anuncio'}
                      </p>
                      <p className="font-body text-sm text-[#AAA] mt-1.5">
                        {resolveChoiceValue(form.brandChoice, form.customBrand) || 'Marca'}
                        {' · '}
                        {form.model || 'Modelo'}
                        {' · '}
                        {form.year || 'Año'}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                        {[
                          { label: 'Precio', value: form.price ? formatCurrency(form.price, form.currency) : 'Pendiente' },
                          {
                            label: 'Estado',
                            value: currentStep.id === 'publish' && publishReady
                              ? 'Listo para publicar'
                              : getStatusLabel(form.status),
                          },
                          { label: 'Imágenes', value: `${selectedVehicle?.images?.length ?? 0} fotos` },
                          { label: 'Progreso', value: `${progressPercent}%` },
                        ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-4">
                          <span className="font-body text-sm text-[#AAA]">{item.label}</span>
                          <span className="font-body text-sm text-[#0A0A0A]">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[#EBEBEB]">
                      <p className="font-body text-xs font-medium text-[#0A0A0A] mb-3">Lista de verificación</p>
                      <div className="space-y-2">
                        {visibleChecklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className={[
                              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                              item.done ? 'bg-[#0A0A0A]' : 'bg-[#EBEBEB]',
                            ].join(' ')}>
                              {item.done && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`font-body text-xs ${item.done ? 'text-[#0A0A0A]' : 'text-[#CCC]'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {!shouldWarnAboutImages && !selectedVehicle?.images?.length && (
                  <div className="rounded-2xl bg-[#F3F3F3] border border-[#EAEAEA] p-5">
                    <p className="font-body text-xs font-medium text-[#666] mb-2">Siguiente paso</p>
                    <p className="font-body text-xs text-[#888] leading-relaxed">
                      Las imágenes se cargan en el paso 4, así que todavía no es un error.
                    </p>
                  </div>
                )}

                {visibleMissingChecklistItems.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                    <p className="font-body text-xs font-medium text-amber-800 mb-2">Todavía falta</p>
                    <ul className="space-y-1.5">
                      {visibleMissingChecklistItems.map((item) => (
                        <li key={item} className="font-body text-xs text-amber-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
