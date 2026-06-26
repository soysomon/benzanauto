import { asyncHandler } from '../../utils/async-handler.js'
import { createUser, listUsers, updateUserRole, updateUserStatus } from '../../services/user.service.js'

export const index = asyncHandler(async (req, res) => {
  const response = await listUsers(req.validated.query)
  res.json(response)
})

export const store = asyncHandler(async (req, res) => {
  const user = await createUser(req.validated.body, req.auth.user)
  res.status(201).json({
    message: 'Usuario creado correctamente.',
    user,
  })
})

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await updateUserStatus(req.validated.params.id, req.validated.body, req.auth.user)
  res.json({
    message: 'Estado del usuario actualizado correctamente.',
    user,
  })
})

export const updateRole = asyncHandler(async (req, res) => {
  const user = await updateUserRole(req.validated.params.id, req.validated.body, req.auth.user)
  res.json({
    message: 'Rol del usuario actualizado correctamente.',
    user,
  })
})

