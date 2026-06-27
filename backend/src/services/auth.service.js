import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AdminSession } from '../models/AdminSession.js'
import { User } from '../models/User.js'
import { recordAuditLog } from './audit.service.js'
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendUserCreatedEmail,
  sendUserBlockedStateEmail,
} from './email.service.js'
import { badRequest, conflict, notFound, unauthorized } from '../utils/api-error.js'
import {
  assertPasswordStrength,
  createSecureToken,
  hashOpaqueToken,
  normalizeCredential,
} from '../utils/password-policy.js'

const PASSWORD_SALT_ROUNDS = 12
const DUMMY_PASSWORD_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO7d8r0lIsfRSAxEPPYUajF2/MEGLjmfu'
const GENERIC_FORGOT_PASSWORD_MESSAGE = 'Si existe una cuenta asociada, enviaremos instrucciones de recuperación.'

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

function getAccountLockExpiration() {
  return new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60_000)
}

function getPasswordResetExpiration() {
  return new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000)
}

function buildExpiresAt() {
  const milliseconds = parseDurationToMs(env.JWT_EXPIRES_IN)
  return new Date(Date.now() + milliseconds)
}

function createJwtForSession(user, session) {
  return jwt.sign({
    sub: user.id,
    role: user.role,
    sessionId: session.id,
    tokenId: session.tokenId,
    tokenVersion: user.tokenVersion,
  }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

async function issueAdminSession(user, { ipAddress = null, userAgent = null } = {}) {
  const expiresAt = buildExpiresAt()
  const session = await AdminSession.create({
    user: user._id,
    tokenId: crypto.randomUUID(),
    expiresAt,
    ipAddress,
    userAgent,
    lastSeenAt: new Date(),
  })

  const token = createJwtForSession(user, session)

  return {
    token,
    session,
    expiresIn: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  }
}

async function findUserForAuth(identifier) {
  const normalized = normalizeCredential(identifier)
  if (!normalized) return null

  return User.findOne({
    deletedAt: null,
    $or: [
      { username: normalized },
      { email: normalized },
    ],
  })
}

async function registerFailedLoginAttempt(user, { ipAddress, userAgent, identifier, reason }) {
  user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1

  if (user.failedLoginAttempts >= env.MAX_FAILED_LOGIN_ATTEMPTS) {
    user.lockedUntil = getAccountLockExpiration()
  }

  await user.save()

  await recordAuditLog({
    actorId: null,
    targetUserId: user.id,
    action: 'login_failed',
    ip: ipAddress,
    userAgent,
    metadata: {
      identifier,
      reason,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
    },
  })
}

function resetLoginProtectionState(user) {
  user.failedLoginAttempts = 0
  user.lockedUntil = null
}

export async function loginAdmin({ identifier, username, password, ipAddress, userAgent }) {
  const normalizedIdentifier = normalizeCredential(identifier ?? username)
  const user = await findUserForAuth(normalizedIdentifier)

  if (!user) {
    await bcrypt.compare(String(password ?? ''), DUMMY_PASSWORD_HASH)
    await recordAuditLog({
      actorId: null,
      targetUserId: null,
      action: 'login_failed',
      ip: ipAddress,
      userAgent,
      metadata: {
        identifier: normalizedIdentifier,
        reason: 'user_not_found',
      },
    })
    throw unauthorized('Credenciales inválidas.')
  }

  if (user.deletedAt || !user.isActive || user.isBlocked) {
    await recordAuditLog({
      actorId: null,
      targetUserId: user.id,
      action: 'login_failed',
      ip: ipAddress,
      userAgent,
      metadata: {
        identifier: normalizedIdentifier,
        reason: user.deletedAt ? 'deleted' : user.isBlocked ? 'blocked' : 'inactive',
      },
    })
    throw unauthorized('Credenciales inválidas.')
  }

  if (user.isTemporarilyLocked()) {
    await recordAuditLog({
      actorId: null,
      targetUserId: user.id,
      action: 'login_failed',
      ip: ipAddress,
      userAgent,
      metadata: {
        identifier: normalizedIdentifier,
        reason: 'temporarily_locked',
        lockedUntil: user.lockedUntil,
      },
    })
    throw unauthorized('Credenciales inválidas.')
  }

  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    await registerFailedLoginAttempt(user, {
      ipAddress,
      userAgent,
      identifier: normalizedIdentifier,
      reason: 'invalid_password',
    })
    throw unauthorized('Credenciales inválidas.')
  }

  resetLoginProtectionState(user)
  user.lastLoginAt = new Date()
  await user.save()

  const { token, session, expiresIn } = await issueAdminSession(user, { ipAddress, userAgent })

  await recordAuditLog({
    actorId: user.id,
    targetUserId: user.id,
    action: 'login_success',
    ip: ipAddress,
    userAgent,
    metadata: {
      sessionId: session.id,
    },
  })

  return {
    message: 'Inicio de sesión exitoso.',
    token,
    expiresIn,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: user.toSafeJSON(),
  }
}

export async function logoutAdmin(sessionId, { actorId = null, ipAddress = null, userAgent = null } = {}) {
  const session = await AdminSession.findById(sessionId)
  if (!session || session.revokedAt) return

  session.revokedAt = new Date()
  session.revokedReason = 'logout'
  await session.save()

  await recordAuditLog({
    actorId,
    targetUserId: actorId,
    action: 'logout',
    ip: ipAddress,
    userAgent,
    metadata: {
      sessionId,
    },
  })
}

export async function changeOwnPassword({
  userId,
  currentSessionId,
  currentPassword,
  newPassword,
  ipAddress,
  userAgent,
}) {
  const user = await User.findById(userId)
  if (!user || user.deletedAt) throw notFound('Usuario no encontrado.')

  const passwordValid = await user.comparePassword(currentPassword)
  if (!passwordValid) {
    throw unauthorized('La contraseña actual es incorrecta.')
  }

  const isSamePassword = await user.comparePassword(newPassword)
  if (isSamePassword) {
    throw conflict('La nueva contraseña no puede ser igual a la actual.')
  }

  assertPasswordStrength(newPassword, {
    username: user.username,
    email: user.email,
  })

  user.passwordHash = await hashPassword(newPassword)
  user.passwordChangedAt = new Date()
  user.mustChangePassword = false
  resetLoginProtectionState(user)
  user.tokenVersion += 1
  await clearResetPasswordState(user)
  await user.save()

  await revokeAllUserSessions(user.id, 'password_changed')

  const { token, session, expiresIn } = await issueAdminSession(user, { ipAddress, userAgent })

  await recordAuditLog({
    actorId: user.id,
    targetUserId: user.id,
    action: 'password_changed',
    ip: ipAddress,
    userAgent,
    metadata: {
      previousSessionId: currentSessionId,
      nextSessionId: session.id,
    },
  })

  if (user.email) {
    await sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
    })
  }

  return {
    message: 'Contraseña actualizada correctamente.',
    token,
    expiresIn,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: user.toSafeJSON(),
  }
}

