import { Router } from 'express'
import * as authController from '../../controllers/admin/auth.controller.js'
import { authenticateAdmin } from '../../middlewares/auth.middleware.js'
import { loginRateLimiter } from '../../middlewares/rate-limit.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import { changePasswordBodySchema, loginBodySchema } from '../../validators/auth.validators.js'

const router = Router()

router.post('/login', loginRateLimiter, validateRequest({ body: loginBodySchema }), authController.login)
router.get('/me', authenticateAdmin, authController.me)
router.post('/logout', authenticateAdmin, authController.logout)
router.patch('/change-password', authenticateAdmin, validateRequest({ body: changePasswordBodySchema }), authController.changePassword)

export default router

