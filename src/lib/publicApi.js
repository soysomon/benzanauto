import { apiRequest } from './apiClient'
import { mapApiVehicle, mapVehicleCollectionResponse } from './vehicleMapper'

const PUBLIC_LIST_CACHE_TTL_MS = 30_000
const PUBLIC_FEATURED_CACHE_TTL_MS = 60_000
const PUBLIC_DETAIL_CACHE_TTL_MS = 60_000
const CACHE_STORAGE_PREFIX = 'benzan:public-api:v2'

const publicVehicleListCache = new Map()
const featuredVehicleCache = new Map()
const publicVehicleDetailCache = new Map()
const inFlightRequests = new Map()

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
  if (cached && Date.now() - cached.createdAt <= ttlMs) {
    return cached.value
  }

  const persisted = readPersistedCacheEntry(key)
  if (!persisted) return null

  if (Date.now() - persisted.createdAt > ttlMs) return null

  store.set(key, persisted)
  return persisted.value
}

function getLastSuccessfulValue(store, key) {
  return store.get(key)?.value ?? readPersistedCacheEntry(key)?.value ?? null
}

function setCachedValue(store, key, value) {
  const entry = {
    value,
    createdAt: Date.now(),
  }
  store.set(key, entry)
  persistCacheEntry(key, entry)

  return value
}

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function getStorageKey(key) {
  return `${CACHE_STORAGE_PREFIX}:${key}`
}

function readPersistedCacheEntry(key) {
  const storage = getStorage()
  if (!storage) return null

  try {
    const rawValue = storage.getItem(getStorageKey(key))
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.createdAt !== 'number') return null

    return parsed
  } catch {
    return null
  }
}

function persistCacheEntry(key, entry) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(getStorageKey(key), JSON.stringify(entry))
  } catch {
    // Best-effort client cache only.
  }
}

async function runCachedRequest({
  store,
  key,
  ttlMs,
  bypassCache,
  requestFactory,
}) {
  if (!bypassCache) {
    const cachedResponse = getCachedValue(store, key, ttlMs)
    if (cachedResponse) return cachedResponse
  }

  if (!bypassCache && inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  const requestPromise = requestFactory().finally(() => {
    inFlightRequests.delete(key)
  })

  if (!bypassCache) {
    inFlightRequests.set(key, requestPromise)
  }

  return requestPromise
}

export async function listPublicVehicles(params = {}, options = {}) {
  const {
    signal,
    cacheTtlMs = PUBLIC_LIST_CACHE_TTL_MS,
    bypassCache = false,
  } = options
  const cacheKey = `list:${buildCacheKey(params)}`

  return runCachedRequest({
    store: publicVehicleListCache,
    key: cacheKey,
    ttlMs: cacheTtlMs,
    bypassCache,
    requestFactory: async () => {
      try {
        const response = await apiRequest('/vehicles', {
          searchParams: params,
          signal,
        })

        return setCachedValue(publicVehicleListCache, cacheKey, mapVehicleCollectionResponse(response))
      } catch (error) {
        const fallbackResponse = getLastSuccessfulValue(publicVehicleListCache, cacheKey)
        if (fallbackResponse && [429, 500, 502, 503, 504].includes(error?.status)) {
          return fallbackResponse
        }

        throw error
      }
    },
  })
}

export async function getFeaturedVehicles(options = {}) {
  const {
    signal,
    cacheTtlMs = PUBLIC_FEATURED_CACHE_TTL_MS,
    bypassCache = false,
  } = options
  const cacheKey = 'featured'

  return runCachedRequest({
    store: featuredVehicleCache,
    key: cacheKey,
    ttlMs: cacheTtlMs,
    bypassCache,
    requestFactory: async () => {
      try {
        const response = await apiRequest('/vehicles/featured', { signal })
        return setCachedValue(
          featuredVehicleCache,
          cacheKey,
          Array.isArray(response?.data) ? response.data.map(mapApiVehicle) : [],
        )
      } catch (error) {
        const fallbackResponse = getLastSuccessfulValue(featuredVehicleCache, cacheKey)
        if (fallbackResponse && [429, 500, 502, 503, 504].includes(error?.status)) {
          return fallbackResponse
        }

        throw error
      }
    },
  })
}

export async function getVehicleDetail(identifier, options = {}) {
  const {
    signal,
    cacheTtlMs = PUBLIC_DETAIL_CACHE_TTL_MS,
    bypassCache = false,
  } = options
  const cacheKey = `detail:${encodeURIComponent(identifier)}`

  return runCachedRequest({
    store: publicVehicleDetailCache,
    key: cacheKey,
    ttlMs: cacheTtlMs,
    bypassCache,
    requestFactory: async () => {
      try {
        const response = await apiRequest(`/vehicles/${encodeURIComponent(identifier)}`, { signal })
        return setCachedValue(publicVehicleDetailCache, cacheKey, mapApiVehicle(response?.vehicle))
      } catch (error) {
        const fallbackResponse = getLastSuccessfulValue(publicVehicleDetailCache, cacheKey)
        if (fallbackResponse && [429, 500, 502, 503, 504].includes(error?.status)) {
          return fallbackResponse
        }

        throw error
      }
    },
  })
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
