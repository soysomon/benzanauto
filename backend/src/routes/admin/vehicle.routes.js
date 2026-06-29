import { Router } from 'express'
import * as vehicleController from '../../controllers/admin/vehicle.controller.js'
import { authenticateAdmin, requireAdminCsrf } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'
import { vehicleImagesUpload } from '../../middlewares/upload.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  adminVehicleListQuerySchema,
  createVehicleBodySchema,
  updateVehicleBodySchema,
  updateVehicleFeaturedBodySchema,
  uploadVehicleImagesBodySchema,
  vehicleIdParamsSchema,
  vehicleImageParamsSchema,
} from '../../validators/vehicle.validators.js'

const router = Router()

router.use(authenticateAdmin)
router.use(requireAdminCsrf)

router.get('/', requirePermission('readAdmin'), validateRequest({ query: adminVehicleListQuerySchema }), vehicleController.index)
router.post('/', requirePermission('manageVehicles'), validateRequest({ body: createVehicleBodySchema }), vehicleController.store)
router.get('/:id', requirePermission('readAdmin'), validateRequest({ params: vehicleIdParamsSchema }), vehicleController.show)
router.put('/:id', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema, body: updateVehicleBodySchema }), vehicleController.update)
router.delete('/:id', requirePermission('deleteVehicles'), validateRequest({ params: vehicleIdParamsSchema }), vehicleController.destroy)
router.patch('/:id/publish', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema }), vehicleController.publish)
router.patch('/:id/unpublish', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema }), vehicleController.unpublish)
router.patch('/:id/sold', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema }), vehicleController.markAsSold)
router.patch('/:id/featured', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema, body: updateVehicleFeaturedBodySchema }), vehicleController.toggleFeatured)
router.post('/:id/images', requirePermission('manageVehicles'), validateRequest({ params: vehicleIdParamsSchema }), vehicleImagesUpload.array('images'), validateRequest({ body: uploadVehicleImagesBodySchema }), vehicleController.uploadImages)
router.delete('/:id/images/:imageId', requirePermission('manageVehicles'), validateRequest({ params: vehicleImageParamsSchema }), vehicleController.destroyImage)

export default router
