import { Router } from 'express'
import * as campaignController from '../../controllers/public/campaign.controller.js'
import { validateRequest } from '../../middlewares/validate.middleware.js'
import { publicCampaignQuerySchema } from '../../validators/campaign.validators.js'

const router = Router()

router.get('/active', validateRequest({ query: publicCampaignQuerySchema }), campaignController.active)

export default router
