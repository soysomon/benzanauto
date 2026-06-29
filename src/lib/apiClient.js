import {
  getStoredAdminCsrfToken,
  isCookieBackedAdminSessionToken,
} from './adminSession'

const REQUEST_TIMEOUT_MS = 15_000
const UNAUTHORIZED_EVENT_NAME = 'benzan:admin-unauthorized'
const ADMIN_CSRF_HEADER_NAME = 'X-CSRF-Token'

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string') return ''

  const trimmed = baseUrl.trim().replace(/\/$/, '')
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed

  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`
  }

  return `https://${trimmed}`
}

function getApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  if (!configuredBaseUrl) return '/api'
  return configuredBaseUrl.endsWith('/api') ? configuredBaseUrl : `${configuredBaseUrl}/api`
}

function buildRequestUrl(path, searchParams) {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (baseUrl.startsWith('http')) {
    const url = new URL(`${baseUrl}${normalizedPath}`)
    appendSearchParams(url.searchParams, searchParams)
    return url.toString()
  }

  const url = new URL(`${baseUrl}${normalizedPath}`, window.location.origin)
  appendSearchParams(url.searchParams, searchParams)
  return `${url.pathname}${url.search}`
}

function appendSearchParams(urlSearchParams, searchParams) {
  if (!searchParams) return

  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    if (Array.isArray(rawValue)) {
      rawValue
        .filter((value) => value !== undefined && value !== null && value !== '')
        .forEach((value) => urlSearchParams.append(key, String(value)))
      continue
    }

    urlSearchParams.set(key, String(rawValue))
  }
}

function isAdminApiPath(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return normalizedPath.startsWith('/admin/')
}

function shouldIncludeCredentials(path) {
  return isAdminApiPath(path)
}

function shouldAttachCsrfToken(path, method) {
  if (!isAdminApiPath(path)) return false

  const normalizedMethod = String(method ?? 'GET').toUpperCase()
  return !['GET', 'HEAD', 'OPTIONS'].includes(normalizedMethod)
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

function parseRawResponseBody(rawBody, contentType = '') {
  if (!rawBody) return null

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody)
    } catch {
      return { message: rawBody }
    }
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    return { message: rawBody }
  }
}

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = null, request = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.request = request
  }
}

function emitUnauthorizedEvent(request) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT_NAME, {
    detail: {
      request,
      occurredAt: new Date().toISOString(),
    },
  }))
}

function buildRequestMeta({ method, path, token, searchParams, body }) {
  const request = {
    method,
    path,
    url: buildRequestUrl(path, searchParams),
    hasAuthorization: Boolean(token && !isCookieBackedAdminSessionToken(token)),
    usesCredentials: shouldIncludeCredentials(path),
  }

  if (!body) return request

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    request.body = {
      type: 'form-data',
      fields: [...new Set(Array.from(body.keys()))],
    }
    return request
  }

  if (typeof body === 'string') {
    request.body = {
      type: 'text',
      length: body.length,
    }
    return request
  }

  if (body instanceof Blob) {
    request.body = {
      type: 'blob',
      size: body.size,
    }
    return request
  }

  if (typeof body === 'object') {
    request.body = {
      type: 'json',
      keys: Object.keys(body),
    }
  }

  return request
}

export async function apiRequest(path, {
  method = 'GET',
  token,
  headers = {},
  body,
  searchParams,
  signal,
  keepalive = false,
} = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const finalHeaders = new Headers(headers)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const requestMeta = buildRequestMeta({ method, path, token, searchParams, body })
  const includeCredentials = shouldIncludeCredentials(path)
  const csrfToken = shouldAttachCsrfToken(path, method) ? getStoredAdminCsrfToken() : ''

  if (token && !isCookieBackedAdminSessionToken(token)) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (csrfToken && !finalHeaders.has(ADMIN_CSRF_HEADER_NAME)) {
    finalHeaders.set(ADMIN_CSRF_HEADER_NAME, csrfToken)
  }

  let requestBody = body
  if (body && !isFormData && !(body instanceof Blob) && typeof body !== 'string') {
    finalHeaders.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  try {
    const response = await fetch(buildRequestUrl(path, searchParams), {
      method,
      headers: finalHeaders,
      body: requestBody,
      keepalive,
      credentials: includeCredentials ? 'include' : 'same-origin',
      signal: signal ?? controller.signal,
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      const errorPayload = data?.error
      if (response.status === 401 && (token || includeCredentials)) {
        emitUnauthorizedEvent(requestMeta)
      }
      throw new ApiError(
        errorPayload?.message ?? data?.message ?? 'No se pudo completar la solicitud.',
        {
          status: response.status,
          code: errorPayload?.code,
          details: errorPayload?.details ?? null,
          request: requestMeta,
        },
      )
    }

    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Intenta de nuevo.', {
        status: 408,
        code: 'REQUEST_TIMEOUT',
      })
    }

    if (error instanceof ApiError) throw error

    throw new ApiError(error?.message ?? 'Error inesperado de red.', {
      status: 500,
      code: 'NETWORK_ERROR',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export function apiUploadRequest(path, {
  method = 'POST',
  token,
  headers = {},
  body,
  onProgress,
} = {}) {
  return new Promise((resolve, reject) => {
    const requestMeta = buildRequestMeta({ method, path, token, body })
    const xhr = new XMLHttpRequest()
    const includeCredentials = shouldIncludeCredentials(path)
    const csrfToken = shouldAttachCsrfToken(path, method) ? getStoredAdminCsrfToken() : ''
    xhr.open(method, buildRequestUrl(path))
    xhr.timeout = REQUEST_TIMEOUT_MS
    xhr.withCredentials = includeCredentials

    const finalHeaders = new Headers(headers)
    if (token && !isCookieBackedAdminSessionToken(token)) {
      finalHeaders.set('Authorization', `Bearer ${token}`)
    }

    if (csrfToken && !finalHeaders.has(ADMIN_CSRF_HEADER_NAME)) {
      finalHeaders.set(ADMIN_CSRF_HEADER_NAME, csrfToken)
    }

    for (const [headerName, headerValue] of finalHeaders.entries()) {
      xhr.setRequestHeader(headerName, headerValue)
    }

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        onProgress(Math.round((event.loaded / event.total) * 100), event)
      }
    }

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader('content-type') ?? ''
      const data = parseRawResponseBody(xhr.responseText, contentType)

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
        return
      }

      const errorPayload = data?.error
      if (xhr.status === 401 && (token || includeCredentials)) {
        emitUnauthorizedEvent(requestMeta)
      }
      reject(new ApiError(
        errorPayload?.message ?? data?.message ?? 'No se pudo completar la solicitud.',
        {
          status: xhr.status || 500,
          code: errorPayload?.code,
          details: errorPayload?.details ?? null,
          request: requestMeta,
        },
      ))
    }

    xhr.onerror = () => {
      reject(new ApiError('Error inesperado de red.', {
        status: 500,
        code: 'NETWORK_ERROR',
      }))
    }

    xhr.ontimeout = () => {
      reject(new ApiError('La solicitud tardó demasiado. Intenta de nuevo.', {
        status: 408,
        code: 'REQUEST_TIMEOUT',
      }))
    }

    xhr.send(body)
  })
}

export { UNAUTHORIZED_EVENT_NAME }
