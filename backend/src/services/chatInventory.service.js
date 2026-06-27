import { Vehicle } from '../models/Vehicle.js'

const DEFAULT_CHAT_INVENTORY_CACHE_MS = 15_000
const CHAT_INVENTORY_CACHE_MS = Number.isFinite(Number.parseInt(process.env.CHAT_INVENTORY_CACHE_MS ?? '', 10))
  ? Math.max(0, Number.parseInt(process.env.CHAT_INVENTORY_CACHE_MS, 10))
  : DEFAULT_CHAT_INVENTORY_CACHE_MS

let cachedInventory = []
let cacheExpiresAt = 0
let hasCache = false
let inflightSnapshotPromise = null

function toPlainObject(value) {
  if (!value) return {}
  if (value instanceof Map) return Object.fromEntries(value.entries())
  return value
}

function normalizeImages(images = []) {
  return [...images]
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((image) => ({
      id: String(image._id),
      url: image.url,
      width: image.width,
      height: image.height,
      order: image.order ?? 0,
      isMain: Boolean(image.isMain),
    }))
}

function parsePassengerCapacity(specs = {}) {
  const capacityCandidates = [
    specs.capacidad,
    specs.pasajeros,
    specs.passengers,
    specs.seats,
  ]

  for (const value of capacityCandidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value
    }

    if (typeof value === 'string') {
      const match = value.match(/(\d{1,2})/)
      if (match) {
        const parsed = Number.parseInt(match[1], 10)
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed
        }
      }
    }
  }

  return null
}

function normalizeChatVehicle(vehicle) {
  const specs = toPlainObject(vehicle.specs)
  const images = normalizeImages(vehicle.images)
  const mainImage = vehicle.mainImage || images.find((image) => image.isMain)?.url || images[0]?.url || ''

  return {
    id: String(vehicle._id),
    legacyId: vehicle.legacyId ?? null,
    slug: vehicle.slug,
    title: vehicle.title,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    currency: vehicle.currency ?? 'USD',
    mileage: vehicle.mileage ?? 0,
    transmission: vehicle.transmission ?? '',
    fuel: vehicle.fuelType ?? '',
    fuelType: vehicle.fuelType ?? '',
    traction: vehicle.drivetrain ?? '',
    drivetrain: vehicle.drivetrain ?? '',
    color: vehicle.color ?? '',
    status: vehicle.status,
    condition: vehicle.condition ?? '',
    badge: vehicle.badge || '',
    category: vehicle.bodyType ?? '',
    bodyType: vehicle.bodyType ?? '',
    location: vehicle.location ?? '',
    description: vehicle.description ?? '',
    features: Array.isArray(vehicle.features) ? vehicle.features : [],
    image: mainImage,
    mainImage,
    images,
    gallery: images.map((imageItem) => imageItem.url),
    specs,
    passengerCapacity: parsePassengerCapacity(specs),
    featured: Boolean(vehicle.featured),
    publishedAt: vehicle.publishedAt ?? null,
    createdAt: vehicle.createdAt ?? null,
    updatedAt: vehicle.updatedAt ?? null,
  }
}

async function loadPublishedChatInventory() {
  const vehicles = await Vehicle.find({ status: 'published' })
    .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
    .lean()

  return vehicles.map((vehicle) => normalizeChatVehicle(vehicle))
}

export async function getPublishedChatInventorySnapshot({ force = false } = {}) {
  const now = Date.now()

  if (!force && hasCache && now < cacheExpiresAt) {
    return cachedInventory
  }

  if (inflightSnapshotPromise) {
    return inflightSnapshotPromise
  }

  inflightSnapshotPromise = loadPublishedChatInventory()

  try {
    const snapshot = await inflightSnapshotPromise
    cachedInventory = snapshot
    cacheExpiresAt = Date.now() + CHAT_INVENTORY_CACHE_MS
    hasCache = true
    return cachedInventory
  } finally {
    inflightSnapshotPromise = null
  }
}

export function invalidatePublishedChatInventoryCache() {
  cachedInventory = []
  cacheExpiresAt = 0
  hasCache = false
}
