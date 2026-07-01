import multer from 'multer'
import { env } from '../config/env.js'
import { badRequest } from '../utils/api-error.js'

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function imageFileFilter(_req, file, callback) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return callback(badRequest('Solo se permiten imagenes JPG, PNG o WebP.'))
  }

  return callback(null, true)
}

function buildMemoryImageUpload({ files = env.UPLOAD_MAX_FILES } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
      files,
    },
    fileFilter: imageFileFilter,
  })
}

export const vehicleImagesUpload = buildMemoryImageUpload({
  files: env.UPLOAD_MAX_FILES,
})

export const campaignBannerUpload = buildMemoryImageUpload({
  files: 1,
})
