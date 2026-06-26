import { apiRequest } from './apiClient'

export function fetchVehicleMakes() {
  return apiRequest('/vehicle-data/makes')
}

export function fetchVehicleModels(make) {
  return apiRequest('/vehicle-data/models', {
    searchParams: { make },
  })
}

export function fetchVehicleYears(make, model) {
  return apiRequest('/vehicle-data/years', {
    searchParams: { make, model },
  })
}

export function fetchVehicleEnrichment(make, model, year) {
  return apiRequest('/vehicle-data/enrich', {
    searchParams: { make, model, year },
  })
}

export function decodeVehicleVin(vin) {
  return apiRequest(`/vehicle-data/vin/${encodeURIComponent(vin)}`)
}
