import crypto from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import { Campaign } from '../models/Campaign.js'
import { env } from '../config/env.js'
import { badRequest, notFound } from '../utils/api-error.js'
import { removeUploadFile, storeUploadFile } from './storage.service.js'
import { recordAuditLog } from './audit.service.js'
import { serializeAdminCampaign } from './campaign.service.js'

export async function uploadCampaignImage(campaignId, file, actor, context = {}, options = {}) {
  if (!file) {
    throw badRequest('Debes seleccionar una imagen para la campaña.')
  }

  const campaign = await Campaign.findById(campaignId)
  if (!campaign) throw notFound('Campaña no encontrada.')

  const { data, info } = await sharp(file.buffer, {
    limitInputPixels: env.SHARP_LIMIT_INPUT_PIXELS,
  })
    .rotate()
    .resize({
      width: Math.min(env.MAX_IMAGE_WIDTH, 1800),
      height: Math.min(env.MAX_IMAGE_HEIGHT, 1800),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true })

  const filename = `${Date.now()}-${crypto.randomUUID()}.webp`
  const relativePath = path.posix.join('campaigns', campaign.id, filename)
  const storedImage = await storeUploadFile(relativePath, data, {
    contentType: 'image/webp',
  })

  const previousImagePath = campaign.image?.path ?? ''
  const altText = options.imageAlt ?? campaign.imageAlt ?? campaign.title

  campaign.image = {
    url: storedImage.url,
    path: storedImage.path,
    filename,
    width: info.width,
    height: info.height,
    size: info.size,
    mimeType: 'image/webp',
    alt: altText,
  }
  campaign.imageAlt = altText
  campaign.updatedBy = actor.id
  await campaign.save()

  if (previousImagePath && previousImagePath !== storedImage.path) {
    await removeUploadFile(previousImagePath)
  }

  await recordAuditLog({
    actorId: actor.id,
    action: 'campaign_image_uploaded',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      campaignId: campaign.id,
      filename,
    },
  })

  return serializeAdminCampaign(campaign)
}

export async function removeCampaignImage(campaignId, actor, context = {}) {
  const campaign = await Campaign.findById(campaignId)
  if (!campaign) throw notFound('Campaña no encontrada.')

  if (!campaign.image?.path) {
    throw badRequest('La campaña no tiene imagen para eliminar.')
  }

  if (campaign.status === 'active') {
    throw badRequest('Pausa o devuelve la campaña a borrador antes de quitar la imagen.')
  }

  const previousImagePath = campaign.image.path
  campaign.image = null
  campaign.updatedBy = actor.id
  await campaign.save()
  await removeUploadFile(previousImagePath)

  await recordAuditLog({
    actorId: actor.id,
    action: 'campaign_image_removed',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      campaignId: campaign.id,
    },
  })

  return serializeAdminCampaign(campaign)
}
