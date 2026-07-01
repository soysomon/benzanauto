import { Campaign } from '../models/Campaign.js'
import { buildPaginationMeta, getPagination } from '../utils/pagination.js'
import { badRequest, notFound } from '../utils/api-error.js'
import { recordAuditLog } from './audit.service.js'

const DEFAULT_TARGET_ROUTES = Object.freeze(['*'])
const DEFAULT_TARGET_DEVICES = Object.freeze(['desktop', 'tablet', 'mobile'])
const HOMEPAGE_CAMPAIGN_ROUTE = '/'
const PUBLIC_CAMPAIGN_PROJECTION = Object.freeze({
  _id: 1,
  title: 1,
  description: 1,
  image: 1,
  imageAlt: 1,
  ctaText: 1,
  ctaUrl: 1,
  status: 1,
  startAt: 1,
  endAt: 1,
  delaySeconds: 1,
  frequencyRule: 1,
  priority: 1,
  displayType: 1,
  targetRoutes: 1,
  targetDevices: 1,
  activatedAt: 1,
  updatedAt: 1,
})

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeRoutePattern(value = '') {
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '*') return '*'

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function normalizeTargetRoutes(routes = []) {
  const normalized = [...new Set((routes ?? [])
    .map((route) => normalizeRoutePattern(route))
    .filter(Boolean))]

  return normalized.length ? normalized : [...DEFAULT_TARGET_ROUTES]
}

function getModalTargetRoutes() {
  return [HOMEPAGE_CAMPAIGN_ROUTE]
}

function normalizeTargetDevices(devices = []) {
  const normalized = [...new Set((devices ?? [])
    .map((device) => String(device).trim().toLowerCase())
    .filter(Boolean))]

  return normalized.length ? normalized : [...DEFAULT_TARGET_DEVICES]
}

function matchesRoute(targetRoutes = [], currentRoute = '/') {
  const normalizedCurrentRoute = normalizeRoutePattern(currentRoute || '/')
  const routes = normalizeTargetRoutes(targetRoutes)

  return routes.some((routePattern) => {
    if (routePattern === '*') return true

    if (routePattern.endsWith('/*')) {
      const prefix = routePattern.slice(0, -2) || '/'
      return normalizedCurrentRoute === prefix || normalizedCurrentRoute.startsWith(`${prefix}/`)
    }

    return normalizedCurrentRoute === routePattern
  })
}

function matchesDevice(targetDevices = [], currentDevice = '') {
  if (!currentDevice) return true
  const normalizedDevice = String(currentDevice).trim().toLowerCase()
  return normalizeTargetDevices(targetDevices).includes(normalizedDevice)
}

function hasCampaignImage(campaign) {
  return Boolean(campaign?.image?.url)
}

function assertCampaignCanBeActivated(campaign) {
  if (!campaign.title?.trim()) {
    throw badRequest('La campaña necesita un título antes de activarse.')
  }

  if (!campaign.description?.trim()) {
    throw badRequest('La campaña necesita una descripción antes de activarse.')
  }

  if (!hasCampaignImage(campaign)) {
    throw badRequest('La campaña necesita un banner antes de activarse.')
  }

  if (campaign.startAt && campaign.endAt && campaign.endAt <= campaign.startAt) {
    throw badRequest('La fecha de fin debe ser posterior a la fecha de inicio.')
  }

  if ((campaign.ctaText && !campaign.ctaUrl) || (!campaign.ctaText && campaign.ctaUrl)) {
    throw badRequest('CTA requiere texto y URL juntos.')
  }
}

function applyStatusTimestamps(campaign, previousStatus) {
  if (campaign.status === 'active' && previousStatus !== 'active') {
    campaign.activatedAt = new Date()
    campaign.pausedAt = null
    campaign.archivedAt = null
    return
  }

  if (campaign.status === 'paused' && previousStatus !== 'paused') {
    campaign.pausedAt = new Date()
    campaign.archivedAt = null
    return
  }

  if (campaign.status === 'archived' && previousStatus !== 'archived') {
    campaign.archivedAt = new Date()
    return
  }

  if (campaign.status === 'draft') {
    campaign.pausedAt = null
    campaign.archivedAt = null
  }
}

