import { Router } from 'express'
import * as userController from '../../controllers/admin/user.controller.js'
import { authenticateAdmin } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  createUserBodySchema,
  updateUserBodySchema,
  updateUserPasswordBodySchema,
  updateUserRoleBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
  userListQuerySchema,
} from '../../validators/user.validators.js'

const router = Router()

router.use(authenticateAdmin)
router.use(requirePermission('manageAllUsers'))

router.get('/', validateRequest({ query: userListQuerySchema }), userController.index)
router.get('/:id', validateRequest({ params: userIdParamsSchema }), userController.show)
router.post('/', validateRequest({ body: createUserBodySchema }), userController.store)
router.patch('/:id', validateRequest({ params: userIdParamsSchema, body: updateUserBodySchema }), userController.update)
router.patch('/:id/status', validateRequest({ params: userIdParamsSchema, body: updateUserStatusBodySchema }), userController.updateStatus)
router.patch('/:id/password', validateRequest({ params: userIdParamsSchema, body: updateUserPasswordBodySchema }), userController.updatePassword)
router.patch('/:id/block', validateRequest({ params: userIdParamsSchema }), userController.block)
router.patch('/:id/unblock', validateRequest({ params: userIdParamsSchema }), userController.unblock)
router.patch('/:id/role', validateRequest({ params: userIdParamsSchema, body: updateUserRoleBodySchema }), userController.updateRole)
router.delete('/:id', validateRequest({ params: userIdParamsSchema }), userController.destroy)

export default router
