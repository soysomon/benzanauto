import mongoose from 'mongoose'
import multer from 'multer'
import { ZodError } from 'zod'
import { ApiError, validationError } from '../utils/api-error.js'
import { isProduction } from '../config/env.js'

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Ruta no encontrada.'))
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
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

    if (!isProduction() && req.originalUrl.startsWith('/api/admin/vehicles')) {
      console.error('[Zod Validation Debug]', {
        method: req.method,
        path: req.originalUrl,
        body: req.body,
        fieldErrors,
        issues: err.issues,
      })
    }

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
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'El identificador solicitado no es valido.',
        requestId: req.requestId,
      },
    })
  }

  if (err?.code === 11000) {
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
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'La solicitud excede el tamano permitido.',
        requestId: req.requestId,
      },
    })
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la solicitud no es JSON valido.',
        requestId: req.requestId,
      },
    })
  }

  console.error('[Unhandled Server Error]', err)

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
