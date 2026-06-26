import { forbidden } from '../utils/api-error.js'
import { hasPermission } from '../types/roles.js'

export function requireRoles(...roles) {
  return (req, _res, next) => {
    const role = req.auth?.user?.role

    if (!role || !roles.includes(role)) {
      return next(forbidden())
    }

    return next()
  }
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    const role = req.auth?.user?.role

    if (!role || !hasPermission(role, permission)) {
      return next(forbidden())
    }

    return next()
  }
}

