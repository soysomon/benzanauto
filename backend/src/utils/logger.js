export function logInfo(message, meta = {}) {
  console.log(message, sanitizeMeta(meta))
}

export function logWarn(message, meta = {}) {
  console.warn(message, sanitizeMeta(meta))
}

export function logError(message, meta = {}) {
  console.error(message, sanitizeMeta(meta))
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return {}

  const clone = { ...meta }

  for (const field of ['password', 'token', 'authorization', 'cookie', 'jwt']) {
    if (field in clone) clone[field] = '[REDACTED]'
  }

  return clone
}

