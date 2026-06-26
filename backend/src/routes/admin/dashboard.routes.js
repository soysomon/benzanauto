import { Router } from 'express'
import * as dashboardController from '../../controllers/admin/dashboard.controller.js'
import { authenticateAdmin } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'

const router = Router()

router.get('/stats', authenticateAdmin, requirePermission('readAdmin'), dashboardController.stats)

export default router

