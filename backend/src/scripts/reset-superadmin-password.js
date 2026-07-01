import 'dotenv/config'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { User } from '../models/User.js'
import { hashPassword, revokeAllUserSessions } from '../services/auth.service.js'
import { logger } from '../utils/logger.js'
import { assertPasswordStrength, normalizeCredential } from '../utils/password-policy.js'

const scriptLogger = logger.child({ scope: 'script:reset-superadmin-password' })

function readArg(name) {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function readBooleanArg(name, fallback) {
  const raw = readArg(name)
  if (raw === null) return fallback

  const normalized = String(raw).trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false

  throw new Error(`Valor inválido para --${name}. Usa true o false.`)
}

function requireArg(name, fallback = '') {
  const value = readArg(name) ?? fallback
  if (!String(value).trim()) {
    throw new Error(`Falta --${name}.`)
  }

  return String(value).trim()
}

async function run() {
  const username = normalizeCredential(requireArg('username', process.env.SUPERADMIN_USERNAME))
  const password = requireArg('password')
  const mustChangePassword = readBooleanArg('must-change-password', true)

  if (!username) {
    throw new Error('No se pudo resolver el username del superadmin.')
  }

  await connectDatabase()

  const user = await User.findOne({
    username,
    deletedAt: null,
    role: 'superadmin',
  })

  if (!user) {
    throw new Error(`No se encontró un superadmin activo con username "${username}".`)
  }

  assertPasswordStrength(password, {
    username: user.username,
    email: user.email,
  })

  user.passwordHash = await hashPassword(password)
  user.passwordChangedAt = new Date()
  user.mustChangePassword = mustChangePassword
  user.failedLoginAttempts = 0
  user.lockedUntil = null
  user.isActive = true
  user.isBlocked = false
  user.tokenVersion += 1
  user.resetPasswordTokenHash = null
  user.resetPasswordExpiresAt = null
  user.resetPasswordUsedAt = null
  user.resetPasswordRequestedAt = null
  user.deletedAt = null
  user.deletedBy = null

  await user.save()
  await revokeAllUserSessions(user.id, 'superadmin_password_reset_script')

  scriptLogger.warn('superadmin_password_reset_completed', {
    username: user.username,
    mustChangePassword,
    userId: user.id,
  })
}

run()
  .then(async () => {
    await disconnectDatabase().catch(() => {})
    process.exit(0)
  })
  .catch(async (error) => {
    scriptLogger.error('superadmin_password_reset_failed', {
      error,
    })
    await disconnectDatabase().catch(() => {})
    process.exit(1)
  })
