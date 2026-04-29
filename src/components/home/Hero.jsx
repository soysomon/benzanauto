import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { vehicles } from '../../data/vehicles'
import BrandLogo from '../ui/BrandLogo'

const DOP_RATE = 59.5

const SLIDER_CFG = {
  USD: { min: 0, max: 120000, step: 2500, noFilter: 120000 },
  DOP: { min: 500000, max: 7100000, step: 100000, noFilter: 7100000 },
}

function fmtUSD(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)},000`
  return `$${v}`
}
function fmtDOP(v) {
  if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`
  return `RD$${(v / 1000).toFixed(0)}K`
}
function fmtValue(v, currency) {
  return currency === 'DOP' ? fmtDOP(v) : fmtUSD(v)
}

/* ── Compact horizontal slider ── */
function CompactPriceSlider({ value, onChange, currency }) {
  const [dragging, setDragging] = useState(false)
  const cfg = SLIDER_CFG[currency]
  const isMax = value >= cfg.max
  const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100

  const springPct = useSpring(pct, { stiffness: 320, damping: 28 })
  useEffect(() => { springPct.set(pct) }, [pct, springPct])
  const thumbLeft = useTransform(springPct, p => `${p}%`)

  return (
    <>
      <style>{`
        .bzn-slider {
          -webkit-appearance: none; appearance: none;
          position: absolute; inset: 0; width: 100%;
          background: transparent; outline: none; cursor: grab;
          height: 32px; top: -14px;
        }
        .bzn-slider:active { cursor: grabbing; }
        .bzn-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 1px; height: 1px; opacity: 0; }
        .bzn-slider::-moz-range-thumb { width: 1px; height: 1px; opacity: 0; border: none; }
        .bzn-slider::-webkit-slider-runnable-track { background: transparent; }
      `}</style>

      <motion.span
        key={`${value}-${currency}`}
        initial={{ opacity: 0.5, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`font-display text-[15px] tracking-wider leading-none whitespace-nowrap mb-2.5 ${isMax ? 'text-neutral-300' : 'text-neutral-900'}`}
      >
        {isMax ? 'Sin límite' : fmtValue(value, currency)}
      </motion.span>

      <div className="relative w-full" style={{ height: 4 }}>
        <div className="absolute inset-0 bg-neutral-200 rounded-full" />
        <motion.div
          className="absolute top-0 left-0 h-full bg-b-red rounded-full origin-left"
          style={{ width: `${pct}%` }}
        />
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900 pointer-events-none"
          style={{ left: thumbLeft }}
          animate={{
            width: dragging ? 18 : 13,
            height: dragging ? 18 : 13,
            boxShadow: dragging
              ? '0 0 0 5px rgba(212,0,26,0.22), 0 0 16px rgba(212,0,26,0.28)'
              : '0 0 0 0px rgba(212,0,26,0)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        />
        <input
          type="range"
          className="bzn-slider"
          min={cfg.min} max={cfg.max} step={cfg.step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        />
      </div>
    </>
  )
}

/* ── Media slides ── */
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
    const handler = (e) => {
      if (e.origin !== 'https://www.youtube.com') return
      try {
        const data = JSON.parse(e.data)
        if (
          (data.event === 'onStateChange' && data.info === 0) ||
          (data.event === 'infoDelivery' && data.info?.playerState === 0)
        ) onEnd()
      } catch (_) { }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onEnd])

  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&controls=0&loop=0&rel=0` +
    `&modestbranding=1&playsinline=1&enablejsapi=1` +
    `&origin=${encodeURIComponent(window.location.origin)}`

  return (
    <div className="absolute inset-0 overflow-hidden">
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        title="Benzan Auto"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'max(100vw, 177.78vh)',
          height: 'max(56.25vw, 100vh)',
          transform: 'translate(-50%, -50%)',
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

function MediaBackground({ current, onGoTo }) {
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  const advance = useCallback(() => {
    onGoTo((current + 1) % MEDIA_SLIDES.length)
  }, [current, onGoTo])

  useEffect(() => {
    const slide = MEDIA_SLIDES[current]
    clearTimeout(timerRef.current)
    if (slide.type === 'image') {
      timerRef.current = setTimeout(advance, slide.duration)
    }
    return () => clearTimeout(timerRef.current)
  }, [current, advance])

  useEffect(() => {
    if (MEDIA_SLIDES[current].type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => { })
    }
  }, [current])

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {MEDIA_SLIDES.map((slide, i) => i === current && (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {slide.type === 'image' && (
              <motion.img
                src={slide.src}
                alt={slide.label}
                className="w-full h-full object-cover object-center"
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: slide.duration / 1000 + 1.4, ease: 'linear' }}
              />
            )}
            {slide.type === 'video' && (
              <video
                ref={videoRef}
                src={slide.src}
                poster={slide.poster}
                autoPlay muted playsInline
                onEnded={advance}
                onError={advance}
                className="w-full h-full object-cover object-center"
              />
            )}
            {slide.type === 'youtube' && (
              <YouTubeBackground videoId={slide.videoId} onEnd={advance} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-b-black/40 via-b-black/10 to-b-black/55 pointer-events-none" />
      <div className="absolute inset-0 bg-b-black/10 pointer-events-none" />

      {/* Arrow prev */}
      <button
        onClick={() => onGoTo((current - 1 + MEDIA_SLIDES.length) % MEDIA_SLIDES.length)}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/30 hover:bg-black/60 hover:border-white/40 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm"
        aria-label="Anterior"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Arrow next */}
      <button
        onClick={() => onGoTo((current + 1) % MEDIA_SLIDES.length)}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/30 hover:bg-black/60 hover:border-white/40 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm"
        aria-label="Siguiente"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]">
        <motion.div
          key={current}
          className="h-full bg-b-red/60"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: MEDIA_SLIDES[current].type === 'image' ? MEDIA_SLIDES[current].duration / 1000 : 60,
            ease: 'linear',
          }}
          style={{ originX: 0 }}
        />
      </div>
    </div>
  )
}

/* ── Vehicle type icons ── */
const SedanIcon = () => (
  <svg viewBox="0 0 80 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="17" cy="27" r="5" /><circle cx="57" cy="27" r="5" />
    <path d="M2 23 L8 15 Q13 8 23 7 L43 6 Q54 6 63 11 L73 18 L75 23" />
    <path d="M2 23 Q10 23 11 22 Q17 21 23 23 L51 23 Q52 22 57 21 Q63 22 64 23 L75 23" />
  </svg>
)
const HatchbackIcon = () => (
  <svg viewBox="0 0 80 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="17" cy="27" r="5" /><circle cx="57" cy="27" r="5" />
    <path d="M2 23 L7 15 Q12 8 23 7 L45 6 Q56 6 63 11 L70 18 L72 23" />
    <path d="M2 23 Q10 23 11 22 Q17 21 23 23 L51 23 Q52 22 57 21 Q63 22 64 23 L72 23" />
  </svg>
)
const SuvIcon = () => (
  <svg viewBox="0 0 80 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="17" cy="27" r="5" /><circle cx="59" cy="27" r="5" />
    <path d="M2 23 L2 13 Q2 8 7 7 L65 7 Q70 7 70 12 L76 18 L77 23" />
    <path d="M2 23 Q10 23 11 22 Q17 21 23 23 L53 23 Q54 22 59 21 Q65 22 66 23 L77 23" />
  </svg>
)
const PickupIcon = () => (
  <svg viewBox="0 0 80 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="16" cy="27" r="5" /><circle cx="60" cy="27" r="5" />
    <path d="M2 23 L2 13 Q2 8 7 8 L38 8 L38 23" />
    <path d="M38 15 L74 15 L76 19 L76 23" />
    <path d="M2 23 Q9 23 10 22 Q16 21 22 23 L38 23 L54 23 Q55 22 60 21 Q66 22 67 23 L76 23" />
  </svg>
)
const CoupeIcon = () => (
  <svg viewBox="0 0 80 34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="15" cy="27" r="5" /><circle cx="59" cy="27" r="5" />
    <path d="M1 23 L7 17 Q15 9 27 7 L50 6 Q62 6 70 13 L77 20 L78 23" />
    <path d="M1 23 Q8 23 9 22 Q15 21 21 23 L53 23 Q54 22 59 21 Q65 22 66 23 L78 23" />
  </svg>
)

const vehicleTypes = [
  { id: null, label: 'Todos', Icon: null },
  { id: 'Sedán', label: 'Sedán', Icon: SedanIcon },
  { id: 'Compacto', label: 'Compacto', Icon: HatchbackIcon },
  { id: 'SUV', label: 'Jeepeta', Icon: SuvIcon },
  { id: 'Pickup', label: 'Camioneta', Icon: PickupIcon },
  { id: 'Coupé', label: 'Coupé', Icon: CoupeIcon },
]

function getBrands() {
  const map = {}
  vehicles.forEach(v => { map[v.brand] = (map[v.brand] || 0) + 1 })
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

/* ── Filter card ── */
function FilterCard() {
  const navigate = useNavigate()
  const brands = useMemo(() => getBrands(), [])
  const barRef = useRef(null)
  const brandScrollerRef = useRef(null)

  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [maxPrice, setMaxPrice] = useState(SLIDER_CFG.USD.noFilter)
  const [openPanel, setOpenPanel] = useState(null)
  const [brandScrollerState, setBrandScrollerState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  })

  const cfg = SLIDER_CFG[currency]
  const priceActive = maxPrice < cfg.noFilter
  const maxPriceUSD = currency === 'DOP' ? maxPrice / DOP_RATE : maxPrice

  const matchCount = useMemo(() => {
    let r = vehicles
    if (selectedBrand) r = r.filter(v => v.brand === selectedBrand)
    if (selectedType) r = r.filter(v => v.category === selectedType)
    if (priceActive) r = r.filter(v => v.price <= maxPriceUSD)
    return r.length
  }, [selectedBrand, selectedType, maxPriceUSD, priceActive])

  const handleApply = () => {
    const p = new URLSearchParams()
    if (selectedBrand) p.set('marca', selectedBrand)
    if (selectedType) p.set('tipo', selectedType)
    if (priceActive) p.set('precioMax', Math.round(maxPriceUSD))
    navigate(p.toString() ? `/inventario?${p.toString()}` : '/inventario')
    setOpenPanel(null)
  }

  const handleCurrencySwitch = (cur) => {
    setCurrency(cur)
    setMaxPrice(SLIDER_CFG[cur].noFilter)
  }

  const togglePanel = (panel) => setOpenPanel(prev => prev === panel ? null : panel)

  const updateBrandScrollerState = useCallback(() => {
    const node = brandScrollerRef.current
    if (!node) return

    const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth)
    setBrandScrollerState({
      canScrollLeft: node.scrollLeft > 8,
      canScrollRight: maxScrollLeft - node.scrollLeft > 8,
    })
  }, [])

  const scrollBrands = useCallback((direction) => {
    const node = brandScrollerRef.current
    if (!node) return

    node.scrollBy({
      left: direction * Math.max(node.clientWidth * 0.72, 240),
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    if (!openPanel) return
    const handler = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenPanel(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openPanel])

  useEffect(() => {
    if (openPanel !== 'marca') return

    const node = brandScrollerRef.current
    if (!node) return

    updateBrandScrollerState()

    const activeChip = node.querySelector('[data-brand-active="true"]')
    activeChip?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })

    const handleResize = () => updateBrandScrollerState()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [openPanel, selectedBrand, updateBrandScrollerState])

  const selectedTypeObj = vehicleTypes.find(t => t.id === selectedType)

  return (
    <motion.div
      ref={barRef}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.85, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[1260px] mx-auto"
    >
      {/* Drop-down panels — open UPWARD so they never push content below the fold */}
      <AnimatePresence>
        {openPanel === 'marca' && (
          <motion.div
            key="panel-marca"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+10px)] left-0 right-0 rounded-2xl border border-neutral-200 px-5 py-5 z-30"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(48px) saturate(160%)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
            }}
          >
            <style>{`
              .bzn-scrollbar-none {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .bzn-scrollbar-none::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <div className="flex items-center justify-between gap-4 mb-3.5">
              <p className="font-body text-[9px] uppercase tracking-[0.24em] text-neutral-400">Seleccionar marca</p>
              <p className="font-body text-[10px] text-neutral-400 whitespace-nowrap">
                {brands.length} marcas
              </p>
            </div>

            <div className="relative">
              <div className={`absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white via-white/80 to-white/0 pointer-events-none z-10 transition-opacity duration-200 ${brandScrollerState.canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute inset-y-0 right-16 w-10 bg-gradient-to-l from-white via-white/80 to-white/0 pointer-events-none z-10 transition-opacity duration-200 ${brandScrollerState.canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

              <div
                ref={brandScrollerRef}
                onScroll={updateBrandScrollerState}
                className="bzn-scrollbar-none flex items-stretch gap-2 overflow-x-auto pr-16 pb-1 scroll-smooth snap-x snap-mandatory"
              >
                <button
                  data-brand-active={!selectedBrand}
                  onClick={() => { setSelectedBrand(null); setOpenPanel(null) }}
                  className={`snap-start flex-shrink-0 min-w-[140px] max-w-[160px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-body font-medium border transition-all duration-150 ${!selectedBrand
                    ? 'bg-b-red/10 border-b-red/40 text-neutral-900 shadow-[0_0_0_1px_rgba(220,38,38,0.04)]'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
                    }`}
                >
                  <span className="truncate">Todas</span>
                  <span className={`text-[10px] tabular-nums font-semibold ${!selectedBrand ? 'text-b-red' : 'text-neutral-300'}`}>
                    {vehicles.length}
                  </span>
                </button>

                {brands.map((brand) => {
                  const isActive = selectedBrand === brand.name

                  return (
                    <button
                      key={brand.name}
                      data-brand-active={isActive}
                      onClick={() => { setSelectedBrand(brand.name); setOpenPanel(null) }}
                      className={`snap-start flex-shrink-0 min-w-[150px] max-w-[180px] flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all duration-150 ${isActive
                        ? 'bg-b-red/10 border-b-red/40 text-neutral-900 shadow-[0_0_0_1px_rgba(220,38,38,0.04)]'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
                        }`}
                    >
                      <div className={`w-9 h-5 flex-shrink-0 ${isActive ? 'text-b-red' : 'text-neutral-500'}`}>
                        <BrandLogo brand={brand.name} className="w-full h-full" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="font-body text-xs font-medium truncate block">{brand.name}</span>
                      </div>
                      <span className={`font-body text-[10px] tabular-nums flex-shrink-0 ${isActive ? 'text-b-red' : 'text-neutral-300'}`}>
                        {brand.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden sm:flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={() => scrollBrands(-1)}
                  disabled={!brandScrollerState.canScrollLeft}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-150 ${brandScrollerState.canScrollLeft
                    ? 'border-neutral-300 text-neutral-700 bg-white hover:border-neutral-500'
                    : 'border-neutral-200 text-neutral-300 bg-white/80 cursor-not-allowed'
                    }`}
                  aria-label="Ver marcas anteriores"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollBrands(1)}
                  disabled={!brandScrollerState.canScrollRight}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-150 ${brandScrollerState.canScrollRight
                    ? 'border-neutral-300 text-neutral-700 bg-white hover:border-neutral-500'
                    : 'border-neutral-200 text-neutral-300 bg-white/80 cursor-not-allowed'
                    }`}
                  aria-label="Ver más marcas"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {openPanel === 'tipo' && (
          <motion.div
            key="panel-tipo"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+10px)] left-0 right-0 rounded-2xl border border-neutral-200 px-5 py-5 z-30"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(48px) saturate(160%)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
            }}
          >
            <p className="font-body text-[9px] uppercase tracking-[0.24em] text-neutral-400 mb-3.5">Tipo de vehículo</p>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.map(type => {
                const isActive = selectedType === type.id
                return (
                  <button
                    key={type.label}
                    onClick={() => { setSelectedType(type.id); setOpenPanel(null) }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all duration-150 ${isActive
                      ? 'bg-b-red/10 border-b-red/40 text-b-red'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
                      }`}
                  >
                    {type.Icon && (
                      <div className="w-9 h-[18px] flex-shrink-0">
                        <type.Icon />
                      </div>
                    )}
                    <span className="font-body text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap">
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glass card */}
      <div
        className="flex items-stretch rounded-2xl overflow-hidden border border-neutral-200"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(48px) saturate(160%)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.95) inset',
        }}
      >
        {/* MARCA */}
        <button
          onClick={() => togglePanel('marca')}
          className={`flex-1 flex flex-col justify-center px-6 py-5 border-r border-neutral-200 text-left transition-all duration-150 min-w-0 relative overflow-hidden ${openPanel === 'marca' ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'}`}
        >
          {selectedBrand && <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-b-red" />}
          <span className={`font-body text-[10px] uppercase tracking-[0.22em] mb-2 block transition-colors duration-150 ${selectedBrand ? 'text-b-red' : 'text-neutral-400'}`}>
            Marca
          </span>
          <div className="flex items-center gap-2 min-w-0">
            {selectedBrand ? (
              <>
                <div className="w-8 h-4 flex-shrink-0 text-neutral-700">
                  <BrandLogo brand={selectedBrand} className="w-full h-full" />
                </div>
                <span className="font-body text-[15px] text-neutral-900 font-medium truncate">{selectedBrand}</span>
              </>
            ) : (
              <span className="font-body text-[15px] text-neutral-400">Todas las marcas</span>
            )}
            <svg
              className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-all duration-200 ${openPanel === 'marca' ? 'rotate-180 text-neutral-600' : 'text-neutral-300'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* TIPO */}
        <button
          onClick={() => togglePanel('tipo')}
          className={`flex-1 flex flex-col justify-center px-6 py-5 border-r border-neutral-200 text-left transition-all duration-150 min-w-0 relative overflow-hidden ${openPanel === 'tipo' ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'}`}
        >
          {selectedType && <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-b-red" />}
          <span className={`font-body text-[10px] uppercase tracking-[0.22em] mb-2 block transition-colors duration-150 ${selectedType ? 'text-b-red' : 'text-neutral-400'}`}>
            Tipo
          </span>
          <div className="flex items-center gap-2 min-w-0">
            {selectedType && selectedTypeObj?.Icon ? (
              <>
                <div className="w-10 h-5 flex-shrink-0 text-neutral-700">
                  <selectedTypeObj.Icon />
                </div>
                <span className="font-body text-[15px] text-neutral-900 font-medium">{selectedTypeObj.label}</span>
              </>
            ) : (
              <span className="font-body text-[15px] text-neutral-400">Todos los tipos</span>
            )}
            <svg
              className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-all duration-200 ${openPanel === 'tipo' ? 'rotate-180 text-neutral-600' : 'text-neutral-300'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* PRESUPUESTO */}
        <div
          className="flex-[2.4] flex flex-col justify-center px-6 py-5 border-r border-neutral-200 min-w-0 relative overflow-hidden"
          onClick={() => openPanel && setOpenPanel(null)}
        >
          {priceActive && <span className="absolute bottom-0 left-6 right-6 h-0.5 bg-b-red" />}
          <div className="flex items-center justify-between mb-3">
            <span className={`font-body text-[10px] uppercase tracking-[0.22em] transition-colors duration-150 ${priceActive ? 'text-b-red' : 'text-neutral-400'}`}>Presupuesto</span>
            <div className="flex items-center gap-0">
              {['USD', 'DOP'].map((cur, idx) => (
                <span key={cur} className="flex items-center">
                  {idx > 0 && <span className="text-neutral-300 text-[10px] mx-1">·</span>}
                  <button
                    onClick={e => { e.stopPropagation(); handleCurrencySwitch(cur) }}
                    className={`font-body text-[9px] font-bold uppercase tracking-widest px-1 transition-all duration-150 ${currency === cur ? 'text-neutral-700' : 'text-neutral-300 hover:text-neutral-500'
                      }`}
                  >
                    {cur}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <CompactPriceSlider value={maxPrice} onChange={setMaxPrice} currency={currency} />
        </div>

        {/* CTA */}
        <button
          onClick={handleApply}
          className="flex-shrink-0 flex flex-col items-center justify-center px-8 bg-b-red hover:bg-b-red-hover transition-colors duration-200 group"
          style={{ minWidth: 90 }}
        >
          <span className="font-body text-[9px] uppercase tracking-[0.24em] text-white/70 mb-1">Ver</span>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[26px] text-white leading-none">{matchCount}</span>
            <svg
              className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </button>
      </div>
    </motion.div>
  )
}

/* ── Hero ── */
const contentVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}
const contentItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
}

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const handleGoTo = useCallback((i) => setCurrent(i), [])

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'clamp(560px, 78vh, 860px)' }}
    >
      <MediaBackground current={current} onGoTo={handleGoTo} />

      {/* CONTENIDO */}
      <div className="relative z-10 flex h-full flex-col items-center justify-start px-6 pt-28 pb-10 text-center">
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-5xl flex-col items-center"
        >
          {/* Eyebrow */}
          <motion.div variants={contentItem} className="mb-3 flex items-center gap-3">
            <span className="block h-px w-7 bg-white/55" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white">
              Dealer autorizado · San Juan, RD
            </span>
            <span className="block h-px w-7 bg-white/55" />
          </motion.div>

          {/* HEADLINE REFINADO */}
          <motion.div variants={contentItem} className="mt-1">
            <h1 className="text-[clamp(30px,3.2vw,52px)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
              Encuentra tu próximo vehículo
            </h1>
          </motion.div>

          {/* SUBTEXTO */}
         {/*   <motion.p
            variants={contentItem}
            className="mt-3 max-w-xl text-[clamp(13px,1vw,16px)] leading-relaxed text-white/72"
          >
            Inventario selecto, mantenimiento profesional y una experiencia de compra más confiable.
          </motion.p>*/}

          {/* BOTONES */}
          <motion.div
            variants={contentItem}
            className="mt-5 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="/inventario"
              className="inline-flex min-w-[190px] items-center justify-center rounded-md bg-[#ff000b] px-6 py-3 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#cb030c]"
            >
              Ver inventario
            </a>

            <a
              href="/contacto"
              className="inline-flex min-w-[190px] items-center justify-center rounded-md 
  bg-white px-6 py-3 text-[14px] font-semibold text-neutral-900 
  transition-all duration-200 
  hover:bg-white/90"
            >
              Hablar con un asesor
            </a>
          </motion.div>

          {/* FILTRO */}
          {/* <motion.div variants={contentItem} className="mt-12 md:mt-20 w-full px-2 sm:px-0">
            <FilterCard />
          </motion.div> */}
        </motion.div>

        {/* DOTS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.45 }}
          className="mt-6 flex items-center gap-2"
        >
          {MEDIA_SLIDES.map((_, i) => (
            <button key={i} onClick={() => handleGoTo(i)}>
              <motion.div
                animate={{
                  width: i === current ? 22 : 8,
                  height: 8,
                  opacity: i === current ? 1 : 0.6,
                  backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="rounded-full"
              />
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
