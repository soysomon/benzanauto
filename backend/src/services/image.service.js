import crypto from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { removeUploadFile, storeUploadFile } from './storage.service.js'
import { Vehicle } from '../models/Vehicle.js'
import { badRequest, notFound } from '../utils/api-error.js'

export async function addVehicleImages(vehicleId, files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    throw badRequest('Debes enviar al menos una imagen.')
  }

  const vehicle = await Vehicle.findById(vehicleId)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  const relativeDirectory = path.posix.join('vehicles', vehicle.id)
  const currentImageCount = vehicle.images.length
  const newImages = []

  for (const [index, file] of files.entries()) {
    const { data, info } = await sharp(file.buffer, {
      limitInputPixels: env.SHARP_LIMIT_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: env.MAX_IMAGE_WIDTH,
        height: env.MAX_IMAGE_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true })

    const filename = `${Date.now()}-${crypto.randomUUID()}.webp`
    const relativePath = path.posix.join(relativeDirectory, filename)
    const storedImage = await storeUploadFile(relativePath, data, {
      contentType: 'image/webp',
    })

    newImages.push({
      url: storedImage.url,
      path: storedImage.path,
      filename,
      width: info.width,
      height: info.height,
      size: info.size,
      mimeType: 'image/webp',
      order: currentImageCount + index,
      isMain: false,
      alt: vehicle.title,
    })
  }

  vehicle.images.push(...newImages)

  const preferredMainIndex = Number.isInteger(options.mainImageIndex)
    ? currentImageCount + options.mainImageIndex
    : null

  syncVehicleMainImage(vehicle, {
    preferredMainImageId: options.mainImageId,
    preferredIndex: preferredMainIndex,
    setAsMain: options.setAsMain,
  })

  await vehicle.save()

  return vehicle
}

export async function removeVehicleImage(vehicleId, imageId) {
  const vehicle = await Vehicle.findById(vehicleId)
  if (!vehicle) throw notFound('Vehiculo no encontrado.')

  const image = vehicle.images.id(imageId)
  if (!image) throw notFound('Imagen no encontrada.')

  const wasMain = image.isMain
  const filePath = image.path

  image.deleteOne()

  if (wasMain) {
    syncVehicleMainImage(vehicle)
  } else {
    normalizeImageOrdering(vehicle)
  }

  await vehicle.save()
  await removeUploadFile(filePath)

  return vehicle
}

export async function removeAllVehicleImages(vehicle) {
  const images = [...vehicle.images]
  vehicle.images = []
  vehicle.mainImage = ''
  await vehicle.save()

  await Promise.all(images.map((image) => removeUploadFile(image.path)))
}

export function normalizeImageOrdering(vehicle, preferredOrderIds = []) {
  const desiredOrder = new Map(preferredOrderIds.map((id, index) => [String(id), index]))
  const sorted = [...vehicle.images].sort((left, right) => {
    const leftOrder = desiredOrder.has(String(left._id)) ? desiredOrder.get(String(left._id)) : left.order
    const rightOrder = desiredOrder.has(String(right._id)) ? desiredOrder.get(String(right._id)) : right.order
    return leftOrder - rightOrder
  })

  sorted.forEach((image, index) => {
    image.order = index
  })

  vehicle.images = sorted
}

export function syncVehicleMainImage(vehicle, options = {}) {
  const { preferredMainImageId = null, preferredIndex = null, setAsMain = false } = options

  if (!vehicle.images.length) {
    vehicle.mainImage = ''
    return
  }

  normalizeImageOrdering(vehicle, [])

  let mainImage = null

  if (preferredMainImageId) {
    mainImage = vehicle.images.id(preferredMainImageId)
  }

  if (!mainImage && Number.isInteger(preferredIndex) && vehicle.images[preferredIndex]) {
    mainImage = vehicle.images[preferredIndex]
  }

  if (!mainImage && setAsMain) {
    mainImage = vehicle.images.at(-1)
  }

  if (!mainImage) {
    mainImage = vehicle.images.find((image) => image.isMain) ?? vehicle.images[0]
  }

  vehicle.images.forEach((image) => {
    image.isMain = String(image._id) === String(mainImage._id)
  })

  vehicle.mainImage = mainImage.url
}
