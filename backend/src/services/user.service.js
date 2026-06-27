import { canAssignRole, canManageUser } from '../types/roles.js'
import { User } from '../models/User.js'
import { buildPaginationMeta, getPagination } from '../utils/pagination.js'
import { conflict, forbidden, notFound } from '../utils/api-error.js'
import {
  hashPassword,
  notifyUserBlockState,
  notifyUserCreated,
  revokeAllUserSessions,
} from './auth.service.js'
import { recordAuditLog } from './audit.service.js'
import { assertPasswordStrength, normalizeCredential } from '../utils/password-policy.js'

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function assertCanManageTarget(actor, target) {
  if (!canManageUser(actor.role, target.role)) {
    throw forbidden('No puedes gestionar ese usuario.')
  }
}

async function assertNotLastActiveSuperadmin(target, { nextRole, nextIsActive, nextDeletedAt } = {}) {
  const willRemainSuperadmin = (nextRole ?? target.role) === 'superadmin'
  const willRemainActive = nextIsActive ?? target.isActive
  const willRemainDeleted = nextDeletedAt ?? target.deletedAt

  if (willRemainSuperadmin && willRemainActive && !willRemainDeleted) {
    return
  }

  if (target.role !== 'superadmin' || target.deletedAt) {
    return
  }

  const activeSuperadmins = await User.countDocuments({
    role: 'superadmin',
    isActive: true,
    deletedAt: null,
    _id: { $ne: target._id },
  })

  if (activeSuperadmins === 0) {
    throw forbidden('No puedes dejar el sistema sin un superadmin activo.')
  }
}

function buildListFilter(query) {
  const filter = { deletedAt: null }

  if (query.role) filter.role = query.role
  if (typeof query.isActive === 'boolean') filter.isActive = query.isActive
  if (typeof query.isBlocked === 'boolean') filter.isBlocked = query.isBlocked

  if (query.search) {
    const regex = new RegExp(escapeRegExp(query.search), 'i')
    filter.$or = [
      { name: regex },
      { username: regex },
      { email: regex },
    ]
  }

  return filter
}

export async function listUsers(query) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20, maxLimit: 100 })
  const filter = buildListFilter(query)

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  return {
    data: data.map((user) => user.toSafeJSON()),
    meta: buildPaginationMeta({ page, limit, total }),
  }
}

export async function getUserById(userId, actor) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)
  return target.toSafeJSON()
}

export async function createUser(payload, actor, context = {}) {
  if (!canAssignRole(actor.role, payload.role)) {
    throw forbidden('No puedes crear usuarios con ese rol.')
  }

  const normalizedUsername = normalizeCredential(payload.username)
  const normalizedEmail = payload.email ? normalizeCredential(payload.email) : undefined

  const [sameUsername, sameEmail] = await Promise.all([
    User.findOne({ username: normalizedUsername }),
    normalizedEmail ? User.findOne({ email: normalizedEmail }) : null,
  ])

  if (sameUsername) throw conflict('Ya existe un usuario con ese username.')
  if (sameEmail) throw conflict('Ya existe un usuario con ese correo.')

  assertPasswordStrength(payload.password, {
    username: normalizedUsername,
    email: normalizedEmail,
  })

  const user = await User.create({
    name: payload.name,
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    isActive: payload.isActive,
    isBlocked: false,
    mustChangePassword: payload.mustChangePassword ?? true,
    createdBy: actor.id,
    updatedBy: actor.id,
  })

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: user.id,
    action: 'user_created',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      role: user.role,
      username: user.username,
      mustChangePassword: user.mustChangePassword,
    },
  })

  await notifyUserCreated(user)

  return user.toSafeJSON()
}