export async function revokeAllUserSessions(userId, reason, { exceptSessionId = null } = {}) {
  const filter = {
    user: userId,
    revokedAt: null,
  }

  if (exceptSessionId) {
    filter._id = { $ne: exceptSessionId }
  }

  await AdminSession.updateMany(filter, {
    $set: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  })
}

async function clearResetPasswordState(user, { usedAt = null } = {}) {
  user.resetPasswordTokenHash = null
  user.resetPasswordExpiresAt = null
  user.resetPasswordUsedAt = usedAt
}

export async function requestPasswordReset({ identifier, ipAddress, userAgent }) {
  const normalizedIdentifier = normalizeCredential(identifier)
  const user = await findUserForAuth(normalizedIdentifier)

  if (!user || user.deletedAt || !user.isActive) {
    await recordAuditLog({
      actorId: null,
      targetUserId: user?.id ?? null,
      action: 'password_reset_requested',
      ip: ipAddress,
      userAgent,
      metadata: {
        identifier: normalizedIdentifier,
        outcome: 'ignored',
      },
    })

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE }
  }

  const now = Date.now()
  const lastRequestedAt = user.resetPasswordRequestedAt?.getTime?.() ?? 0
  if (lastRequestedAt && now - lastRequestedAt < env.PASSWORD_RESET_REQUEST_MIN_INTERVAL_MS) {
    await recordAuditLog({
      actorId: null,
      targetUserId: user.id,
      action: 'password_reset_requested',
      ip: ipAddress,
      userAgent,
      metadata: {
        identifier: normalizedIdentifier,
        outcome: 'throttled',
      },
    })

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE }
  }

  const rawToken = createSecureToken(32)
  user.resetPasswordTokenHash = hashOpaqueToken(rawToken)
  user.resetPasswordExpiresAt = getPasswordResetExpiration()
  user.resetPasswordUsedAt = null
  user.resetPasswordRequestedAt = new Date()
  await user.save()

  await recordAuditLog({
    actorId: null,
    targetUserId: user.id,
    action: 'password_reset_requested',
    ip: ipAddress,
    userAgent,
    metadata: {
      identifier: normalizedIdentifier,
      outcome: 'issued',
      expiresAt: user.resetPasswordExpiresAt,
    },
  })

  if (user.email) {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    })
  }

  return { message: GENERIC_FORGOT_PASSWORD_MESSAGE }
}

