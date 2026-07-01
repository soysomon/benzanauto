import { Vehicle } from '../models/Vehicle.js'
import { buildPaginationMeta, getPagination } from '../utils/pagination.js'
import { isValidObjectId } from '../utils/object-id.js'
import { buildVehicleTitle, slugify } from '../utils/slug.js'
import { conflict, notFound } from '../utils/api-error.js'
import { shouldCountVehicleView } from '../utils/view-tracker.js'
import { invalidatePublishedChatInventoryCache } from './chatInventory.service.js'
import { normalizeImageOrdering, removeAllVehicleImages, syncVehicleMainImage } from './image.service.js'

const PUBLIC_VEHICLE_SUMMARY_PROJECTION = Object.freeze({
  _id: 1,
  legacyId: 1,
  slug: 1,
  title: 1,
  brand: 1,
  model: 1,
  year: 1,
  price: 1,
  currency: 1,
  mileage: 1,
  transmission: 1,
  fuelType: 1,
  bodyType: 1,
  drivetrain: 1,
  color: 1,
  condition: 1,
  status: 1,
  featured: 1,
  badge: 1,
  mainImage: 1,
  images: 1,
  publishedAt: 1,
})

export async function listPublicVehicles(query) {
  const normalized = normalizePublicQuery(query)
  const { page, limit, skip } = getPagination(normalized, { defaultLimit: 12, maxLimit: 60 })
  const filter = buildMongoFilter(normalized, { publicOnly: true })
  const sort = buildSort(normalized.sort)

  const [vehicles, total, facets] = await Promise.all([
    Vehicle.find(filter, PUBLIC_VEHICLE_SUMMARY_PROJECTION).sort(sort).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(filter),
    buildPublicFacets(filter),
  ])

  return {
    data: vehicles.map((vehicle) => serializePublicVehicle(vehicle, { summaryOnly: true })),
    meta: buildPaginationMeta({ page, limit, total }),
    facets,
  }
}

export async function listFeaturedVehicles(limit = 6) {
  const vehicles = await Vehicle.find({
    status: 'published',
    featured: true,
  }, PUBLIC_VEHICLE_SUMMARY_PROJECTION)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()

  return vehicles.map((vehicle) => serializePublicVehicle(vehicle, { summaryOnly: true }))
}

export async function getPublicVehicleBySlug(slug, { ipAddress } = {}) {
  const vehicle = await Vehicle.findOne(buildPublicVehicleLookup(slug))

  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  if (shouldCountVehicleView({ vehicleId: vehicle.id, ip: ipAddress })) {
    vehicle.views += 1
    await vehicle.save()
  }

  return serializePublicVehicle(vehicle.toObject(), { summaryOnly: false })
}

export async function incrementPublicVehicleContact(identifier) {
  const vehicle = await Vehicle.findOneAndUpdate(
    buildPublicVehicleLookup(identifier),
    { $inc: { contactCount: 1 } },
    { new: true },
  ).select('_id slug contactCount')

  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  return {
    ok: true,
    vehicleId: String(vehicle._id),
    slug: vehicle.slug,
    contactCount: vehicle.contactCount ?? 0,
  }
}

export async function listAdminVehicles(query) {
  const normalized = normalizeAdminQuery(query)
  const { page, limit, skip } = getPagination(normalized, { defaultLimit: 20, maxLimit: 100 })
  const filter = buildMongoFilter(normalized, { publicOnly: false })
  const sort = buildSort(normalized.sort, { admin: true })

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).sort(sort).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ])

  return {
    data: vehicles.map((vehicle) => serializeAdminVehicle(vehicle)),
    meta: buildPaginationMeta({ page, limit, total }),
  }
}

export async function getAdminVehicleById(id) {
  const vehicle = await Vehicle.findById(id)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')
  return serializeAdminVehicle(vehicle)
}

