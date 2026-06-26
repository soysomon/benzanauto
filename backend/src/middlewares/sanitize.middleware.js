const DANGEROUS_KEY_PATTERN = /^\$|\.|\uFF0E|\uFF04/

export function sanitizeMongoPayload(req, _res, next) {
  sanitizeObject(req.body)
  sanitizeObject(req.params)
  sanitizeObject(req.query)
  next()
}

function sanitizeObject(target) {
  if (!target || typeof target !== 'object') return

  if (Array.isArray(target)) {
    target.forEach((item) => sanitizeObject(item))
    return
  }

  for (const key of Object.keys(target)) {
    const value = target[key]

    if (DANGEROUS_KEY_PATTERN.test(key)) {
      delete target[key]
      continue
    }

    sanitizeObject(value)
  }
}
