import { asyncHandler } from '../../utils/async-handler.js'
import { changeOwnPassword, loginAdmin, logoutAdmin } from '../../services/auth.service.js'

export const login = asyncHandler(async (req, res) => {
  const payload = req.validated.body
  const response = await loginAdmin({
    ...payload,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  res.status(200).json(response)
})

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: req.auth.user.toSafeJSON(),
    session: {
      id: req.auth.session.id,
      expiresAt: req.auth.session.expiresAt,
    },
  })
})

export const logout = asyncHandler(async (req, res) => {
  await logoutAdmin(req.auth.session.id)
  res.json({ message: 'Sesion cerrada correctamente.' })
})

export const changePassword = asyncHandler(async (req, res) => {
  const response = await changeOwnPassword({
    userId: req.auth.user.id,
    currentPassword: req.validated.body.currentPassword,
    newPassword: req.validated.body.newPassword,
  })

  res.json(response)
})

