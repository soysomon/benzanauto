import { Router } from 'express'
import * as userController from '../../controllers/admin/user.controller.js'
import { authenticateAdmin } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  createUserBodySchema,
  updateUserRoleBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
  userListQuerySchema,
} from '../../validators/user.validators.js'

const router = Router()

router.use(authenticateAdmin)
router.use(requirePermission('manageLimitedUsers'))

router.get('/', validateRequest({ query: userListQuerySchema }), userController.index)
router.post('/', validateRequest({ body: createUserBodySchema }), userController.store)
router.patch('/:id/status', validateRequest({ params: userIdParamsSchema, body: updateUserStatusBodySchema }), userController.updateStatus)
router.patch('/:id/role', validateRequest({ params: userIdParamsSchema, body: updateUserRoleBodySchema }), userController.updateRole)

export default router

