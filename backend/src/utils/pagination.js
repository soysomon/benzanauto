export function clampNumber(value, { min = 1, max = Number.MAX_SAFE_INTEGER, fallback = 1 } = {}) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

export function getPagination(query, { defaultLimit = 12, maxLimit = 100 } = {}) {
  const page = clampNumber(query.page, { min: 1, fallback: 1 })
  const limit = clampNumber(query.limit, { min: 1, max: maxLimit, fallback: defaultLimit })
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  }
}

