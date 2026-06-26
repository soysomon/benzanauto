import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AdminSession } from '../models/AdminSession.js'
import { User } from '../models/User.js'
import { badRequest, conflict, notFound, unauthorized } from '../utils/api-error.js'

const PASSWORD_SALT_ROUNDS = 12

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

export async function loginAdmin({ username, password, ipAddress, userAgent }) {
  const user = await User.findOne({ username: username.toLowerCase() })

  if (!user || !user.isActive) {
    throw unauthorized('Credenciales invalidas.')
  }

  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    throw unauthorized('Credenciales invalidas.')
  }

  const expiresAt = buildExpiresAt()
  const session = await AdminSession.create({
    user: user._id,
    tokenId: crypto.randomUUID(),
    expiresAt,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    lastSeenAt: new Date(),
  })

  const token = jwt.sign({
    sub: user.id,
    role: user.role,
    sessionId: session.id,
    tokenId: session.tokenId,
    tokenVersion: user.tokenVersion,
  }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })

  user.lastLoginAt = new Date()
  await user.save()

  return {
    message: 'Inicio de sesion exitoso.',
    token,
    expiresIn: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: user.toSafeJSON(),
  }
}

export async function logoutAdmin(sessionId) {
  const session = await AdminSession.findById(sessionId)
  if (!session || session.revokedAt) return

  session.revokedAt = new Date()
  session.revokedReason = 'logout'
  await session.save()
}

export async function changeOwnPassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId)
  if (!user) throw notFound('Usuario no encontrado.')

  const passwordValid = await user.comparePassword(currentPassword)
  if (!passwordValid) {
    throw unauthorized('La contrasena actual es incorrecta.')
  }

  const isSamePassword = await user.comparePassword(newPassword)
  if (isSamePassword) {
    throw conflict('La nueva contrasena no puede ser igual a la actual.')
  }

  user.passwordHash = await hashPassword(newPassword)
  user.passwordChangedAt = new Date()
  user.tokenVersion += 1
  await user.save()

  await revokeAllUserSessions(user.id, 'password_changed')

  return {
    message: 'Contrasena actualizada correctamente. Debes volver a iniciar sesion.',
  }
}

export async function revokeAllUserSessions(userId, reason) {
  await AdminSession.updateMany({
    user: userId,
    revokedAt: null,
  }, {
    $set: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  })
}

export async function createInitialSuperAdmin({ name, username, email, password }) {
  if (!username || !password || !name) {
    throw badRequest('Faltan variables de entorno del superadmin inicial.')
  }

  const existing = await User.findOne({ username: username.toLowerCase() })
  const passwordHash = await hashPassword(password)

  if (existing) {
    existing.name = name
    existing.email = email || existing.email
    existing.role = 'superadmin'
    existing.isActive = true
    existing.passwordHash = passwordHash
    existing.passwordChangedAt = new Date()
    existing.tokenVersion += 1
    await existing.save()
    await revokeAllUserSessions(existing.id, 'seed_refresh')
    return existing
  }

  return User.create({
    name,
    username: username.toLowerCase(),
    email: email || undefined,
    passwordHash,
    role: 'superadmin',
    isActive: true,
  })
}

function buildExpiresAt() {
  const milliseconds = parseDurationToMs(env.JWT_EXPIRES_IN)
  return new Date(Date.now() + milliseconds)
}

function parseDurationToMs(value) {
  if (typeof value === 'number') return value * 1000

  const normalized = String(value).trim()
  if (/^\d+$/.test(normalized)) return Number(normalized) * 1000

  const match = normalized.match(/^(\d+)([smhd])$/i)
  if (!match) return 12 * 60 * 60 * 1000

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()

  switch (unit) {
    case 's': return amount * 1000
    case 'm': return amount * 60 * 1000
    case 'h': return amount * 60 * 60 * 1000
    case 'd': return amount * 24 * 60 * 60 * 1000
    default: return 12 * 60 * 60 * 1000
  }
}
