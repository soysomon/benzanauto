import { z } from 'zod'
import { ROLES } from '../types/roles.js'
import {
  booleanish,
  numberish,
  objectIdParam,
  optionalTrimmedString,
  trimmedString,
} from './common.validators.js'

export const userListQuerySchema = z.object({
  page: numberish('La pagina', { integer: true, min: 1 }).optional(),
  limit: numberish('El limite', { integer: true, min: 1, max: 100 }).optional(),
  search: optionalTrimmedString(120),
  role: z.enum(ROLES).optional(),
  isActive: booleanish.optional(),
  isBlocked: booleanish.optional(),
})

export const createUserBodySchema = z.object({
  name: trimmedString('El nombre', { min: 3, max: 120 }),
  username: trimmedString('El usuario', { min: 3, max: 60 })
    .regex(/^[a-zA-Z0-9._-]+$/, 'El usuario solo puede contener letras, numeros, punto, guion y underscore.')
    .transform((value) => value.toLowerCase()),
  email: z
    .preprocess((value) => {
      if (value === undefined || value === null || String(value).trim() === '') return undefined
      return String(value).trim().toLowerCase()
    }, z.string().email('El correo no es valido.'))
    .optional(),
  password: trimmedString('La contrasena', { min: 12, max: 128 }),
  role: z.enum(ROLES),
  isActive: booleanish.optional().default(true),
  mustChangePassword: booleanish.optional().default(true),
})

export const userIdParamsSchema = z.object({
  id: objectIdParam,
})

export const updateUserBodySchema = z.object({
  name: trimmedString('El nombre', { min: 3, max: 120 }).optional(),
  username: trimmedString('El usuario', { min: 3, max: 60 })
    .regex(/^[a-zA-Z0-9._-]+$/, 'El usuario solo puede contener letras, numeros, punto, guion y underscore.')
    .transform((value) => value.toLowerCase())
    .optional(),
  email: z
    .preprocess((value) => {
      if (value === undefined || value === null) return undefined
      const normalized = String(value).trim()
      if (!normalized) return null
      return normalized.toLowerCase()
    }, z.union([
      z.string().email('El correo no es valido.'),
      z.null(),
    ]))
    .optional(),
  isActive: booleanish.optional(),
  mustChangePassword: booleanish.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
})

export const updateUserStatusBodySchema = z.object({
  isActive: booleanish,
})

export const updateUserRoleBodySchema = z.object({
  role: z.enum(ROLES),
})

export const updateUserPasswordBodySchema = z.object({
  password: trimmedString('La contrasena', { min: 12, max: 128 }),
  mustChangePassword: booleanish.optional().default(true),
})
