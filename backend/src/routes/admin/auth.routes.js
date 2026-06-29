import { Router } from 'express'
import * as authController from '../../controllers/admin/auth.controller.js'
import { authenticateAdmin, requireAdminCsrf } from '../../middlewares/auth.middleware.js'
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  resetPasswordRateLimiter,
} from '../../middlewares/rate-limit.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  resetPasswordValidateBodySchema,
} from '../../validators/auth.validators.js'

const router = Router()

router.post('/login', loginRateLimiter, validateRequest({ body: loginBodySchema }), authController.login)
router.post('/forgot-password', forgotPasswordRateLimiter, validateRequest({ body: forgotPasswordBodySchema }), authController.forgotPassword)
router.post('/reset-password/validate', resetPasswordRateLimiter, validateRequest({ body: resetPasswordValidateBodySchema }), authController.validateResetPasswordToken)
router.post('/reset-password', resetPasswordRateLimiter, validateRequest({ body: resetPasswordBodySchema }), authController.resetPassword)
router.get('/me', authenticateAdmin, authController.me)
router.post('/logout', authenticateAdmin, requireAdminCsrf, authController.logout)
router.patch('/change-password', authenticateAdmin, requireAdminCsrf, validateRequest({ body: changePasswordBodySchema }), authController.changePassword)

export default router
