import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  {
    id: 'taller',
    category: 'Taller Autorizado',
    title: 'Servicio Toyota',
    subtitle: 'Tecnicos certificados · Repuestos originales',
    features: ['Diagnostico computarizado', 'Cambio de aceite y filtros', 'Alineacion y balanceo'],
    cta: 'Ver servicios',
    ctaLink: '/taller',
    image: '/images/benzan.webp',
    video: null,
  },
  {
    id: 'bar',
    category: 'Lifestyle',
    title: 'Bar & Grill',
    subtitle: 'Lun – Sab · 11 AM – 11 PM',
    features: ['Parrilla artesanal y cortes premium', 'Cocteleria clasica y especiales', 'Musica en vivo los fines de semana'],
    cta: 'Conocer el espacio',
    ctaLink: '/bar-grill',
    image: '/images/BAR.jpeg',
    video: null,
  },
  {
    id: 'gasolina',
    category: 'Estacion de Servicio',
    title: 'Bomba Texaco',
    subtitle: 'Estacion certificada · Abierta 24 / 7',
    features: ['Gasolina regular y premium', 'Diesel y GLP disponibles', 'Tienda de conveniencia'],
    cta: 'Mas informacion',
    ctaLink: '/bomba-gasolina',
    image: '/images/banner-desktop.webp',
    video: '/videos/texaco.mp4',
  },
]

const DRAG_THRESHOLD_PX = 6
const EDGE_TOLERANCE_PX = 12

function ServiceCard({ slide }) {
  return (
    <article
      className="group relative isolate h-[clamp(360px,44vw,600px)] snap-start overflow-hidden rounded-[28px] border border-neutral-200/70 bg-neutral-950 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
    >
      {slide.video ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={slide.video}
          autoPlay
          muted
          loop
          playsInline
          poster={slide.image}
        />
      ) : (
        <img
          src={slide.image}
          alt={slide.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/28 to-black/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/12" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-7 lg:p-8">
        <div className="max-w-[26rem]">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
            {slide.category}
          </p>
        </div>

        <div className="max-w-[30rem]">
          <h3 className="font-heading text-[clamp(28px,4vw,54px)] font-800 leading-[0.95] tracking-tight text-white">
            {slide.title}
          </h3>
          <p className="mt-3 max-w-[28rem] font-body text-sm leading-relaxed text-white/72 sm:text-[15px]">
            {slide.subtitle}
          </p>

          <ul className="mt-5 space-y-2.5">
            {slide.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-b-red" />
                <span className="font-body text-sm leading-relaxed text-white/82">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <Link
              to={slide.ctaLink}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 transition-all duration-200 hover:bg-neutral-100 hover:shadow-[0_10px_32px_rgba(255,255,255,0.22)]"
            >
              {slide.cta}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ServicesCarousel() {
  const scrollRef = useRef(null)
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
    pointerId: null,
  })
  const blockClickRef = useRef(false)

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const updateEdgeState = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
    setCanScrollPrev(element.scrollLeft > EDGE_TOLERANCE_PX)
    setCanScrollNext(element.scrollLeft < maxScrollLeft - EDGE_TOLERANCE_PX)
  }, [])

  const scrollByViewport = useCallback((direction) => {
    const element = scrollRef.current
    if (!element) return

    const amount = Math.max(element.clientWidth * 0.78, 320)
    element.scrollBy({
      left: amount * direction,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    updateEdgeState()

    const handleScroll = () => updateEdgeState()
    const resizeObserver = new ResizeObserver(() => updateEdgeState())

    element.addEventListener('scroll', handleScroll, { passive: true })
    resizeObserver.observe(element)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [updateEdgeState])

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.active) return

    dragStateRef.current.active = false
    dragStateRef.current.pointerId = null
    setIsDragging(false)
    updateEdgeState()
  }, [updateEdgeState])

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if (event.target.closest('a, button')) return

    const element = scrollRef.current
    if (!element) return

    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScrollLeft: element.scrollLeft,
      pointerId: event.pointerId,
    }
    blockClickRef.current = false
    setIsDragging(true)
    element.setPointerCapture?.(event.pointerId)
  }, [])

  const handlePointerMove = useCallback((event) => {
    const element = scrollRef.current
    if (!dragStateRef.current.active || !element) return

    const deltaX = event.clientX - dragStateRef.current.startX
    if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragStateRef.current.moved = true
      blockClickRef.current = true
    }

    element.scrollLeft = dragStateRef.current.startScrollLeft - deltaX
  }, [])

  const handlePointerUp = useCallback((event) => {
    const element = scrollRef.current
    if (dragStateRef.current.pointerId !== null) {
      element?.releasePointerCapture?.(dragStateRef.current.pointerId)
    }
    endDrag()
  }, [endDrag])

  const handlePointerCancel = useCallback(() => {
    endDrag()
  }, [endDrag])

  const handleClickCapture = useCallback((event) => {
    if (!blockClickRef.current) return

    event.preventDefault()
    event.stopPropagation()
    blockClickRef.current = false
  }, [])

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByViewport(1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByViewport(-1)
    }
  }, [scrollByViewport])

  return (
    <section className="overflow-hidden bg-white py-12">
      <div className="mb-7 flex items-end justify-between gap-6 px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-4">
            <span className="block h-px w-8 flex-shrink-0 bg-b-red" />
            <h2 className="font-heading text-2xl font-800 tracking-tight text-neutral-900 sm:text-3xl">
              Nuestros Servicios
            </h2>
          </div>
          <p className="font-body text-sm leading-relaxed text-neutral-500 sm:text-[15px]">
            Desliza libremente con trackpad, touch o arrastre para explorar cada experiencia sin pausas artificiales.
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByViewport(-1)}
            disabled={!canScrollPrev}
            aria-label="Desplazar servicios hacia la izquierda"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByViewport(1)}
            disabled={!canScrollNext}
            aria-label="Desplazar servicios hacia la derecha"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-gradient-to-r from-white via-white/92 to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-white via-white/92 to-transparent lg:block" />

        <div
          ref={scrollRef}
          role="region"
          aria-label="Carrusel horizontal de servicios Benzan"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClickCapture={handleClickCapture}
          onKeyDown={handleKeyDown}
          className={`scrollbar-none flex snap-x snap-proximity gap-5 overflow-x-auto px-6 pb-4 pt-1 outline-none lg:px-10 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{
            scrollBehavior: 'smooth',
            scrollPaddingInline: 'max(1.5rem, 5vw)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            touchAction: 'pan-y pinch-zoom',
          }}
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="min-w-0 flex-[0_0_84vw] sm:flex-[0_0_72vw] lg:flex-[0_0_58vw] xl:flex-[0_0_46vw] 2xl:flex-[0_0_40vw]"
            >
              <ServiceCard slide={slide} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between px-6 md:hidden lg:px-10">
          <p className="font-body text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Desliza para explorar
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByViewport(-1)}
              disabled={!canScrollPrev}
              aria-label="Desplazar servicios hacia la izquierda"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-all duration-200 disabled:opacity-35"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByViewport(1)}
              disabled={!canScrollNext}
              aria-label="Desplazar servicios hacia la derecha"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-all duration-200 disabled:opacity-35"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
