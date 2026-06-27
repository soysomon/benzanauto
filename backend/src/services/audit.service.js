import { AuditLog } from '../models/AuditLog.js'
import { User } from '../models/User.js'
import { buildPaginationMeta, getPagination } from '../utils/pagination.js'

const REDACTED_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passwordHash',
  'token',
  'resetPasswordTokenHash',
  'mfaSecret',
  'recoveryCodesHash',
  'authorization',
  'cookie',
  'jwt',
])

function sanitizeMetadata(value) {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item))
  }

  if (value instanceof Date) return value

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (REDACTED_KEYS.has(key)) {
          return [key, '[REDACTED]']
        }

        return [key, sanitizeMetadata(entry)]
      }),
    )
  }

  if (typeof value === 'string' && value.length > 1200) {
    return `${value.slice(0, 1200)}…`
  }

  return value
}

export async function recordAuditLog({
  actorId = null,
  targetUserId = null,
  action,
  ip = null,
  userAgent = null,
  metadata = {},
} = {}) {
  if (!action) return null

  return AuditLog.create({
    actorId,
    targetUserId,
    action,
    ip,
    userAgent,
    metadata: sanitizeMetadata(metadata),
  })
}

export async function listAuditLogs(query = {}) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 50, maxLimit: 100 })
  const filter = {}

  if (query.action) filter.action = query.action
  if (query.actorId) filter.actorId = query.actorId
  if (query.targetUserId) filter.targetUserId = query.targetUserId

  if (query.search) {
    const regex = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const matchingUsers = await User.find(
      {
        $or: [
          { name: regex },
          { username: regex },
          { email: regex },
        ],
      },
      { _id: 1 },
    ).lean()

    const userIds = matchingUsers.map((user) => user._id)

    filter.$or = [
      { action: regex },
      { ip: regex },
      { userAgent: regex },
      ...(userIds.length > 0 ? [{ actorId: { $in: userIds } }, { targetUserId: { $in: userIds } }] : []),
    ]
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name username role')
      .populate('targetUserId', 'name username role'),
    AuditLog.countDocuments(filter),
  ])

  return {
    data: logs.map((log) => ({
      id: String(log._id),
      actor: log.actorId
        ? {
            id: String(log.actorId._id),
            name: log.actorId.name,
            username: log.actorId.username,
            role: log.actorId.role,
          }
        : null,
      targetUser: log.targetUserId
        ? {
            id: String(log.targetUserId._id),
            name: log.targetUserId.name,
            username: log.targetUserId.username,
            role: log.targetUserId.role,
          }
        : null,
      action: log.action,
      ip: log.ip,
      userAgent: log.userAgent,
      metadata: log.metadata ?? {},
      createdAt: log.createdAt,
    })),
    meta: buildPaginationMeta({ page, limit, total }),
  }
}
