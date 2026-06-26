import { z } from 'zod'
import {
  BODY_TYPES,
  FUEL_TYPES,
  SORT_OPTIONS,
  TRANSMISSIONS,
  VEHICLE_CONDITIONS,
  VEHICLE_CURRENCIES,
  VEHICLE_STATUSES,
} from '../types/vehicle.js'
import {
  booleanish,
  commaArray,
  numberish,
  objectIdParam,
  optionalTrimmedString,
  trimmedString,
} from './common.validators.js'

const optionalNumberish = (field, options = {}) => numberish(field, options).optional()

const featuresSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }

  return value
}, z.array(z.string().trim().min(1).max(120)).max(50).default([]))

const specsSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}, z.record(z.string().trim().min(1).max(120)).refine((record) => Object.keys(record).length <= 40, {
  message: 'Las especificaciones no pueden exceder 40 entradas.',
})).optional()

const baseVehicleBodySchema = z.object({
  title: trimmedString('El titulo', { min: 4, max: 180 }),
  slug: optionalTrimmedString(220),
  brand: trimmedString('La marca', { min: 2, max: 80 }),
  model: trimmedString('El modelo', { min: 1, max: 120 }),
  year: numberish('El ano', { integer: true, min: 1900, max: 2100 }),
  price: numberish('El precio', { min: 0 }),
  currency: z.enum(VEHICLE_CURRENCIES),
  mileage: numberish('El kilometraje', { min: 0 }),
  transmission: z.enum(TRANSMISSIONS),
  fuelType: z.enum(FUEL_TYPES),
  bodyType: z.enum(BODY_TYPES),
  drivetrain: optionalTrimmedString(40),
  color: trimmedString('El color', { min: 2, max: 60 }),
  condition: z.enum(VEHICLE_CONDITIONS),
  vin: optionalTrimmedString(17)
    .refine((value) => !value || /^[A-HJ-NPR-Z0-9]{11,17}$/.test(value), 'El VIN no es valido.')
    .optional(),
  location: trimmedString('La ubicacion', { min: 2, max: 160 }),
  description: trimmedString('La descripcion', { min: 20, max: 5000 }),
  features: featuresSchema,
  specs: specsSchema,
  badge: optionalTrimmedString(40),
  featured: booleanish.optional().default(false),
  status: z.enum(VEHICLE_STATUSES).optional().default('draft'),
  seoTitle: optionalTrimmedString(70),
  seoDescription: optionalTrimmedString(160),
  mainImageId: objectIdParam.optional(),
  imageOrder: z.array(objectIdParam).max(50).optional().default([]),
})

export const createVehicleBodySchema = baseVehicleBodySchema

export const updateVehicleBodySchema = baseVehicleBodySchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
})

export const publicVehicleListQuerySchema = z.object({
  page: optionalNumberish('La pagina', { integer: true, min: 1 }),
  limit: optionalNumberish('El limite', { integer: true, min: 1, max: 100 }),
  q: optionalTrimmedString(120),
  brand: commaArray.optional(),
  model: optionalTrimmedString(120),
  condition: commaArray.optional(),
  transmission: commaArray.optional(),
  fuelType: commaArray.optional(),
  bodyType: commaArray.optional(),
  featured: booleanish.optional(),
  minPrice: optionalNumberish('El precio minimo', { min: 0 }),
  maxPrice: optionalNumberish('El precio maximo', { min: 0 }),
  minYear: optionalNumberish('El ano minimo', { integer: true, min: 1900, max: 2100 }),
  maxYear: optionalNumberish('El ano maximo', { integer: true, min: 1900, max: 2100 }),
  sort: z.enum(SORT_OPTIONS).optional(),
  marca: commaArray.optional(),
  tipo: commaArray.optional(),
  categoria: commaArray.optional(),
  combustible: commaArray.optional(),
  precioMax: optionalNumberish('El precio maximo', { min: 0 }),
  estado: commaArray.optional(),
  orden: z.enum(['default', 'price-asc', 'price-desc', 'year']).optional(),
})

export const adminVehicleListQuerySchema = z.object({
  page: optionalNumberish('La pagina', { integer: true, min: 1 }),
  limit: optionalNumberish('El limite', { integer: true, min: 1, max: 100 }),
  q: optionalTrimmedString(120),
  brand: commaArray.optional(),
  condition: commaArray.optional(),
  status: commaArray.optional(),
  featured: booleanish.optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
})

export const vehicleIdParamsSchema = z.object({
  id: objectIdParam,
})

export const vehicleSlugParamsSchema = z.object({
  slug: trimmedString('El slug', { min: 1, max: 220 }),
})

export const vehicleContactParamsSchema = z.object({
  slug: trimmedString('El identificador', { min: 1, max: 220 }),
})

export const vehicleImageParamsSchema = z.object({
  id: objectIdParam,
  imageId: objectIdParam,
})

export const updateVehicleFeaturedBodySchema = z.object({
  featured: booleanish,
})

export const uploadVehicleImagesBodySchema = z.object({
  setAsMain: booleanish.optional(),
  mainImageIndex: numberish('El indice de imagen principal', { integer: true, min: 0 }).optional(),
})