export async function createVehicle(payload, actor) {
  const title = buildVehicleTitle(payload)
  const slug = await ensureUniqueSlug(payload.slug || title)

  const vehicle = await Vehicle.create({
    ...payload,
    title,
    slug,
    badge: payload.badge ?? '',
    drivetrain: payload.drivetrain ?? '',
    seoTitle: payload.seoTitle ?? '',
    seoDescription: payload.seoDescription ?? '',
    createdBy: actor.id,
    updatedBy: actor.id,
    publishedAt: payload.status === 'published' ? new Date() : null,
    soldAt: payload.status === 'sold' ? new Date() : null,
  })

  syncVehicleMainImage(vehicle, {
    preferredMainImageId: payload.mainImageId,
    setAsMain: false,
  })
  await vehicle.save()
  invalidatePublishedChatInventoryCache()

  return serializeAdminVehicle(vehicle)
}

export async function updateVehicle(id, payload, actor) {
  const vehicle = await Vehicle.findById(id)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  const nextTitle = buildVehicleTitle({
    title: payload.title ?? vehicle.title,
    brand: payload.brand ?? vehicle.brand,
    model: payload.model ?? vehicle.model,
    year: payload.year ?? vehicle.year,
  })

  if (payload.slug || payload.title || payload.brand || payload.model || payload.year) {
    vehicle.slug = await ensureUniqueSlug(payload.slug || nextTitle, vehicle.id)
  }

  vehicle.title = nextTitle

  for (const field of [
    'brand',
    'model',
    'year',
    'price',
    'currency',
    'mileage',
    'transmission',
    'fuelType',
    'bodyType',
    'drivetrain',
    'color',
    'condition',
    'vin',
    'location',
    'description',
    'features',
    'specs',
    'badge',
    'featured',
    'status',
    'seoTitle',
    'seoDescription',
  ]) {
    if (field in payload) {
      vehicle[field] = payload[field]
    }
  }

  if (Array.isArray(payload.imageOrder) && payload.imageOrder.length > 0) {
    normalizeImageOrdering(vehicle, payload.imageOrder)
  }

  syncVehicleMainImage(vehicle, {
    preferredMainImageId: payload.mainImageId,
  })

  applyStatusTimestamps(vehicle)
  vehicle.updatedBy = actor.id
  await vehicle.save()
  invalidatePublishedChatInventoryCache()

  return serializeAdminVehicle(vehicle)
}

export async function deleteVehicle(id) {
  const vehicle = await Vehicle.findById(id)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  await removeAllVehicleImages(vehicle)
  await vehicle.deleteOne()
  invalidatePublishedChatInventoryCache()
}

export async function publishVehicle(id, actor) {
  return updateVehicleStatus(id, 'published', actor)
}

export async function unpublishVehicle(id, actor) {
  return updateVehicleStatus(id, 'draft', actor)
}

export async function markVehicleAsSold(id, actor) {
  return updateVehicleStatus(id, 'sold', actor)
}

export async function updateVehicleFeatured(id, featured, actor) {
  const vehicle = await Vehicle.findById(id)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  vehicle.featured = featured
  vehicle.updatedBy = actor.id
  await vehicle.save()
  invalidatePublishedChatInventoryCache()

  return serializeAdminVehicle(vehicle)
}

async function updateVehicleStatus(id, status, actor) {
  const vehicle = await Vehicle.findById(id)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  vehicle.status = status
  vehicle.updatedBy = actor.id
  applyStatusTimestamps(vehicle)
  await vehicle.save()
  invalidatePublishedChatInventoryCache()

  return serializeAdminVehicle(vehicle)
}

async function ensureUniqueSlug(candidate, currentVehicleId = null) {
  const baseSlug = slugify(candidate)
  if (!baseSlug) throw conflict('No se pudo generar un slug valido para el vehiculo.')

  let attempt = baseSlug
  let counter = 2

  while (true) {
    const existing = await Vehicle.findOne({ slug: attempt }).select('_id')

    if (!existing || String(existing._id) === String(currentVehicleId)) {
      return attempt
    }

    attempt = `${baseSlug}-${counter}`
    counter += 1
  }
}

