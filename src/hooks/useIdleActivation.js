import { startTransition, useEffect, useState } from 'react'

export default function useIdleActivation(
  enabled,
  { idleTimeout = 1500, fallbackDelay = 250 } = {},
) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setActive(false)
      return undefined
    }

    if (active) return undefined

    const activate = () => {
      startTransition(() => {
        setActive(true)
      })
    }

    let idleId = null
    let timeoutId = null

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(activate, { timeout: idleTimeout })
    } else {
      timeoutId = window.setTimeout(activate, fallbackDelay)
    }

    return () => {
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [active, enabled, fallbackDelay, idleTimeout])

  return active
}