function buildAdminFilter(query = {}) {
  const filter = {}

  if (query.status?.length) {
    filter.status = { $in: query.status }
  }

  if (query.displayType?.length) {
    filter.displayType = { $in: query.displayType }
  }

  if (query.q) {
    const regex = new RegExp(escapeRegExp(query.q), 'i')
    filter.$or = [
      { title: regex },
      { description: regex },
      { ctaText: regex },
      { ctaUrl: regex },
    ]
  }

  return filter
}

function serializeImage(image, fallbackAlt = '') {
  if (!image?.url) return null

  return {
    url: image.url,
    path: image.path,
    filename: image.filename,
    width: image.width,
    height: image.height,
    size: image.size,
    mimeType: image.mimeType,
    alt: image.alt || fallbackAlt,
  }
}

function serializeUserSummary(user) {
  if (!user) return null

  if (typeof user === 'string') {
    return { id: user }
  }

  return {
    id: String(user._id ?? user.id),
    name: user.name ?? '',
    username: user.username ?? '',
  }
}

export function serializeAdminCampaign(campaign) {
  const plain = campaign.toObject ? campaign.toObject() : campaign
  const image = serializeImage(plain.image, plain.imageAlt || plain.title)
  const targetRoutes = plain.displayType === 'modal'
    ? getModalTargetRoutes()
    : normalizeTargetRoutes(plain.targetRoutes)

  return {
    id: String(plain._id),
    title: plain.title,
    description: plain.description,
    image,
    imageUrl: image?.url ?? '',
    imageAlt: plain.imageAlt || image?.alt || plain.title,
    ctaText: plain.ctaText || '',
    ctaUrl: plain.ctaUrl || '',
    status: plain.status,
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    delaySeconds: plain.delaySeconds ?? 3,
    frequencyRule: plain.frequencyRule ?? 'session',
    priority: plain.priority ?? 100,
    displayType: plain.displayType ?? 'modal',
    targetRoutes,
    targetDevices: normalizeTargetDevices(plain.targetDevices),
    createdBy: serializeUserSummary(plain.createdBy),
    updatedBy: serializeUserSummary(plain.updatedBy),
    activatedAt: plain.activatedAt ?? null,
    pausedAt: plain.pausedAt ?? null,
    archivedAt: plain.archivedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  }
}

export function serializePublicCampaign(campaign) {
  const plain = campaign.toObject ? campaign.toObject() : campaign
  const image = serializeImage(plain.image, plain.imageAlt || plain.title)

  if (!image?.url) return null

  return {
    id: String(plain._id),
    title: plain.title,
    description: plain.description,
    imageUrl: image.url,
    imageAlt: plain.imageAlt || image.alt || plain.title,
    ctaText: plain.ctaText || '',
    ctaUrl: plain.ctaUrl || '',
    delaySeconds: plain.delaySeconds ?? 3,
    frequencyRule: plain.frequencyRule ?? 'session',
    displayType: plain.displayType ?? 'modal',
  }
}

export async function listAdminCampaigns(query = {}) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20, maxLimit: 100 })
  const filter = buildAdminFilter(query)

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username'),
    Campaign.countDocuments(filter),
  ])

  return {
    data: campaigns.map(serializeAdminCampaign),
    meta: buildPaginationMeta({ page, limit, total }),
  }
}

export async function getAdminCampaignById(id) {
  const campaign = await Campaign.findById(id)
    .populate('createdBy', 'name username')
    .populate('updatedBy', 'name username')

  if (!campaign) throw notFound('Campaña no encontrada.')
  return serializeAdminCampaign(campaign)
}

export async function createCampaign(payload, actor, context = {}) {
  const campaign = new Campaign({
    title: payload.title,
    description: payload.description,
    imageAlt: payload.imageAlt ?? '',
    ctaText: payload.ctaText ?? '',
    ctaUrl: payload.ctaUrl ?? '',
    status: payload.status ?? 'draft',
    startAt: payload.startAt ?? null,
    endAt: payload.endAt ?? null,
    delaySeconds: payload.delaySeconds ?? 3,
    frequencyRule: payload.frequencyRule ?? 'session',
    priority: payload.priority ?? 100,
    displayType: payload.displayType ?? 'modal',
    targetRoutes: getModalTargetRoutes(),
    targetDevices: normalizeTargetDevices(payload.targetDevices),
    createdBy: actor.id,
    updatedBy: actor.id,
  })

  applyStatusTimestamps(campaign, null)
  if (campaign.status === 'active') {
    assertCampaignCanBeActivated(campaign)
  }

  await campaign.save()

  await recordAuditLog({
    actorId: actor.id,
    action: 'campaign_created',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      campaignId: campaign.id,
      status: campaign.status,
      title: campaign.title,
    },
  })

  return serializeAdminCampaign(campaign)
}

