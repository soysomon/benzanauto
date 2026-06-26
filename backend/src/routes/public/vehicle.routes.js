import { Router } from 'express'
import * as vehicleController from '../../controllers/public/vehicle.controller.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  vehicleContactParamsSchema,
  publicVehicleListQuerySchema,
  vehicleSlugParamsSchema,
} from '../../validators/vehicle.validators.js'

const router = Router()

router.get('/', validateRequest({ query: publicVehicleListQuerySchema }), vehicleController.index)
router.get('/featured', vehicleController.featured)
router.post('/:slug/contact', validateRequest({ params: vehicleContactParamsSchema }), vehicleController.contact)
router.get('/:slug', validateRequest({ params: vehicleSlugParamsSchema }), vehicleController.show)

export default router
