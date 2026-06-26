import { asyncHandler } from '../../utils/async-handler.js'
import {
  createVehicle,
  deleteVehicle,
  getAdminVehicleById,
  listAdminVehicles,
  markVehicleAsSold,
  publishVehicle,
  unpublishVehicle,
  updateVehicle,
  updateVehicleFeatured,
} from '../../services/vehicle.service.js'
import { addVehicleImages, removeVehicleImage } from '../../services/image.service.js'

export const index = asyncHandler(async (req, res) => {
  const response = await listAdminVehicles(req.validated.query)
  res.json(response)
})

export const store = asyncHandler(async (req, res) => {
  const vehicle = await createVehicle(req.validated.body, req.auth.user)
  res.status(201).json({
    message: 'Vehiculo creado correctamente.',
    vehicle,
  })
})

export const show = asyncHandler(async (req, res) => {
  const vehicle = await getAdminVehicleById(req.validated.params.id)
  res.json({ vehicle })
})

export const update = asyncHandler(async (req, res) => {
  const vehicle = await updateVehicle(req.validated.params.id, req.validated.body, req.auth.user)
  res.json({
    message: 'Vehiculo actualizado correctamente.',
    vehicle,
  })
})

export const destroy = asyncHandler(async (req, res) => {
  await deleteVehicle(req.validated.params.id)
  res.status(204).send()
})

export const publish = asyncHandler(async (req, res) => {
  const vehicle = await publishVehicle(req.validated.params.id, req.auth.user)
  res.json({
    message: 'Vehiculo publicado correctamente.',
    vehicle,
  })
})

export const unpublish = asyncHandler(async (req, res) => {
  const vehicle = await unpublishVehicle(req.validated.params.id, req.auth.user)
  res.json({
    message: 'Vehiculo movido a borrador.',
    vehicle,
  })
})

export const markAsSold = asyncHandler(async (req, res) => {
  const vehicle = await markVehicleAsSold(req.validated.params.id, req.auth.user)
  res.json({
    message: 'Vehiculo marcado como vendido.',
    vehicle,
  })
})

export const toggleFeatured = asyncHandler(async (req, res) => {
  const vehicle = await updateVehicleFeatured(req.validated.params.id, req.validated.body.featured, req.auth.user)
  res.json({
    message: 'Estado destacado actualizado.',
    vehicle,
  })
})

export const uploadImages = asyncHandler(async (req, res) => {
  const vehicle = await addVehicleImages(req.validated.params.id, req.files, {
    ...req.validated.body,
  })

  res.status(201).json({
    message: 'Imagenes cargadas correctamente.',
    vehicle,
  })
})

export const destroyImage = asyncHandler(async (req, res) => {
  const vehicle = await removeVehicleImage(req.validated.params.id, req.validated.params.imageId)
  res.json({
    message: 'Imagen eliminada correctamente.',
    vehicle,
  })
})

