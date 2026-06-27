import { Router } from 'express'
import * as auditController from '../../controllers/admin/audit.controller.js'
import { authenticateAdmin } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import { auditListQuerySchema } from '../../validators/audit.validators.js'

const router = Router()

router.use(authenticateAdmin)
router.use(requirePermission('manageAllUsers'))

router.get('/', validateRequest({ query: auditListQuerySchema }), auditController.index)

export default router
