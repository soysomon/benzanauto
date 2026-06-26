import { canAssignRole, canManageUser } from '../types/roles.js'
import { User } from '../models/User.js'
import { buildPaginationMeta, getPagination } from '../utils/pagination.js'
import { conflict, forbidden, notFound } from '../utils/api-error.js'
import { hashPassword, revokeAllUserSessions } from './auth.service.js'

export async function listUsers(query) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20, maxLimit: 100 })
  const filter = {}

  if (query.role) filter.role = query.role
  if (typeof query.isActive === 'boolean') filter.isActive = query.isActive

  if (query.search) {
    const regex = new RegExp(escapeRegExp(query.search), 'i')
    filter.$or = [
      { name: regex },
      { username: regex },
      { email: regex },
    ]
  }

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  return {
    data: data.map((user) => user.toSafeJSON()),
    meta: buildPaginationMeta({ page, limit, total }),
  }
}

export async function createUser(payload, actor) {
  if (!canAssignRole(actor.role, payload.role)) {
    throw forbidden('No puedes crear usuarios con ese rol.')
  }

  const [sameUsername, sameEmail] = await Promise.all([
    User.findOne({ username: payload.username }),
    payload.email ? User.findOne({ email: payload.email }) : null,
  ])

  if (sameUsername) throw conflict('Ya existe un usuario con ese username.')
  if (sameEmail) throw conflict('Ya existe un usuario con ese correo.')

  const user = await User.create({
    name: payload.name,
    username: payload.username,
    email: payload.email,
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
    isActive: payload.isActive,
    createdBy: actor.id,
    updatedBy: actor.id,
  })

  return user.toSafeJSON()
}

export async function updateUserStatus(userId, payload, actor) {
  const target = await User.findById(userId)
  if (!target) throw notFound('Usuario no encontrado.')

  if (!canManageUser(actor.role, target.role)) {
    throw forbidden('No puedes modificar el estado de ese usuario.')
  }

  if (actor.id === target.id && payload.isActive === false) {
    throw forbidden('No puedes desactivar tu propia cuenta.')
  }

  target.isActive = payload.isActive
  target.updatedBy = actor.id
  await target.save()

  if (!payload.isActive) {
    await revokeAllUserSessions(target.id, 'user_deactivated')
  }

  return target.toSafeJSON()
}

export async function updateUserRole(userId, payload, actor) {
  const target = await User.findById(userId)
  if (!target) throw notFound('Usuario no encontrado.')

  if (!canManageUser(actor.role, target.role) || !canAssignRole(actor.role, payload.role)) {
    throw forbidden('No puedes cambiar el rol de ese usuario.')
  }

  if (actor.id === target.id) {
    throw forbidden('No puedes cambiar tu propio rol.')
  }

  target.role = payload.role
  target.updatedBy = actor.id
  await target.save()
  await revokeAllUserSessions(target.id, 'role_changed')

  return target.toSafeJSON()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