async function findUserByResetToken(rawToken) {
  const tokenHash = hashOpaqueToken(rawToken)

  return User.findOne({
    deletedAt: null,
    resetPasswordTokenHash: tokenHash,
  })
}

export async function validatePasswordResetToken(rawToken) {
  const user = await findUserByResetToken(rawToken)
  const valid = Boolean(
    user
    && user.resetPasswordTokenHash
    && !user.resetPasswordUsedAt
    && user.resetPasswordExpiresAt
    && user.resetPasswordExpiresAt.getTime() > Date.now()
  )

  return {
    valid,
    message: valid
      ? 'Token válido.'
      : 'El enlace de recuperación no es válido o ya expiró.',
  }
}

export async function resetPasswordWithToken({ token, newPassword, ipAddress, userAgent }) {
  const user = await findUserByResetToken(token)

  if (
    !user
    || user.deletedAt
    || !user.resetPasswordTokenHash
    || user.resetPasswordUsedAt
    || !user.resetPasswordExpiresAt
    || user.resetPasswordExpiresAt.getTime() <= Date.now()
  ) {
    throw badRequest('El enlace de recuperación no es válido o ya expiró.')
  }

  assertPasswordStrength(newPassword, {
    username: user.username,
    email: user.email,
  })

  const isSamePassword = await user.comparePassword(newPassword)
  if (isSamePassword) {
    throw conflict('La nueva contraseña no puede ser igual a la anterior.')
  }

  user.passwordHash = await hashPassword(newPassword)
  user.passwordChangedAt = new Date()
  user.mustChangePassword = false
  resetLoginProtectionState(user)
  user.tokenVersion += 1
  await clearResetPasswordState(user, { usedAt: new Date() })
  await user.save()

  await revokeAllUserSessions(user.id, 'password_reset_completed')

  await recordAuditLog({
    actorId: user.id,
    targetUserId: user.id,
    action: 'password_reset_completed',
    ip: ipAddress,
    userAgent,
    metadata: {
      email: user.email || null,
    },
  })

  if (user.email) {
    await sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
    })
  }

  return {
    message: 'La contraseña se actualizó correctamente. Ya puedes iniciar sesión.',
  }
}

export async function createInitialSuperAdmin({ name, username, email, password }) {
  if (!username || !password || !name) {
    throw badRequest('Faltan variables de entorno del superadmin inicial.')
  }

  const normalizedUsername = normalizeCredential(username)
  const existing = await User.findOne({ username: normalizedUsername })

  if (existing) {
    existing.name = name
    existing.email = email || existing.email
    existing.role = 'superadmin'
    existing.isActive = true
    existing.isBlocked = false
    existing.deletedAt = null
    existing.deletedBy = null
    existing.updatedBy = existing.updatedBy ?? existing._id
    await existing.save()
    return existing
  }

  assertPasswordStrength(password, {
    username: normalizedUsername,
    email,
  })

  return User.create({
    name,
    username: normalizedUsername,
    email: email || undefined,
    passwordHash: await hashPassword(password),
    role: 'superadmin',
    isActive: true,
    isBlocked: false,
    mustChangePassword: false,
  })
}

export async function notifyUserCreated(user) {
  if (!user.email) return

  await sendUserCreatedEmail({
    to: user.email,
    name: user.name,
    username: user.username,
    mustChangePassword: Boolean(user.mustChangePassword),
  })
}

export async function notifyUserBlockState(user) {
  if (!user.email) return

  await sendUserBlockedStateEmail({
    to: user.email,
    name: user.name,
    isBlocked: Boolean(user.isBlocked),
  })
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
