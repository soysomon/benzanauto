import { z } from 'zod'
import { trimmedString } from './common.validators.js'

export const loginBodySchema = z.object({
  username: trimmedString('El usuario', { min: 3, max: 60 }).transform((value) => value.toLowerCase()),
  password: trimmedString('La contrasena', { min: 8, max: 128 }),
})

export const changePasswordBodySchema = z.object({
  currentPassword: trimmedString('La contrasena actual', { min: 8, max: 128 }),
  newPassword: trimmedString('La nueva contrasena', { min: 8, max: 128 }),
  confirmPassword: trimmedString('La confirmacion de contrasena', { min: 8, max: 128 }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'La confirmacion no coincide con la nueva contrasena.',
  path: ['confirmPassword'],
})

