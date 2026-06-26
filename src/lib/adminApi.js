import { apiRequest } from './apiClient'

export function loginAdmin(credentials) {
  return apiRequest('/admin/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function getAdminMe(token) {
  return apiRequest('/admin/auth/me', { token })
}

export function logoutAdmin(token) {
  return apiRequest('/admin/auth/logout', {
    method: 'POST',
    token,
  })
}

export function getAdminDashboardStats(token) {
  return apiRequest('/admin/dashboard/stats', { token })
}

export function listAdminVehicles(token, params = {}) {
  return apiRequest('/admin/vehicles', {
    token,
    searchParams: params,
  })
}

export function getAdminVehicle(token, id) {
  return apiRequest(`/admin/vehicles/${id}`, { token })
}

export function createAdminVehicle(token, payload) {
  return apiRequest('/admin/vehicles', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateAdminVehicle(token, id, payload) {
  return apiRequest(`/admin/vehicles/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export function deleteAdminVehicle(token, id) {
  return apiRequest(`/admin/vehicles/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function publishAdminVehicle(token, id) {
  return apiRequest(`/admin/vehicles/${id}/publish`, {
    method: 'PATCH',
    token,
  })
}

export function unpublishAdminVehicle(token, id) {
  return apiRequest(`/admin/vehicles/${id}/unpublish`, {
    method: 'PATCH',
    token,
  })
}

export function markAdminVehicleSold(token, id) {
  return apiRequest(`/admin/vehicles/${id}/sold`, {
    method: 'PATCH',
    token,
  })
}

export function toggleAdminVehicleFeatured(token, id, featured) {
  return apiRequest(`/admin/vehicles/${id}/featured`, {
    method: 'PATCH',
    token,
    body: { featured },
  })
}

export function uploadAdminVehicleImages(token, id, files) {
  const form = new FormData()
  files.forEach((file) => {
    form.append('images', file)
  })

  return apiRequest(`/admin/vehicles/${id}/images`, {
    method: 'POST',
    token,
    body: form,
  })
}

export function deleteAdminVehicleImage(token, id, imageId) {
  return apiRequest(`/admin/vehicles/${id}/images/${imageId}`, {
    method: 'DELETE',
    token,
  })
}