function normalizePublicQuery(query) {
  return {
    ...query,
    brand: uniqueList([...(query.brand ?? []), ...(query.marca ?? [])]),
    bodyType: uniqueList([...(query.bodyType ?? []), ...(query.tipo ?? []), ...(query.categoria ?? [])]),
    fuelType: uniqueList([...(query.fuelType ?? []), ...(query.combustible ?? [])]),
    condition: uniqueList([...(query.condition ?? []), ...(query.estado ?? [])].filter((value) => value !== 'Todos')),
    maxPrice: query.maxPrice ?? query.precioMax,
    sort: normalizeSort(query.sort, query.orden),
  }
}

function normalizeAdminQuery(query) {
  return {
    ...query,
    sort: normalizeSort(query.sort),
  }
}

function buildMongoFilter(query, { publicOnly }) {
  const filter = {}

  if (publicOnly) {
    filter.status = 'published'
  } else if (query.status?.length) {
    filter.status = { $in: query.status }
  }

  if (query.brand?.length) filter.brand = { $in: query.brand }
  if (query.bodyType?.length) filter.bodyType = { $in: query.bodyType }
  if (query.fuelType?.length) filter.fuelType = { $in: query.fuelType }
  if (query.condition?.length) filter.condition = { $in: query.condition }
  if (typeof query.featured === 'boolean') filter.featured = query.featured
  if (query.model) filter.model = new RegExp(escapeRegExp(query.model), 'i')

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {}
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice
  }

  if (query.minYear !== undefined || query.maxYear !== undefined) {
    filter.year = {}
    if (query.minYear !== undefined) filter.year.$gte = query.minYear
    if (query.maxYear !== undefined) filter.year.$lte = query.maxYear
  }

  if (query.q) {
    const regex = new RegExp(escapeRegExp(query.q), 'i')
    filter.$or = [
      { title: regex },
      { brand: regex },
      { model: regex },
      { description: regex },
      { features: regex },
    ]
  }

  return filter
}

function buildSort(sort, { admin = false } = {}) {
  switch (sort) {
    case 'price-asc':
      return { price: 1, createdAt: -1 }
    case 'price-desc':
      return { price: -1, createdAt: -1 }
    case 'year-asc':
      return { year: 1, createdAt: -1 }
    case 'year-desc':
      return { year: -1, createdAt: -1 }
    case 'views-desc':
      return { views: -1, createdAt: -1 }
    case 'recent':
    default:
      return admin
        ? { createdAt: -1 }
        : { featured: -1, publishedAt: -1, createdAt: -1 }
  }
}

function normalizeSort(sort, legacyOrder = null) {
  if (sort) return sort

  switch (legacyOrder) {
    case 'price-asc':
      return 'price-asc'
    case 'price-desc':
      return 'price-desc'
    case 'year':
      return 'year-desc'
    default:
      return 'recent'
  }
}

function buildPublicVehicleLookup(identifier) {
  const normalizedIdentifier = String(identifier).trim()
  const numericLegacyId = /^\d+$/.test(normalizedIdentifier)
    ? Number.parseInt(normalizedIdentifier, 10)
    : null

  return {
    status: 'published',
    $or: [
      { slug: normalizedIdentifier },
      ...(Number.isInteger(numericLegacyId) ? [{ legacyId: numericLegacyId }] : []),
      ...(isValidObjectId(normalizedIdentifier) ? [{ _id: normalizedIdentifier }] : []),
    ],
  }
}

function applyStatusTimestamps(vehicle) {
  if (vehicle.status === 'published') {
    vehicle.publishedAt = vehicle.publishedAt ?? new Date()
    vehicle.soldAt = null
    return
  }

  if (vehicle.status === 'sold') {
    vehicle.soldAt = vehicle.soldAt ?? new Date()
    vehicle.publishedAt = vehicle.publishedAt ?? new Date()
    return
  }

  if (vehicle.status === 'draft') {
    vehicle.publishedAt = null
    vehicle.soldAt = null
    return
  }

  if (vehicle.status === 'archived') {
    vehicle.soldAt = null
  }
}

