import { apiRequest } from './apiClient'
import { mapApiVehicle, mapVehicleCollectionResponse } from './vehicleMapper'

const PUBLIC_LIST_CACHE_TTL_MS = 30_000
const PUBLIC_FEATURED_CACHE_TTL_MS = 60_000

const publicVehicleListCache = new Map()
const featuredVehicleCache = new Map()

function buildCacheKey(params = {}) {
  const entries = Object.entries(params)
    .flatMap(([key, rawValue]) => {
      if (rawValue === undefined || rawValue === null || rawValue === '') return []
      if (Array.isArray(rawValue)) {
        return rawValue.map((value) => [key, String(value)])
      }
      return [[key, String(rawValue)]]
    })
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) return leftValue.localeCompare(rightValue)
      return leftKey.localeCompare(rightKey)
    })

  return JSON.stringify(entries)
}

function getCachedValue(store, key, ttlMs) {
  const cached = store.get(key)
  if (!cached) return null

  if (Date.now() - cached.createdAt > ttlMs) {
    store.delete(key)
    return null
  }

  return cached.value
}

function setCachedValue(store, key, value) {
  store.set(key, {
    value,
    createdAt: Date.now(),
  })

  return value
}

export async function listPublicVehicles(params = {}, options = {}) {
  const {
    signal,
    cacheTtlMs = PUBLIC_LIST_CACHE_TTL_MS,
    bypassCache = false,
  } = options
  const cacheKey = buildCacheKey(params)

  if (!bypassCache) {
    const cachedResponse = getCachedValue(publicVehicleListCache, cacheKey, cacheTtlMs)
    if (cachedResponse) return cachedResponse
  }

  try {
    const response = await apiRequest('/vehicles', {
      searchParams: params,
      signal,
    })

    return setCachedValue(publicVehicleListCache, cacheKey, mapVehicleCollectionResponse(response))
  } catch (error) {
    const fallbackResponse = getCachedValue(publicVehicleListCache, cacheKey, Number.POSITIVE_INFINITY)
    if (fallbackResponse && [429, 500, 502, 503, 504].includes(error?.status)) {
      return fallbackResponse
    }

    throw error
  }
}

export async function getFeaturedVehicles(options = {}) {
  const {
    signal,
    cacheTtlMs = PUBLIC_FEATURED_CACHE_TTL_MS,
    bypassCache = false,
  } = options
  const cacheKey = 'featured'

  if (!bypassCache) {
    const cachedResponse = getCachedValue(featuredVehicleCache, cacheKey, cacheTtlMs)
    if (cachedResponse) return cachedResponse
  }

  try {
    const response = await apiRequest('/vehicles/featured', { signal })
    return setCachedValue(
      featuredVehicleCache,
      cacheKey,
      Array.isArray(response?.data) ? response.data.map(mapApiVehicle) : [],
    )
  } catch (error) {
    const fallbackResponse = getCachedValue(featuredVehicleCache, cacheKey, Number.POSITIVE_INFINITY)
    if (fallbackResponse && [429, 500, 502, 503, 504].includes(error?.status)) {
      return fallbackResponse
    }

    throw error
  }
}

export async function getVehicleDetail(identifier) {
  const response = await apiRequest(`/vehicles/${encodeURIComponent(identifier)}`)
  return mapApiVehicle(response?.vehicle)
}

export async function trackVehicleContact(identifier) {
  if (!identifier) {
    return {
      ok: false,
      contactCount: null,
    }
  }

  return apiRequest(`/vehicles/${encodeURIComponent(identifier)}/contact`, {
    method: 'POST',
    keepalive: true,
  })
}
