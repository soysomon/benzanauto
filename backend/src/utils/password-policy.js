import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { badRequest } from './api-error.js'

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'qwerty123',
  'admin123',
  'superadmin',
  '123123123',
  'welcome123',
  'benzanauto',
])

export function normalizeCredential(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function assertPasswordStrength(password, { username = '', email = '' } = {}) {
  const normalized = String(password ?? '')
  const lowered = normalized.toLowerCase()

  if (normalized.length < env.PASSWORD_MIN_LENGTH) {
    throw badRequest(`La contraseña debe tener al menos ${env.PASSWORD_MIN_LENGTH} caracteres.`)
  }

  if (COMMON_PASSWORDS.has(lowered)) {
    throw badRequest('La contraseña es demasiado común. Elige una frase o combinación más segura.')
  }

  const personalFragments = [
    normalizeCredential(username),
    normalizeCredential(email).split('@')[0],
  ].filter(Boolean)

  if (personalFragments.some((fragment) => fragment.length >= 3 && lowered.includes(fragment))) {
    throw badRequest('La contraseña no debe incluir tu usuario o correo.')
  }

  const repeatedChars = /(.)\1{4,}/
  if (repeatedChars.test(normalized)) {
    throw badRequest('La contraseña no debe tener demasiados caracteres repetidos consecutivos.')
  }
}

export function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function createSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}
