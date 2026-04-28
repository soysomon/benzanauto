import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [enabled,  setEnabled]  = useState(false)
  const [visible,  setVisible]  = useState(false)
  const [clicking, setClicking] = useState(false)
  const [hovering, setHovering] = useState(false)   // over link/button
  const [onDark,   setOnDark]   = useState(false)   // over dark bg sections

  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)

  /* dot follows instantly */
  const dotX = useSpring(rawX, { stiffness: 2000, damping: 80, mass: 0.1 })
  const dotY = useSpring(rawY, { stiffness: 2000, damping: 80, mass: 0.1 })

  /* ring follows with elastic lag */
  const ringX = useSpring(rawX, { stiffness: 180, damping: 22, mass: 0.6 })
  const ringY = useSpring(rawY, { stiffness: 180, damping: 22, mass: 0.6 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncEnabledState = () => setEnabled(mediaQuery.matches)

    syncEnabledState()
    mediaQuery.addEventListener('change', syncEnabledState)

    return () => mediaQuery.removeEventListener('change', syncEnabledState)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const onMove = (e) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)

      /* detect if hovering interactive element */
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el) return
      const interactive = el.closest('a, button, [role="button"], input, select, textarea, label, [data-cursor="pointer"]')
      setHovering(!!interactive)

      /* detect dark background (approximation via computed bg-color) */
      const bg = window.getComputedStyle(el).backgroundColor
      const match = bg.match(/\d+/g)
      if (match) {
        const [r, g, b] = match.map(Number)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        setOnDark(lum < 80)
      }
    }

    const onEnter  = () => setVisible(true)
    const onLeave  = () => setVisible(false)
    const onDown   = () => setClicking(true)
    const onUp     = () => setClicking(false)

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mousedown',  onDown)
    document.addEventListener('mouseup',    onUp)

    return () => {
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mousedown',  onDown)
      document.removeEventListener('mouseup',    onUp)
    }
  }, [enabled, rawX, rawY])

  /* colour theme */
  const color = onDark ? '#ffffff' : '#111111'

  if (!enabled) return null

  return (
    <>
      {/* ── Outer ring ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        animate={{
          opacity: visible ? 1 : 0,
          width:   hovering ? 44 : clicking ? 20 : 32,
          height:  hovering ? 44 : clicking ? 20 : 32,
          borderColor: hovering ? '#C41E24' : color,
          borderWidth: hovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderRadius: '50%',
          border: `1px solid ${color}`,
          mixBlendMode: 'normal',
        }}
      />

      {/* ── Center dot ── */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          borderRadius: '50%',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          width:   hovering ? 5 : clicking ? 3 : 4,
          height:  hovering ? 5 : clicking ? 3 : 4,
          backgroundColor: hovering ? '#C41E24' : color,
          scale: clicking ? 0.6 : 1,
        }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  )
}
