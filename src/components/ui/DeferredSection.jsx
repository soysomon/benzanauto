import { startTransition, useEffect, useRef, useState } from 'react'

export default function DeferredSection({
  children,
  fallback = null,
  className = '',
  rootMargin = '280px 0px',
}) {
  const anchorRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return undefined

    const node = anchorRef.current
    if (!node) return undefined

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startTransition(() => {
            setVisible(true)
          })
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  return (
    <div ref={anchorRef} className={className}>
      {visible ? children : fallback}
    </div>
  )
}
