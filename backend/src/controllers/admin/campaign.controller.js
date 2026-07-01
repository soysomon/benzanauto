import { asyncHandler } from '../../utils/async-handler.js'
import {
  createCampaign,
  getAdminCampaignById,
  listAdminCampaigns,
  updateCampaign,
  updateCampaignStatus,
} from '../../services/campaign.service.js'
import { removeCampaignImage, uploadCampaignImage } from '../../services/campaign-media.service.js'

function getActorContext(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }
}

export const index = asyncHandler(async (req, res) => {
  const response = await listAdminCampaigns(req.validated.query)
  res.json(response)
})

export const store = asyncHandler(async (req, res) => {
  const campaign = await createCampaign(req.validated.body, req.auth.user, getActorContext(req))
  res.status(201).json({
    message: 'Campaña creada correctamente.',
    campaign,
  })
})

export const show = asyncHandler(async (req, res) => {
  const campaign = await getAdminCampaignById(req.validated.params.id)
  res.json({ campaign })
})

export const update = asyncHandler(async (req, res) => {
  const campaign = await updateCampaign(req.validated.params.id, req.validated.body, req.auth.user, getActorContext(req))
  res.json({
    message: 'Campaña actualizada correctamente.',
    campaign,
  })
})

export const updateStatus = asyncHandler(async (req, res) => {
  const campaign = await updateCampaignStatus(
    req.validated.params.id,
    req.validated.body.status,
    req.auth.user,
    getActorContext(req),
  )

  res.json({
    message: 'Estado de campaña actualizado correctamente.',
    campaign,
  })
})

export const uploadImage = asyncHandler(async (req, res) => {
  const campaign = await uploadCampaignImage(
    req.validated.params.id,
    req.file,
    req.auth.user,
    getActorContext(req),
    req.validated.body,
  )

  res.status(201).json({
    message: 'Banner cargado correctamente.',
    campaign,
  })
})

export const destroyImage = asyncHandler(async (req, res) => {
  const campaign = await removeCampaignImage(req.validated.params.id, req.auth.user, getActorContext(req))
  res.json({
    message: 'Banner eliminado correctamente.',
    campaign,
  })
})
