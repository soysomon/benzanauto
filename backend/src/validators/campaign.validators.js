import { z } from 'zod'
import {
  CAMPAIGN_DISPLAY_TYPES,
  CAMPAIGN_FREQUENCY_RULES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TARGET_DEVICES,
} from '../types/campaign.js'
import {
  commaArray,
  numberish,
  objectIdParam,
  optionalTrimmedString,
  trimmedString,
} from './common.validators.js'

const optionalNumberish = (field, options = {}) => numberish(field, options).optional()

const optionalDateField = (field) => z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed
  }

  return value
}, z.date({
  invalid_type_error: `${field} debe ser una fecha valida.`,
}).nullable())

const targetRoutesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return value
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
  }

  return value
}, z.array(z.string().trim().min(1).max(200)).max(20).default(['*']))

const targetDevicesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    }
  }

  return value
}, z.array(z.enum(CAMPAIGN_TARGET_DEVICES)).min(1).max(CAMPAIGN_TARGET_DEVICES.length)
  .default([...CAMPAIGN_TARGET_DEVICES]))

const ctaUrlSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined
  const normalized = String(value).trim()
  return normalized === '' ? undefined : normalized
}, z.string().max(500).refine((value) => {
  if (!value) return true
  if (value.startsWith('/')) return true
  if (/^(mailto:|tel:)/i.test(value)) return true

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}, 'La URL del CTA debe ser una ruta interna o una URL valida.').optional())

const campaignBodyShape = {
  title: trimmedString('El titulo', { min: 4, max: 160 }),
  description: trimmedString('La descripcion', { min: 12, max: 1200 }),
  imageAlt: optionalTrimmedString(180),
  ctaText: optionalTrimmedString(80),
  ctaUrl: ctaUrlSchema,
  status: z.enum(CAMPAIGN_STATUSES).optional().default('draft'),
  startAt: optionalDateField('La fecha de inicio').optional().default(null),
  endAt: optionalDateField('La fecha de fin').optional().default(null),
  delaySeconds: numberish('La demora de apertura', { integer: true, min: 0, max: 120 }).optional().default(3),
  frequencyRule: z.enum(CAMPAIGN_FREQUENCY_RULES).optional().default('session'),
  priority: numberish('La prioridad', { integer: true, min: 0, max: 1000 }).optional().default(100),
  displayType: z.enum(CAMPAIGN_DISPLAY_TYPES).optional().default('modal'),
  targetRoutes: targetRoutesSchema,
  targetDevices: targetDevicesSchema,
}

function withCampaignRules(schema) {
  return schema.superRefine((payload, ctx) => {
  if ((payload.ctaText && !payload.ctaUrl) || (!payload.ctaText && payload.ctaUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: payload.ctaText ? ['ctaUrl'] : ['ctaText'],
      message: 'CTA requiere texto y URL juntos.',
    })
  }

  if (payload.startAt && payload.endAt && payload.endAt <= payload.startAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endAt'],
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
    })
  }
  })
}

export const createCampaignBodySchema = withCampaignRules(z.object(campaignBodyShape))

export const updateCampaignBodySchema = withCampaignRules(z.object(campaignBodyShape).partial())
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  })

export const updateCampaignStatusBodySchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES),
})

export const adminCampaignListQuerySchema = z.object({
  page: optionalNumberish('La pagina', { integer: true, min: 1 }),
  limit: optionalNumberish('El limite', { integer: true, min: 1, max: 100 }),
  q: optionalTrimmedString(120),
  status: commaArray.optional(),
  displayType: commaArray.optional(),
})

export const campaignIdParamsSchema = z.object({
  id: objectIdParam,
})

export const publicCampaignQuerySchema = z.object({
  route: optionalTrimmedString(240),
  device: z.enum(CAMPAIGN_TARGET_DEVICES).optional(),
})

export const uploadCampaignImageBodySchema = z.object({
  imageAlt: optionalTrimmedString(180),
})
