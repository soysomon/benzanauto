import { z } from 'zod'

export const trimmedString = (field, { min = 1, max = 255 } = {}) =>
  z
    .string({ required_error: `${field} es obligatorio.` })
    .trim()
    .min(min, `${field} es obligatorio.`)
    .max(max, `${field} no puede exceder ${max} caracteres.`)

export const optionalTrimmedString = (max = 255) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null) return undefined
      const normalized = String(value).trim()
      return normalized === '' ? undefined : normalized
    }, z.string().max(max).optional())

export const booleanish = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }

  return value
}, z.boolean())

export const numberish = (field, { min, max, integer = false } = {}) =>
  z.preprocess((value) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && value.trim() !== '') return Number(value)
    return value
  }, (() => {
    let schema = z.number({
      required_error: `${field} es obligatorio.`,
      invalid_type_error: `${field} debe ser numerico.`,
    })

    if (integer) schema = schema.int(`${field} debe ser un entero.`)
    if (min !== undefined) schema = schema.min(min, `${field} debe ser mayor o igual que ${min}.`)
    if (max !== undefined) schema = schema.max(max, `${field} debe ser menor o igual que ${max}.`)

    return schema
  })())

export const objectIdParam = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/i, 'El identificador no es valido.')

export const commaArray = z.preprocess((value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return value
}, z.array(z.string().trim().min(1)).default([]))
