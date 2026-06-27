import { z } from 'zod'
import { trimmedString } from './common.validators.js'

const passwordString = (label) => trimmedString(label, { min: 12, max: 128 })

export const loginBodySchema = z.object({
  identifier: trimmedString('El usuario o correo', { min: 3, max: 160 })
    .optional(),
  username: trimmedString('El usuario o correo', { min: 3, max: 160 })
    .optional(),
  password: trimmedString('La contrasena', { min: 8, max: 128 }),
}).transform((value) => ({
  identifier: (value.identifier ?? value.username ?? '').trim().toLowerCase(),
  password: value.password,
}))

export const forgotPasswordBodySchema = z.object({
  identifier: trimmedString('El usuario o correo', { min: 3, max: 160 })
    .optional(),
  username: trimmedString('El usuario o correo', { min: 3, max: 160 })
    .optional(),
  email: trimmedString('El usuario o correo', { min: 3, max: 160 })
    .optional(),
}).transform((value) => ({
  identifier: (value.identifier ?? value.username ?? value.email ?? '').trim().toLowerCase(),
}))

export const resetPasswordValidateBodySchema = z.object({
  token: trimmedString('El token', { min: 20, max: 512 }),
})

export const resetPasswordBodySchema = z.object({
  token: trimmedString('El token', { min: 20, max: 512 }),
  newPassword: passwordString('La nueva contrasena'),
  confirmPassword: passwordString('La confirmacion de contrasena'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'La confirmacion no coincide con la nueva contrasena.',
  path: ['confirmPassword'],
})

export const changePasswordBodySchema = z.object({
  currentPassword: trimmedString('La contrasena actual', { min: 8, max: 128 }),
  newPassword: passwordString('La nueva contrasena'),
  confirmPassword: passwordString('La confirmacion de contrasena'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'La confirmacion no coincide con la nueva contrasena.',
  path: ['confirmPassword'],
})
