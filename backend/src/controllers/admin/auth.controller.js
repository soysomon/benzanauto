import { asyncHandler } from '../../utils/async-handler.js'
import {
  changeOwnPassword,
  loginAdmin,
  logoutAdmin,
  requestPasswordReset,
  resetPasswordWithToken,
  serializeAdminSessionPayload,
  validatePasswordResetToken,
} from '../../services/auth.service.js'
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from '../../utils/admin-auth-cookie.js'

export const login = asyncHandler(async (req, res) => {
  const payload = req.validated.body
  const response = await loginAdmin({
    ...payload,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  setAdminSessionCookie(res, response.token, response.session.expiresAt)
  res.status(200).json(response)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const response = await requestPasswordReset({
    identifier: req.validated.body.identifier,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  res.status(200).json(response)
})

export const validateResetPasswordToken = asyncHandler(async (req, res) => {
  const response = await validatePasswordResetToken(req.validated.body.token)
  res.status(200).json(response)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const response = await resetPasswordWithToken({
    token: req.validated.body.token,
    newPassword: req.validated.body.newPassword,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  res.status(200).json(response)
})

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: req.auth.user.toSafeJSON(),
    session: serializeAdminSessionPayload(req.auth.session),
    csrfToken: req.auth.session.csrfToken ?? null,
  })
})

export const logout = asyncHandler(async (req, res) => {
  await logoutAdmin(req.auth.session.id, {
    actorId: req.auth.user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  clearAdminSessionCookie(res)
  res.json({ message: 'Sesión cerrada correctamente.' })
})

export const changePassword = asyncHandler(async (req, res) => {
  const response = await changeOwnPassword({
    userId: req.auth.user.id,
    currentSessionId: req.auth.session.id,
    currentPassword: req.validated.body.currentPassword,
    newPassword: req.validated.body.newPassword,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })

  setAdminSessionCookie(res, response.token, response.session.expiresAt)
  res.json(response)
})
