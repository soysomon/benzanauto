import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prefetchRoute } from '../../lib/routeModules'

const MEDIA_SLIDES = [
  {
    type: 'image',
    src: '/images/toyota_land-cruiser.avif',
    duration: 5500,
    label: 'Land Cruiser 300',
  },
  {
    type: 'image',
    src: '/images/isuzu-dmax-terreno-abrupto.jpeg',
    duration: 5500,
    label: 'Hilux Double Cab',
  },
  {
    type: 'youtube',
    videoId: '0BlPS65WN5Q',
    label: 'Hilux en acción',
  },
  {
    type: 'image',
    src: '/images/banner-desktop.webp',
    duration: 5500,
    label: 'Fortuner 4x4',
  },
]

function YouTubeBackground({ videoId, onEnd }) {
  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== 'https://www.youtube.com') return

      try {
        const data = JSON.parse(event.data)
        if (
          (data.event === 'onStateChange' && data.info === 0) ||
          (data.event === 'infoDelivery' && data.info?.playerState === 0)
        ) {
          onEnd()
        }
      } catch {
        // Ignore noisy postMessage payloads from the embedded player.
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onEnd])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&controls=0&loop=0&rel=0` +
    `&modestbranding=1&playsinline=1&enablejsapi=1` +
    `&origin=${encodeURIComponent(origin)}`

  return (
    <div className="absolute inset-0 overflow-hidden">
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        title="Benzan Auto"
        className="absolute left-1/2 top-1/2 h-[max(56.25vw,100vh)] w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
      />
    </div>
  )
}

function MediaSlide({ slide, active, onEnd }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!active}
    >
      {slide.type === 'image' ? (
        <img
          src={slide.src}
          alt={slide.label}
          loading={slide === MEDIA_SLIDES[0] ? 'eager' : 'lazy'}
          fetchPriority={slide === MEDIA_SLIDES[0] ? 'high' : 'auto'}
          decoding="async"
          className={`h-full w-full object-cover object-center transition-transform duration-[6500ms] ease-linear ${
            active ? 'scale-100' : 'scale-[1.05]'
          }`}
        />
      ) : null}

      {slide.type === 'youtube' ? <YouTubeBackground videoId={slide.videoId} onEnd={onEnd} /> : null}
    </div>
  )
}

function HeroProgress({ slideIndex }) {
  const activeSlide = MEDIA_SLIDES[slideIndex]
  const durationSeconds = activeSlide.type === 'image' ? activeSlide.duration / 1000 : 60

  return (
    <>
      <style>{`
        @keyframes hero-progress-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]">
        <span
          key={slideIndex}
          className="block h-full origin-left bg-b-red/60"
          style={{
            animationName: 'hero-progress-bar',
            animationDuration: `${durationSeconds}s`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
          }}
        />
      </div>
    </>
  )
}

function MediaBackground({ current, onGoTo }) {
  const activeSlide = MEDIA_SLIDES[current]

  useEffect(() => {
    if (activeSlide.type !== 'image') return undefined

    const timeoutId = window.setTimeout(() => {
      onGoTo((current + 1) % MEDIA_SLIDES.length)
    }, activeSlide.duration)

    return () => window.clearTimeout(timeoutId)
  }, [activeSlide.duration, activeSlide.type, current, onGoTo])

  return (
    <div className="absolute inset-0">
      {MEDIA_SLIDES.map((slide, index) => (
        <MediaSlide
          key={slide.type === 'youtube' ? slide.videoId : slide.src}
          slide={slide}
          active={index === current}
          onEnd={() => onGoTo((current + 1) % MEDIA_SLIDES.length)}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-b-black/40 via-b-black/10 to-b-black/55" />
      <div className="pointer-events-none absolute inset-0 bg-b-black/10" />

      <button
        type="button"
        onClick={() => onGoTo((current - 1 + MEDIA_SLIDES.length) % MEDIA_SLIDES.length)}
        className="absolute left-5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/30 text-white/60 backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-black/60 hover:text-white"
        aria-label="Anterior"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onGoTo((current + 1) % MEDIA_SLIDES.length)}
        className="absolute right-5 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/30 text-white/60 backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-black/60 hover:text-white"
        aria-label="Siguiente"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <HeroProgress slideIndex={current} />
    </div>
  )
}

function staggerDelay(index, baseDelay = 180) {
  return { transitionDelay: `${baseDelay + index * 120}ms` }
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [contentReady, setContentReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setContentReady(true)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [])

  const handleGoTo = useCallback((index) => setCurrent(index), [])
  const currentSlideLabel = useMemo(() => MEDIA_SLIDES[current].label, [current])

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'clamp(560px, 78vh, 860px)' }}
      aria-label={`Hero principal, slide activo: ${currentSlideLabel}`}
    >
      <MediaBackground current={current} onGoTo={handleGoTo} />

      <div className="relative z-10 flex h-full flex-col items-center justify-start px-6 pb-10 pt-28 text-center">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div
            className={`mb-3 flex items-center gap-3 transition-all duration-700 ease-out ${
              contentReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={staggerDelay(0)}
          >
            <span className="block h-px w-7 bg-white/55" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white">
              Dealer autorizado · San Juan, RD
            </span>
            <span className="block h-px w-7 bg-white/55" />
          </div>

          <div
            className={`mt-1 transition-all duration-700 ease-out ${
              contentReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={staggerDelay(1)}
          >
            <h1 className="text-[clamp(30px,3.2vw,52px)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
              Encuentra tu próximo vehículo
            </h1>
          </div>

          <div
            className={`mt-5 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ease-out ${
              contentReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={staggerDelay(2)}
          >
            <button
              type="button"
              onClick={() => navigate('/inventario')}
              onMouseEnter={() => { void prefetchRoute('/inventario') }}
              onFocus={() => { void prefetchRoute('/inventario') }}
              className="inline-flex min-w-[190px] items-center justify-center rounded-md bg-[#ff000b] px-6 py-3 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#cb030c]"
            >
              Ver inventario
            </button>

            <button
              type="button"
              onClick={() => navigate('/contacto')}
              onMouseEnter={() => { void prefetchRoute('/contacto') }}
              onFocus={() => { void prefetchRoute('/contacto') }}
              className="inline-flex min-w-[190px] items-center justify-center rounded-md bg-white px-6 py-3 text-[14px] font-semibold text-neutral-900 transition-all duration-200 hover:bg-white/90"
            >
              Hablar con un asesor
            </button>
          </div>
        </div>

        <div
          className={`mt-auto flex items-center gap-2 transition-all duration-700 ease-out ${
            contentReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
          style={staggerDelay(3, 380)}
        >
          {MEDIA_SLIDES.map((slide, index) => (
            <button
              key={slide.type === 'youtube' ? slide.videoId : slide.src}
              type="button"
              onClick={() => handleGoTo(index)}
              aria-label={`Ir al slide ${index + 1}: ${slide.label}`}
              aria-pressed={index === current}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  index === current ? 'h-2 w-[22px] bg-white opacity-100' : 'h-2 w-2 bg-white/40 opacity-70'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
