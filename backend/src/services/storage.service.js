import { DeleteObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const STORAGE_DRIVERS = Object.freeze({
  LOCAL: 'local',
  S3: 's3',
  EXTERNAL: 'external',
})
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const uploadsUrl = new URL('../../uploads/', import.meta.url)
let s3Client = null

export const UPLOADS_ROOT = fileURLToPath(uploadsUrl)

export async function ensureUploadDirectory(relativeDirectory = '') {
  if (!usesLocalUploadStorage()) return null

  const absoluteDirectory = path.join(UPLOADS_ROOT, relativeDirectory)
  await fs.mkdir(absoluteDirectory, { recursive: true })
  return absoluteDirectory
}

export function usesLocalUploadStorage() {
  return env.STORAGE_DRIVER === STORAGE_DRIVERS.LOCAL
}

export function usesS3UploadStorage() {
  return env.STORAGE_DRIVER === STORAGE_DRIVERS.S3
}

export function buildUploadUrl(storedPath) {
  const { driver, relativePath } = parseStoredPath(storedPath)
  if (!relativePath) return ''
  if (driver === STORAGE_DRIVERS.EXTERNAL) return relativePath

  const publicBaseUrl = getPublicUploadBaseUrl()
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${relativePath}`
  }

  return `/uploads/${relativePath}`
}

export function getAbsoluteUploadPath(storedPath) {
  const { relativePath } = parseStoredPath(storedPath)
  return path.join(UPLOADS_ROOT, relativePath)
}

export async function storeUploadFile(relativePath, data, options = {}) {
  const normalizedPath = normalizeRelativePath(relativePath)
  if (!normalizedPath) {
    throw new Error('No se pudo resolver la ruta del archivo a guardar.')
  }

  if (usesS3UploadStorage()) {
    await getS3Client().send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: normalizedPath,
      Body: data,
      ContentType: options.contentType ?? 'application/octet-stream',
      CacheControl: options.cacheControl ?? IMMUTABLE_CACHE_CONTROL,
    }))

    const storedPath = buildStoredPath(normalizedPath, STORAGE_DRIVERS.S3)
    return {
      path: storedPath,
      url: buildUploadUrl(storedPath),
    }
  }

  const absolutePath = getAbsoluteUploadPath(normalizedPath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, data)

  return {
    path: normalizedPath,
    url: buildUploadUrl(normalizedPath),
  }
}

export async function removeUploadFile(storedPath) {
  if (!storedPath) return

  const { driver, relativePath } = parseStoredPath(storedPath)
  if (!relativePath || driver === STORAGE_DRIVERS.EXTERNAL) return

  if (driver === STORAGE_DRIVERS.S3) {
    await getS3Client().send(new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: relativePath,
    }))
    return
  }

  try {
    await fs.unlink(getAbsoluteUploadPath(relativePath))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

function getS3Client() {
  if (s3Client) return s3Client

  s3Client = new S3Client({
    region: env.S3_REGION,
    endpoint: hasValue(env.S3_ENDPOINT) ? env.S3_ENDPOINT.trim() : undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  })

  return s3Client
}

function parseStoredPath(storedPath) {
  const rawPath = String(storedPath ?? '')

  if (rawPath.startsWith('external:')) {
    return {
      driver: STORAGE_DRIVERS.EXTERNAL,
      relativePath: rawPath.slice('external:'.length),
    }
  }

  if (rawPath.startsWith('s3:')) {
    return {
      driver: STORAGE_DRIVERS.S3,
      relativePath: normalizeRelativePath(rawPath.slice(3)),
    }
  }

  if (rawPath.startsWith('local:')) {
    return {
      driver: STORAGE_DRIVERS.LOCAL,
      relativePath: normalizeRelativePath(rawPath.slice(6)),
    }
  }

  return {
    driver: STORAGE_DRIVERS.LOCAL,
    relativePath: normalizeRelativePath(rawPath),
  }
}

function buildStoredPath(relativePath, driver) {
  const normalizedPath = normalizeRelativePath(relativePath)

  switch (driver) {
    case STORAGE_DRIVERS.S3:
      return `s3:${normalizedPath}`
    case STORAGE_DRIVERS.LOCAL:
    default:
      return normalizedPath
  }
}

function getPublicUploadBaseUrl() {
  if (hasValue(env.UPLOADS_BASE_URL)) {
    return env.UPLOADS_BASE_URL.trim().replace(/\/$/, '')
  }

  if (usesS3UploadStorage()) {
    if (hasValue(env.S3_PUBLIC_BASE_URL)) {
      return env.S3_PUBLIC_BASE_URL.trim().replace(/\/$/, '')
    }

    if (!hasValue(env.S3_ENDPOINT)) {
      return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`
    }
  }

  return ''
}

function normalizeRelativePath(value) {
  return String(value ?? '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}
