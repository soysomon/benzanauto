import mongoose from 'mongoose'
import multer from 'multer'
import { ZodError } from 'zod'
import { ApiError, validationError } from '../utils/api-error.js'
import { isProduction } from '../config/env.js'
import { logger } from '../utils/logger.js'

const errorLogger = logger.child({ scope: 'error-handler' })

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Ruta no encontrada.'))
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      errorLogger.error('api_error_response', {
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      })
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined,
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors
    const normalized = validationError(fieldErrors)

    errorLogger.warn('request_validation_failed', {
      code: normalized.code,
      method: req.method,
      path: req.originalUrl,
      fieldErrors,
      issues: err.issues.map((issue) => ({
        path: issue.path,
        code: issue.code,
        message: issue.message,
      })),
      request: {
        params: req.params,
        query: req.query,
        body: req.body,
      },
    })

    return res.status(normalized.statusCode).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof multer.MulterError) {
    errorLogger.warn('upload_validation_failed', {
      code: err.code,
      field: err.field,
      method: req.method,
      path: req.originalUrl,
    })

    return res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message: translateMulterError(err),
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fieldErrors = Object.fromEntries(
      Object.entries(err.errors).map(([field, value]) => [field, [value.message]]),
    )

    errorLogger.warn('mongoose_validation_failed', {
      method: req.method,
      path: req.originalUrl,
      fieldErrors,
      request: {
        params: req.params,
        query: req.query,
        body: req.body,
      },
    })

    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Hay campos invalidos en la solicitud.',
        details: { fieldErrors },
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof mongoose.Error.CastError) {
    errorLogger.warn('mongoose_cast_error', {
      method: req.method,
      path: req.originalUrl,
      value: err.value,
      kind: err.kind,
      pathName: err.path,
    })

    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'El identificador solicitado no es valido.',
        requestId: req.requestId,
      },
    })
  }

  if (err?.code === 11000) {
    errorLogger.warn('duplicate_key_rejected', {
      method: req.method,
      path: req.originalUrl,
      keyPattern: err.keyPattern ?? {},
      keyValue: err.keyValue ?? {},
    })

    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'Ya existe un registro con uno de los valores unicos enviados.',
        details: {
          keys: Object.keys(err.keyPattern ?? {}),
        },
        requestId: req.requestId,
      },
    })
  }

  if (err?.type === 'entity.too.large') {
    errorLogger.warn('request_payload_too_large', {
      method: req.method,
      path: req.originalUrl,
      limit: err.limit,
      length: err.length,
      received: err.received,
    })

    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'La solicitud excede el tamano permitido.',
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof SyntaxError && 'body' in err) {
    errorLogger.warn('invalid_json_body', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
    })

    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la solicitud no es JSON valido.',
        requestId: req.requestId,
      },
    })
  }

  errorLogger.error('unhandled_server_error', {
    error: err,
    method: req.method,
    path: req.originalUrl,
    request: {
      params: req.params,
      query: req.query,
      body: req.body,
    },
  })

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor.',
      requestId: req.requestId,
      ...(isProduction() ? {} : { stack: err?.stack }),
    },
  })
}

function translateMulterError(error) {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'Uno de los archivos excede el tamano maximo permitido.'
    case 'LIMIT_FILE_COUNT':
      return 'Se excedio la cantidad maxima de archivos permitidos.'
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Se recibio un archivo en un campo no permitido.'
    default:
      return 'No se pudo procesar la carga del archivo.'
  }
}
