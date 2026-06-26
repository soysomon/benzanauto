import { apiRequest } from './apiClient'
import { mapApiVehicle, mapVehicleCollectionResponse } from './vehicleMapper'

export async function listPublicVehicles(params = {}) {
  const response = await apiRequest('/vehicles', {
    searchParams: params,
  })

  return mapVehicleCollectionResponse(response)
}

export async function getFeaturedVehicles() {
  const response = await apiRequest('/vehicles/featured')
  return Array.isArray(response?.data) ? response.data.map(mapApiVehicle) : []
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
