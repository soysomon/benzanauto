export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function badRequest(message, details) {
  return new ApiError(400, 'BAD_REQUEST', message, details)
}

export function unauthorized(message = 'No autorizado.') {
  return new ApiError(401, 'UNAUTHORIZED', message)
}

export function forbidden(message = 'No tienes permisos para realizar esta accion.') {
  return new ApiError(403, 'FORBIDDEN', message)
}

export function notFound(message = 'Recurso no encontrado.') {
  return new ApiError(404, 'NOT_FOUND', message)
}

export function conflict(message, details) {
  return new ApiError(409, 'CONFLICT', message, details)
}

export function validationError(fieldErrors, message = 'Hay campos invalidos en la solicitud.') {
  return new ApiError(422, 'VALIDATION_ERROR', message, { fieldErrors })
}

