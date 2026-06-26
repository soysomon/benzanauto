export const ROLES = ['superadmin', 'admin', 'editor', 'viewer']

export const ROLE_PERMISSIONS = Object.freeze({
  readAdmin: ['superadmin', 'admin', 'editor', 'viewer'],
  manageVehicles: ['superadmin', 'admin', 'editor'],
  deleteVehicles: ['superadmin', 'admin'],
  manageLimitedUsers: ['superadmin', 'admin'],
  manageAllUsers: ['superadmin'],
})

export function isRole(value) {
  return ROLES.includes(value)
}

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[permission]?.includes(role) ?? false
}

export function canAssignRole(actorRole, targetRole) {
  if (actorRole === 'superadmin') return true
  if (actorRole === 'admin') return ['editor', 'viewer'].includes(targetRole)
  return false
}

export function canManageUser(actorRole, targetRole) {
  if (actorRole === 'superadmin') return true
  if (actorRole === 'admin') return ['editor', 'viewer'].includes(targetRole)
  return false
}