export async function updateUser(userId, payload, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)

  if (payload.username && normalizeCredential(payload.username) !== target.username) {
    const sameUsername = await User.findOne({ username: normalizeCredential(payload.username), _id: { $ne: target._id } })
    if (sameUsername) throw conflict('Ya existe un usuario con ese username.')
    target.username = normalizeCredential(payload.username)
  }

  if (payload.email !== undefined) {
    const normalizedEmail = payload.email ? normalizeCredential(payload.email) : undefined
    if (normalizedEmail && normalizedEmail !== target.email) {
      const sameEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: target._id } })
      if (sameEmail) throw conflict('Ya existe un usuario con ese correo.')
    }
    target.email = normalizedEmail
  }

  if (payload.name !== undefined) target.name = payload.name
  if (typeof payload.mustChangePassword === 'boolean') target.mustChangePassword = payload.mustChangePassword
  if (typeof payload.isActive === 'boolean') {
    if (actor.id === target.id && payload.isActive === false) {
      throw forbidden('No puedes desactivar tu propia cuenta.')
    }

    await assertNotLastActiveSuperadmin(target, { nextIsActive: payload.isActive })
    target.isActive = payload.isActive
  }

  target.updatedBy = actor.id
  await target.save()

  if (payload.isActive === false) {
    await revokeAllUserSessions(target.id, 'user_deactivated')
  }

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'user_updated',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      fields: Object.keys(payload),
    },
  })

  return target.toSafeJSON()
}

export async function updateUserPassword(userId, payload, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)
  if (actor.id === target.id) {
    throw forbidden('Usa el cambio de contraseña personal para tu propia cuenta.')
  }

  assertPasswordStrength(payload.password, {
    username: target.username,
    email: target.email,
  })

  const isSamePassword = await target.comparePassword(payload.password)
  if (isSamePassword) {
    throw conflict('La nueva contraseña no puede ser igual a la actual.')
  }

  target.passwordHash = await hashPassword(payload.password)
  target.passwordChangedAt = new Date()
  target.mustChangePassword = payload.mustChangePassword ?? true
  target.failedLoginAttempts = 0
  target.lockedUntil = null
  target.tokenVersion += 1
  target.updatedBy = actor.id
  await target.save()

  await revokeAllUserSessions(target.id, 'admin_password_reset')

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'password_changed',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      byAdmin: true,
      mustChangePassword: target.mustChangePassword,
    },
  })

  return target.toSafeJSON()
}

export async function updateUserStatus(userId, payload, actor, context = {}) {
  return updateUser(userId, payload, actor, context)
}

export async function blockUser(userId, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)
  if (actor.id === target.id) {
    throw forbidden('No puedes bloquear tu propia cuenta.')
  }

  target.isBlocked = true
  target.updatedBy = actor.id
  await target.save()
  await revokeAllUserSessions(target.id, 'user_blocked')

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'user_blocked',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {},
  })

  await notifyUserBlockState(target)

  return target.toSafeJSON()
}

export async function unblockUser(userId, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)

  target.isBlocked = false
  target.failedLoginAttempts = 0
  target.lockedUntil = null
  target.updatedBy = actor.id
  await target.save()

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'user_unblocked',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {},
  })

  await notifyUserBlockState(target)

  return target.toSafeJSON()
}

export async function updateUserRole(userId, payload, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)
  if (!canAssignRole(actor.role, payload.role)) {
    throw forbidden('No puedes cambiar el rol de ese usuario.')
  }

  if (actor.id === target.id) {
    throw forbidden('No puedes cambiar tu propio rol.')
  }

  await assertNotLastActiveSuperadmin(target, { nextRole: payload.role })

  target.role = payload.role
  target.updatedBy = actor.id
  await target.save()
  await revokeAllUserSessions(target.id, 'role_changed')

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'role_changed',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      role: target.role,
    },
  })

  return target.toSafeJSON()
}

export async function deleteUser(userId, actor, context = {}) {
  const target = await User.findById(userId)
  if (!target || target.deletedAt) throw notFound('Usuario no encontrado.')

  await assertCanManageTarget(actor, target)
  if (actor.id === target.id) {
    throw forbidden('No puedes eliminar tu propia cuenta.')
  }

  await assertNotLastActiveSuperadmin(target, { nextDeletedAt: new Date(), nextIsActive: false })

  target.isActive = false
  target.isBlocked = true
  target.deletedAt = new Date()
  target.deletedBy = actor.id
  target.updatedBy = actor.id
  await target.save()
  await revokeAllUserSessions(target.id, 'user_deleted')

  await recordAuditLog({
    actorId: actor.id,
    targetUserId: target.id,
    action: 'user_deleted',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {},
  })

  return target.toSafeJSON()
}