async function buildPublicFacets(filter) {
  const [result] = await Vehicle.aggregate([
    { $match: filter },
    {
      $facet: {
        brands: [
          { $group: { _id: '$brand', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        bodyTypes: [
          { $group: { _id: '$bodyType', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        fuelTypes: [
          { $group: { _id: '$fuelType', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        conditions: [
          { $group: { _id: '$condition', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
      },
    },
  ])

  return {
    brands: normalizeFacet(result?.brands),
    bodyTypes: normalizeFacet(result?.bodyTypes),
    fuelTypes: normalizeFacet(result?.fuelTypes),
    conditions: normalizeFacet(result?.conditions),
  }
}

function normalizeFacet(items = []) {
  return items.map((item) => ({
    value: item._id,
    count: item.count,
  }))
}

function serializePublicVehicle(vehicle, { summaryOnly = false } = {}) {
  const images = serializeImages(vehicle.images)
  const mainImage = vehicle.mainImage || images[0]?.url || ''

  const payload = {
    id: String(vehicle._id),
    legacyId: vehicle.legacyId ?? null,
    slug: vehicle.slug,
    title: vehicle.title,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    currency: vehicle.currency,
    mileage: vehicle.mileage,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    fuel: vehicle.fuelType,
    bodyType: vehicle.bodyType,
    category: vehicle.bodyType,
    drivetrain: vehicle.drivetrain,
    traction: vehicle.drivetrain,
    color: vehicle.color,
    condition: vehicle.condition,
    status: vehicle.status,
    featured: vehicle.featured,
    badge: vehicle.badge || '',
    mainImage,
    image: mainImage,
    images,
    gallery: images.map((image) => image.url),
    publishedAt: vehicle.publishedAt ?? null,
  }

  if (summaryOnly) {
    return payload
  }

  return {
    ...payload,
    location: vehicle.location,
    description: vehicle.description,
    features: vehicle.features ?? [],
    specs: toPlainObject(vehicle.specs),
    views: vehicle.views ?? 0,
    contactCount: vehicle.contactCount ?? 0,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  }
}

export function serializeAdminVehicle(vehicle) {
  const plain = vehicle.toObject ? vehicle.toObject() : vehicle
  return {
    id: String(plain._id),
    legacyId: plain.legacyId ?? null,
    title: plain.title,
    slug: plain.slug,
    brand: plain.brand,
    model: plain.model,
    year: plain.year,
    price: plain.price,
    currency: plain.currency,
    mileage: plain.mileage,
    transmission: plain.transmission,
    fuelType: plain.fuelType,
    bodyType: plain.bodyType,
    drivetrain: plain.drivetrain,
    color: plain.color,
    condition: plain.condition,
    vin: plain.vin || '',
    location: plain.location,
    description: plain.description,
    features: plain.features ?? [],
    specs: toPlainObject(plain.specs),
    images: serializeImages(plain.images),
    mainImage: plain.mainImage || '',
    status: plain.status,
    featured: plain.featured,
    badge: plain.badge || '',
    views: plain.views ?? 0,
    contactCount: plain.contactCount ?? 0,
    seoTitle: plain.seoTitle || '',
    seoDescription: plain.seoDescription || '',
    createdBy: plain.createdBy ? String(plain.createdBy) : null,
    updatedBy: plain.updatedBy ? String(plain.updatedBy) : null,
    publishedAt: plain.publishedAt ?? null,
    soldAt: plain.soldAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  }
}

function serializeImages(images = []) {
  return [...images]
    .sort((left, right) => left.order - right.order)
    .map((image) => ({
      id: String(image._id),
      url: image.url,
      width: image.width,
      height: image.height,
      size: image.size,
      order: image.order,
      isMain: image.isMain,
      mimeType: image.mimeType,
      alt: image.alt,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    }))
}

function toPlainObject(value) {
  if (!value) return {}
  if (value instanceof Map) return Object.fromEntries(value.entries())
  return value
}

function uniqueList(list) {
  return [...new Set((list ?? []).filter(Boolean))]
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