export async function updateCampaign(id, payload, actor, context = {}) {
  const campaign = await Campaign.findById(id)
  if (!campaign) throw notFound('Campaña no encontrada.')

  const previousStatus = campaign.status
  const titleWasUpdated = 'title' in payload

  for (const field of ['title', 'description', 'ctaText', 'ctaUrl', 'delaySeconds', 'frequencyRule', 'priority', 'displayType']) {
    if (field in payload) {
      campaign[field] = payload[field] ?? campaign[field]
    }
  }

  if ('imageAlt' in payload) {
    campaign.imageAlt = payload.imageAlt ?? ''
    if (campaign.image) {
      campaign.image.alt = campaign.imageAlt || campaign.title
    }
  } else if (titleWasUpdated && campaign.image && !campaign.imageAlt) {
    campaign.image.alt = campaign.title
  }

  if ('status' in payload) {
    campaign.status = payload.status
  }

  if ('startAt' in payload) {
    campaign.startAt = payload.startAt ?? null
  }

  if ('endAt' in payload) {
    campaign.endAt = payload.endAt ?? null
  }

  if ('targetRoutes' in payload) {
    campaign.targetRoutes = getModalTargetRoutes()
  }

  if ('targetDevices' in payload) {
    campaign.targetDevices = normalizeTargetDevices(payload.targetDevices)
  }

  if (campaign.displayType === 'modal') {
    campaign.targetRoutes = getModalTargetRoutes()
  }

  campaign.updatedBy = actor.id
  applyStatusTimestamps(campaign, previousStatus)

  if (campaign.status === 'active') {
    assertCampaignCanBeActivated(campaign)
  }

  await campaign.save()

  await recordAuditLog({
    actorId: actor.id,
    action: 'campaign_updated',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      campaignId: campaign.id,
      fields: Object.keys(payload),
      status: campaign.status,
    },
  })

  return serializeAdminCampaign(campaign)
}

export async function updateCampaignStatus(id, status, actor, context = {}) {
  const campaign = await Campaign.findById(id)
  if (!campaign) throw notFound('Campaña no encontrada.')

  const previousStatus = campaign.status
  campaign.status = status
  campaign.updatedBy = actor.id
  applyStatusTimestamps(campaign, previousStatus)

  if (campaign.status === 'active') {
    assertCampaignCanBeActivated(campaign)
  }

  await campaign.save()

  await recordAuditLog({
    actorId: actor.id,
    action: 'campaign_status_changed',
    ip: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      campaignId: campaign.id,
      previousStatus,
      nextStatus: status,
    },
  })

  return serializeAdminCampaign(campaign)
}

export async function getActiveCampaignForContext(query = {}) {
  const now = new Date()
  const currentRoute = normalizeRoutePattern(query.route || '/')
  const currentDevice = query.device ? String(query.device).trim().toLowerCase() : ''

  const candidates = await Campaign.find({
    status: 'active',
    'image.url': { $exists: true, $ne: '' },
    $and: [
      {
        $or: [
          { startAt: null },
          { startAt: { $lte: now } },
        ],
      },
      {
        $or: [
          { endAt: null },
          { endAt: { $gte: now } },
        ],
      },
    ],
  }, PUBLIC_CAMPAIGN_PROJECTION)
    .sort({ priority: -1, activatedAt: -1, updatedAt: -1 })
    .limit(25)
    .lean()

  const match = candidates.find((campaign) =>
    (campaign.displayType === 'modal'
      ? currentRoute === HOMEPAGE_CAMPAIGN_ROUTE
      : matchesRoute(campaign.targetRoutes, currentRoute))
    && matchesDevice(campaign.targetDevices, currentDevice))

  return match ? serializePublicCampaign(match) : null
}
