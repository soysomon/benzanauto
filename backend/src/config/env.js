import 'dotenv/config'
import { z } from 'zod'

const parseInteger = (fallback) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') return fallback
      const parsed = Number.parseInt(String(value), 10)
      return Number.isFinite(parsed) ? parsed : value
    }, z.number().int().positive())

const parseBoolean = (fallback) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return fallback
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
      if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
    }

    return value
  }, z.boolean())

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: parseInteger(4000).default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es obligatorio.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres.'),
  JWT_EXPIRES_IN: z.string().min(2).default('12h'),
  FRONTEND_URL: z.string().optional().default(''),
  FRONTEND_ADMIN_URL: z.string().optional().default(''),
  FRONTEND_URLS: z.string().optional().default(''),
  TRUST_PROXY: parseBoolean(false).default(false),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  API_RATE_LIMIT_WINDOW_MS: parseInteger(60_000).default(60_000),
  API_RATE_LIMIT_MAX: parseInteger(120).default(120),
  PUBLIC_CATALOG_RATE_LIMIT_WINDOW_MS: parseInteger(60_000).default(60_000),
  PUBLIC_CATALOG_RATE_LIMIT_MAX: parseInteger(600).default(600),
  LOGIN_RATE_LIMIT_WINDOW_MS: parseInteger(900_000).default(900_000),
  LOGIN_RATE_LIMIT_MAX: parseInteger(8).default(8),
  FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS: parseInteger(900_000).default(900_000),
  FORGOT_PASSWORD_RATE_LIMIT_MAX: parseInteger(5).default(5),
  RESET_PASSWORD_RATE_LIMIT_WINDOW_MS: parseInteger(900_000).default(900_000),
  RESET_PASSWORD_RATE_LIMIT_MAX: parseInteger(10).default(10),
  MAX_FAILED_LOGIN_ATTEMPTS: parseInteger(5).default(5),
  ACCOUNT_LOCK_MINUTES: parseInteger(15).default(15),
  PASSWORD_MIN_LENGTH: parseInteger(12).default(12),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: parseInteger(15).default(15),
  PASSWORD_RESET_REQUEST_MIN_INTERVAL_MS: parseInteger(60_000).default(60_000),
  JSON_BODY_LIMIT: z.string().default('1mb'),
  URLENCODED_LIMIT: z.string().default('1mb'),
  UPLOAD_MAX_FILE_SIZE_MB: parseInteger(5).default(5),
  UPLOAD_MAX_FILES: parseInteger(10).default(10),
  MAX_IMAGE_WIDTH: parseInteger(2400).default(2400),
  MAX_IMAGE_HEIGHT: parseInteger(2400).default(2400),
  SHARP_LIMIT_INPUT_PIXELS: parseInteger(50_000_000).default(50_000_000),
  UPLOADS_BASE_URL: z.string().optional().default(''),
  S3_BUCKET: z.string().optional().default(''),
  S3_REGION: z.string().optional().default(''),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_FORCE_PATH_STYLE: parseBoolean(false).default(false),
  S3_PUBLIC_BASE_URL: z.string().optional().default(''),
  SUPERADMIN_NAME: z.string().optional().default(''),
  SUPERADMIN_USERNAME: z.string().optional().default(''),
  SUPERADMIN_EMAIL: z.string().optional().default(''),
  SUPERADMIN_PASSWORD: z.string().optional().default(''),
  SEED_DEMO_VEHICLES: parseBoolean(false).default(false),
  EMAIL_PROVIDER: z.enum(['disabled', 'smtp']).default('disabled'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: parseInteger(587).default(587),
  SMTP_SECURE: parseBoolean(false).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  AI_TIMEOUT_MS: parseInteger(12_000).default(12_000),
  CHAT_INVENTORY_CACHE_MS: parseInteger(15_000).default(15_000),
}).superRefine((config, ctx) => {
  if (config.STORAGE_DRIVER !== 's3') return

  for (const [key, message] of [
    ['S3_BUCKET', 'S3_BUCKET es obligatorio cuando STORAGE_DRIVER=s3.'],
    ['S3_REGION', 'S3_REGION es obligatorio cuando STORAGE_DRIVER=s3.'],
    ['S3_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID es obligatorio cuando STORAGE_DRIVER=s3.'],
    ['S3_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY es obligatorio cuando STORAGE_DRIVER=s3.'],
  ]) {
    if (!hasValue(config[key])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message,
      })
    }
  }

  if (
    hasValue(config.S3_ENDPOINT)
    && !hasValue(config.UPLOADS_BASE_URL)
    && !hasValue(config.S3_PUBLIC_BASE_URL)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['S3_PUBLIC_BASE_URL'],
      message: 'S3_PUBLIC_BASE_URL o UPLOADS_BASE_URL es obligatorio cuando STORAGE_DRIVER=s3 usa un endpoint custom.',
    })
  }
}).superRefine((config, ctx) => {
  if (config.EMAIL_PROVIDER !== 'smtp') return

  for (const [key, message] of [
    ['SMTP_HOST', 'SMTP_HOST es obligatorio cuando EMAIL_PROVIDER=smtp.'],
    ['SMTP_USER', 'SMTP_USER es obligatorio cuando EMAIL_PROVIDER=smtp.'],
    ['SMTP_PASS', 'SMTP_PASS es obligatorio cuando EMAIL_PROVIDER=smtp.'],
    ['EMAIL_FROM', 'EMAIL_FROM es obligatorio cuando EMAIL_PROVIDER=smtp.'],
  ]) {
    if (!hasValue(config[key])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message,
      })
    }
  }
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
  throw new Error(`Configuracion invalida del entorno.\n${issues}`)
}

export const env = Object.freeze(parsed.data)

export function isProduction() {
  return env.NODE_ENV === 'production'
}

export function isTest() {
  return env.NODE_ENV === 'test'
}
