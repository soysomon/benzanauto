import { Router } from 'express'
import * as campaignController from '../../controllers/admin/campaign.controller.js'
import { authenticateAdmin, requireAdminCsrf } from '../../middlewares/auth.middleware.js'
import { requirePermission } from '../../middlewares/authorize.middleware.js'
import { campaignBannerUpload } from '../../middlewares/upload.middleware.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import {
  adminCampaignListQuerySchema,
  campaignIdParamsSchema,
  createCampaignBodySchema,
  updateCampaignBodySchema,
  updateCampaignStatusBodySchema,
  uploadCampaignImageBodySchema,
} from '../../validators/campaign.validators.js'

const router = Router()

router.use(authenticateAdmin)
router.use(requireAdminCsrf)

router.get('/', requirePermission('manageCampaigns'), validateRequest({ query: adminCampaignListQuerySchema }), campaignController.index)
router.post('/', requirePermission('manageCampaigns'), validateRequest({ body: createCampaignBodySchema }), campaignController.store)
router.get('/:id', requirePermission('manageCampaigns'), validateRequest({ params: campaignIdParamsSchema }), campaignController.show)
router.put('/:id', requirePermission('manageCampaigns'), validateRequest({ params: campaignIdParamsSchema, body: updateCampaignBodySchema }), campaignController.update)
router.patch('/:id/status', requirePermission('manageCampaigns'), validateRequest({ params: campaignIdParamsSchema, body: updateCampaignStatusBodySchema }), campaignController.updateStatus)
router.post('/:id/image', requirePermission('manageCampaigns'), validateRequest({ params: campaignIdParamsSchema }), campaignBannerUpload.single('image'), validateRequest({ body: uploadCampaignImageBodySchema }), campaignController.uploadImage)
router.delete('/:id/image', requirePermission('manageCampaigns'), validateRequest({ params: campaignIdParamsSchema }), campaignController.destroyImage)

export default router
