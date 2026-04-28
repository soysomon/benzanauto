import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, animate } from 'framer-motion'

const SLIDES = [
  {
    id: 'taller',
    category: 'Taller Autorizado',
    title: 'Servicio Toyota',
    subtitle: 'Técnicos certificados · Repuestos originales',
    features: ['Diagnóstico computarizado', 'Cambio de aceite y filtros', 'Alineación y balanceo'],
    cta: 'Ver servicios',
    ctaLink: '/taller',
    image: '/images/benzan.webp',
    video: null,
  },
  {
    id: 'bar',
    category: 'Lifestyle',
    title: 'Bar & Grill',
    subtitle: 'Lun – Sáb · 11 AM – 11 PM',
    features: ['Parrilla artesanal y cortes premium', 'Coctelería clásica y especiales', 'Música en vivo los fines de semana'],
    cta: 'Conocer el espacio',
    ctaLink: '/bar-grill',
    image: '/images/BAR.jpeg',
    video: null,
  },
  {
    id: 'gasolina',
    category: 'Estación de Servicio',
    title: 'Bomba Texaco',
    subtitle: 'Estación certificada · Abierta 24 / 7',
    features: ['Gasolina regular y premium', 'Diésel y GLP disponibles', 'Tienda de conveniencia'],
    cta: 'Más información',
    ctaLink: '/bomba-gasolina',
    image: '/images/banner-desktop.webp',
    video: '/videos/texaco.mp4',
  },
]

/* Triple the deck for seamless infinite loop */
const TRACK  = [...SLIDES, ...SLIDES, ...SLIDES]
const OFFSET = SLIDES.length
const N      = SLIDES.length
const AUTOPLAY_MS = 5500
const PEEK_RATIO  = 0.17

function mod(n, m) { return ((n % m) + m) % m }

