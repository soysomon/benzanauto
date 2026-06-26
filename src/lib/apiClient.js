const REQUEST_TIMEOUT_MS = 15_000

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
  constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
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

  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
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
      signal: signal ?? controller.signal,
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      const errorPayload = data?.error
      throw new ApiError(
        errorPayload?.message ?? data?.message ?? 'No se pudo completar la solicitud.',
        {
          status: response.status,
          code: errorPayload?.code,
          details: errorPayload?.details ?? null,
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
    const xhr = new XMLHttpRequest()
    xhr.open(method, buildRequestUrl(path))
    xhr.timeout = REQUEST_TIMEOUT_MS
    xhr.withCredentials = false

    const finalHeaders = new Headers(headers)
    if (token) {
      finalHeaders.set('Authorization', `Bearer ${token}`)
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
      reject(new ApiError(
        errorPayload?.message ?? data?.message ?? 'No se pudo completar la solicitud.',
        {
          status: xhr.status || 500,
          code: errorPayload?.code,
          details: errorPayload?.details ?? null,
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
