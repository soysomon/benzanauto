import { asyncHandler } from '../../utils/async-handler.js'
import {
  blockUser,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  unblockUser,
  updateUser,
  updateUserPassword,
  updateUserRole,
  updateUserStatus,
} from '../../services/user.service.js'

function getActorContext(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }
}

export const index = asyncHandler(async (req, res) => {
  const response = await listUsers(req.validated.query)
  res.json(response)
})

export const show = asyncHandler(async (req, res) => {
  const user = await getUserById(req.validated.params.id, req.auth.user)
  res.json({ user })
})

export const store = asyncHandler(async (req, res) => {
  const user = await createUser(req.validated.body, req.auth.user, getActorContext(req))
  res.status(201).json({
    message: 'Usuario creado correctamente.',
    user,
  })
})

export const update = asyncHandler(async (req, res) => {
  const user = await updateUser(req.validated.params.id, req.validated.body, req.auth.user, getActorContext(req))
  res.json({
    message: 'Usuario actualizado correctamente.',
    user,
  })
})

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await updateUserStatus(req.validated.params.id, req.validated.body, req.auth.user, getActorContext(req))
  res.json({
    message: 'Estado del usuario actualizado correctamente.',
    user,
  })
})

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await updateUserPassword(req.validated.params.id, req.validated.body, req.auth.user, getActorContext(req))
  res.json({
    message: 'Contraseña del usuario actualizada correctamente.',
    user,
  })
})

export const updateRole = asyncHandler(async (req, res) => {
  const user = await updateUserRole(req.validated.params.id, req.validated.body, req.auth.user, getActorContext(req))
  res.json({
    message: 'Rol del usuario actualizado correctamente.',
    user,
  })
})

export const block = asyncHandler(async (req, res) => {
  const user = await blockUser(req.validated.params.id, req.auth.user, getActorContext(req))
  res.json({
    message: 'Usuario bloqueado correctamente.',
    user,
  })
})

export const unblock = asyncHandler(async (req, res) => {
  const user = await unblockUser(req.validated.params.id, req.auth.user, getActorContext(req))
  res.json({
    message: 'Usuario desbloqueado correctamente.',
    user,
  })
})

export const destroy = asyncHandler(async (req, res) => {
  const user = await deleteUser(req.validated.params.id, req.auth.user, getActorContext(req))
  res.json({
    message: 'Usuario desactivado correctamente.',
    user,
  })
})