export default function ServicesCarousel() {
  const containerRef = useRef(null)
  const [cw, setCw]  = useState(0)
  const [vIdx, setVIdx] = useState(OFFSET)
  const trackX       = useMotionValue(0)
  const busy         = useRef(false)
  const timerRef     = useRef(null)

  /* pointer drag */
  const pointerStart = useRef(0)
  const motionStart  = useRef(0)
  const dragging     = useRef(false)

  /* ── dimensions ── */
  const peek   = cw * PEEK_RATIO
  const gap    = 8
  const slideW = cw - 2 * peek - 2 * gap
  const unitW  = slideW + gap

  const xFor = useCallback(
    (idx) => (cw - slideW) / 2 - idx * unitW,
    [cw, slideW, unitW],
  )

  /* measure container */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (cw > 0) trackX.set(xFor(vIdx))
  }, [cw]) // eslint-disable-line

  /* ── go to virtual index ── */
  const goTo = useCallback((nextV) => {
    if (busy.current || cw === 0) return
    busy.current = true
    animate(trackX, xFor(nextV), {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
    }).then(() => {
      const norm = OFFSET + mod(nextV - OFFSET, N)
      setVIdx(norm)
      trackX.set(xFor(norm))
      busy.current = false
    })
  }, [cw, xFor, trackX])

  /* ── auto-play ── */
  const vIdxRef = useRef(vIdx)
  vIdxRef.current = vIdx

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => goTo(vIdxRef.current + 1), AUTOPLAY_MS)
  }, [goTo])

  useEffect(() => {
    if (cw > 0) { resetTimer(); return () => clearInterval(timerRef.current) }
  }, [cw, resetTimer])

  const handleNext = useCallback(() => { goTo(vIdxRef.current + 1); resetTimer() }, [goTo, resetTimer])
  const handlePrev = useCallback(() => { goTo(vIdxRef.current - 1); resetTimer() }, [goTo, resetTimer])
  const handleDot  = (i) => { goTo(OFFSET + i); resetTimer() }

  /* ── WHEEL (trackpad two-finger horizontal scroll) ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastFire = 0
    const onWheel = (e) => {
      /* only horizontal swipes */
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return
      e.preventDefault()
      const now = Date.now()
      if (now - lastFire < 700) return   // debounce
      lastFire = now
      if (e.deltaX > 15)       handleNext()
      else if (e.deltaX < -15) handlePrev()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [handleNext, handlePrev])

  /* ── POINTER drag (mouse / touch) ── */
  const onPointerDown = (e) => {
    if (busy.current) return
    dragging.current = true
    pointerStart.current = e.touches ? e.touches[0].clientX : e.clientX
    motionStart.current  = trackX.get()
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    trackX.set(motionStart.current + cx - pointerStart.current)
  }
  const onPointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    const cx    = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
    const delta = cx - pointerStart.current
    const thr   = Math.min(slideW * 0.18, 70)
    if (delta < -thr)     handleNext()
    else if (delta > thr) handlePrev()
    else animate(trackX, xFor(vIdx), { type: 'spring', stiffness: 500, damping: 45 })
  }

  const active = mod(vIdx, N)
  const trackW = TRACK.length * slideW + (TRACK.length - 1) * gap

  return (
    <section className="bg-white pt-12 pb-10 overflow-hidden">

      {/* ── Heading ── */}
      <div className="flex items-center gap-4 px-6 lg:px-10 mb-8">
        <span className="block w-8 h-px bg-b-red flex-shrink-0" />
        <h2 className="font-heading font-800 text-2xl sm:text-3xl text-neutral-900 tracking-tight leading-none">
          Nuestros Servicios
        </h2>
      </div>

      {/* ── Carousel ── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{ height: 'clamp(260px, 36vw, 620px)', cursor: dragging.current ? 'grabbing' : 'grab' }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {/* sliding track */}
        <motion.div
          className="absolute inset-y-0 flex"
          style={{ x: trackX, width: trackW, gap }}
        >
          {TRACK.map((slide, i) => {
            const isCenter = mod(i - OFFSET, N) === active && i >= OFFSET && i < OFFSET + N
            return (
              <div
                key={i}
                className="relative flex-shrink-0 overflow-hidden rounded-xl"
                style={{ width: slideW }}
              >
                {/* ── Media ── */}
                {slide.video ? (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={slide.video} autoPlay muted loop playsInline poster={slide.image}
                  />
                ) : (
                  <img
                    src={slide.image} alt={slide.title} draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Gradient ONLY on center card */}
                {isCenter && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                )}

                {/* ── Category badge — all cards, text-shadow for legibility ── */}
                <p
                  className="absolute top-4 left-5 font-body text-[10px] text-white uppercase tracking-[0.18em]"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
                >
                  {slide.category}
                </p>

                {/* ── SIDE CARD: title + subtitle only ── */}
                {!isCenter && (
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                    <p
                      className="font-heading font-800 text-white text-lg sm:text-2xl leading-tight tracking-tight"
                      style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                    >
                      {slide.title}
                    </p>
                    <p
                      className="font-body text-xs text-white/80 mt-1 hidden sm:block"
                      style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
                    >
                      {slide.subtitle}
                    </p>
                  </div>
                )}

                {/* ── CENTER CARD: full content ── */}
                {isCenter && (
                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 sm:px-8 sm:pb-8">

                    {/* Title */}
                    <motion.h3
                      key={slide.id + '-t'}
                      className="font-heading font-800 text-white leading-none tracking-tight"
                      style={{ fontSize: 'clamp(24px, 3vw, 50px)' }}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {slide.title}
                    </motion.h3>

                    {/* Subtitle */}
                    <motion.p
                      key={slide.id + '-s'}
                      className="font-body text-sm text-white/70 mt-1.5 mb-4"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {slide.subtitle}
                    </motion.p>

                    {/* Features */}
                    <motion.ul
                      key={slide.id + '-f'}
                      className="space-y-1 mb-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      {slide.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-b-red flex-shrink-0" />
                          <span className="font-body text-xs text-white/80">{f}</span>
                        </li>
                      ))}
                    </motion.ul>

                    {/* CTA */}
                    <motion.div
                      key={slide.id + '-cta'}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.22, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={slide.ctaLink}
                        onMouseDown={e => e.stopPropagation()}
                        className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-900 font-body font-semibold text-xs uppercase tracking-widest px-5 py-2.5 transition-colors duration-200"
                      >
                        {slide.cta}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* arrows */}
        <button
          onClick={handlePrev}
          onMouseDown={e => e.stopPropagation()}
          aria-label="Anterior"
          className="absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
          style={{ left: Math.max(8, peek / 2 - 18) }}
        >
          <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          onMouseDown={e => e.stopPropagation()}
          aria-label="Siguiente"
          className="absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
          style={{ right: Math.max(8, peek / 2 - 18) }}
        >
          <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* progress bar */}
        <div
          className="absolute bottom-0 z-10"
          style={{ left: peek + gap, right: peek + gap, height: 2, background: 'rgba(255,255,255,0.18)' }}
        >
          <motion.div
            key={active}
            className="h-full bg-white/55"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
          />
        </div>
      </div>

      {/* dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            aria-label={SLIDES[i].category}
            className={`rounded-full transition-all duration-300 ${
              i === active ? 'w-2.5 h-2.5 bg-neutral-800' : 'w-2.5 h-2.5 bg-neutral-300 hover:bg-neutral-500'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
