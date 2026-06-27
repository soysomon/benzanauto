import { asyncHandler } from '../../utils/async-handler.js'
import {
  getPublicVehicleBySlug,
  incrementPublicVehicleContact,
  listFeaturedVehicles,
  listPublicVehicles,
} from '../../services/vehicle.service.js'

function setCatalogCacheHeaders(res, { maxAge = 30, staleWhileRevalidate = 120 } = {}) {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
  res.setHeader('Vary', 'Origin, Accept-Encoding')
}

export const index = asyncHandler(async (req, res) => {
  const response = await listPublicVehicles(req.validated.query)
  setCatalogCacheHeaders(res, { maxAge: 30, staleWhileRevalidate: 180 })
  res.json(response)
})

export const featured = asyncHandler(async (_req, res) => {
  const vehicles = await listFeaturedVehicles()
  setCatalogCacheHeaders(res, { maxAge: 60, staleWhileRevalidate: 300 })
  res.json({ data: vehicles })
})

export const show = asyncHandler(async (req, res) => {
  const vehicle = await getPublicVehicleBySlug(req.validated.params.slug, {
    ipAddress: req.ip,
  })

  setCatalogCacheHeaders(res, { maxAge: 60, staleWhileRevalidate: 300 })
  res.json({ vehicle })
})

export const contact = asyncHandler(async (req, res) => {
  const result = await incrementPublicVehicleContact(req.validated.params.slug)
  res.status(200).json(result)
})
