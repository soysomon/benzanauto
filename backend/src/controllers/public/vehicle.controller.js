import { asyncHandler } from '../../utils/async-handler.js'
import {
  getPublicVehicleBySlug,
  incrementPublicVehicleContact,
  listFeaturedVehicles,
  listPublicVehicles,
} from '../../services/vehicle.service.js'

export const index = asyncHandler(async (req, res) => {
  const response = await listPublicVehicles(req.validated.query)
  res.json(response)
})

export const featured = asyncHandler(async (_req, res) => {
  const vehicles = await listFeaturedVehicles()
  res.json({ data: vehicles })
})

export const show = asyncHandler(async (req, res) => {
  const vehicle = await getPublicVehicleBySlug(req.validated.params.slug, {
    ipAddress: req.ip,
  })

  res.json({ vehicle })
})

export const contact = asyncHandler(async (req, res) => {
  const result = await incrementPublicVehicleContact(req.validated.params.slug)
  res.status(200).json(result)
})
