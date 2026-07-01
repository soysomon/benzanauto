import { apiRequest, apiUploadRequest } from './apiClient'

export function loginAdmin(credentials) {
  return apiRequest('/admin/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function forgotAdminPassword(payload) {
  return apiRequest('/admin/auth/forgot-password', {
    method: 'POST',
    body: payload,
  })
}

export function validateAdminResetPasswordToken(token) {
  return apiRequest('/admin/auth/reset-password/validate', {
    method: 'POST',
    body: { token },
  })
}

export function resetAdminPassword(payload) {
  return apiRequest('/admin/auth/reset-password', {
    method: 'POST',
    body: payload,
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

export function changeAdminPassword(token, payload) {
  return apiRequest('/admin/auth/change-password', {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function getAdminDashboardStats(token) {
  return apiRequest('/admin/dashboard/stats', { token })
}

export function listAdminUsers(token, params = {}) {
  return apiRequest('/admin/users', {
    token,
    searchParams: params,
  })
}

export function getAdminUser(token, id) {
  return apiRequest(`/admin/users/${id}`, { token })
}

export function createAdminUser(token, payload) {
  return apiRequest('/admin/users', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateAdminUser(token, id, payload) {
  return apiRequest(`/admin/users/${id}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateAdminUserPassword(token, id, payload) {
  return apiRequest(`/admin/users/${id}/password`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateAdminUserStatus(token, id, payload) {
  return apiRequest(`/admin/users/${id}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateAdminUserRole(token, id, payload) {
  return apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function blockAdminUser(token, id) {
  return apiRequest(`/admin/users/${id}/block`, {
    method: 'PATCH',
    token,
  })
}

export function unblockAdminUser(token, id) {
  return apiRequest(`/admin/users/${id}/unblock`, {
    method: 'PATCH',
    token,
  })
}

export function deleteAdminUser(token, id) {
  return apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function listAdminAuditLogs(token, params = {}) {
  return apiRequest('/admin/audit', {
    token,
    searchParams: params,
  })
}

export function listAdminCampaigns(token, params = {}) {
  return apiRequest('/admin/campaigns', {
    token,
    searchParams: params,
  })
}

export function getAdminCampaign(token, id) {
  return apiRequest(`/admin/campaigns/${id}`, { token })
}

export function createAdminCampaign(token, payload) {
  return apiRequest('/admin/campaigns', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateAdminCampaign(token, id, payload) {
  return apiRequest(`/admin/campaigns/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export function updateAdminCampaignStatus(token, id, status) {
  return apiRequest(`/admin/campaigns/${id}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export function uploadAdminCampaignImage(token, id, file, options = {}) {
  const form = new FormData()
  form.append('image', file)

  if (options.imageAlt) {
    form.append('imageAlt', options.imageAlt)
  }

  return apiUploadRequest(`/admin/campaigns/${id}/image`, {
    method: 'POST',
    token,
    body: form,
    onProgress: options.onProgress,
  })
}

export function deleteAdminCampaignImage(token, id) {
  return apiRequest(`/admin/campaigns/${id}/image`, {
    method: 'DELETE',
    token,
  })
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

export function updateAdminVehicleImagePresentation(token, id, payload) {
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

export function uploadAdminVehicleImages(token, id, files, options = {}) {
  const form = new FormData()
  files.forEach((file) => {
    form.append('images', file)
  })

  if (typeof options.mainImageIndex === 'number') {
    form.append('mainImageIndex', String(options.mainImageIndex))
  }

  if (typeof options.setAsMain === 'boolean') {
    form.append('setAsMain', String(options.setAsMain))
  }

  return apiUploadRequest(`/admin/vehicles/${id}/images`, {
    method: 'POST',
    token,
    body: form,
    onProgress: options.onProgress,
  })
}

export function deleteAdminVehicleImage(token, id, imageId) {
  return apiRequest(`/admin/vehicles/${id}/images/${imageId}`, {
    method: 'DELETE',
    token,
  })
}
