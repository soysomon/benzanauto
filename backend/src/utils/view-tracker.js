const viewBuckets = new Map()
const DEFAULT_WINDOW_MS = 60 * 60 * 1000

function cleanup(now) {
  for (const [key, expiresAt] of viewBuckets.entries()) {
    if (expiresAt <= now) viewBuckets.delete(key)
  }
}

export function shouldCountVehicleView({ vehicleId, ip, windowMs = DEFAULT_WINDOW_MS }) {
  const now = Date.now()
  const key = `${vehicleId}:${ip ?? 'unknown'}`
  const current = viewBuckets.get(key)

  if (current && current > now) {
    return false
  }

  viewBuckets.set(key, now + windowMs)

  if (viewBuckets.size > 10_000) cleanup(now)

  return true
}

