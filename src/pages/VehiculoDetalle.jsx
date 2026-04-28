import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { vehicles } from '../data/vehicles'
import VehicleCard from '../components/ui/VehicleCard'
import Badge from '../components/ui/Badge'
import { COMPANY, buildPhoneUrl, buildWhatsAppUrl } from '../../shared/company.js'

export default function VehiculoDetalle() {
  const { id } = useParams()
  const vehicle = vehicles.find(v => v.id === Number(id))
  const [activeImage, setActiveImage]   = useState(0)
  const [lightbox,    setLightbox]      = useState(false)
  const [lightboxIdx, setLightboxIdx]   = useState(0)

  if (!vehicle) return <Navigate to="/inventario" replace />

  const related = vehicles.filter(v => v.id !== vehicle.id && (v.category === vehicle.category || v.brand === vehicle.brand)).slice(0, 3)

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)

  const gallery = vehicle.gallery?.length ? vehicle.gallery : [vehicle.image]

  const openLightbox = (idx) => { setLightboxIdx(idx); setLightbox(true) }
  const closeLightbox = () => setLightbox(false)
  const lbPrev = useCallback(() => setLightboxIdx(i => (i - 1 + gallery.length) % gallery.length), [gallery.length])
  const lbNext = useCallback(() => setLightboxIdx(i => (i + 1) % gallery.length), [gallery.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape')     closeLightbox()
      if (e.key === 'ArrowLeft')  lbPrev()
      if (e.key === 'ArrowRight') lbNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, lbPrev, lbNext])

  return (
    <>
      {/* Back nav */}
      <div className="pt-24 pb-4 bg-white border-b border-neutral-200">
        <div className="container-pad">
          <Link
            to="/inventario"
            className="inline-flex items-center gap-2 font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Volver al inventario
          </Link>
        </div>
      </div>

      <section className="bg-white py-12 lg:py-16">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Gallery — left 3 cols */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[16/10] overflow-hidden bg-neutral-100 cursor-zoom-in group"
                onClick={() => openLightbox(activeImage)}
              >
                <img
                  src={gallery[activeImage]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 to-transparent pointer-events-none" />

                {/* Zoom hint */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <span className="font-body text-[10px] text-neutral-700 uppercase tracking-wider">Ampliar</span>
                </div>

                {/* Status badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant={vehicle.status === 'Nuevo' ? 'red' : 'outline'}>{vehicle.status}</Badge>
                  {vehicle.badge && <Badge variant="default">{vehicle.badge}</Badge>}
                </div>
              </motion.div>

              {gallery.length > 1 && (
                <div className="flex gap-2">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImage(i); openLightbox(i) }}
                      className={`relative flex-1 aspect-[16/10] overflow-hidden border-2 transition-colors cursor-zoom-in ${
                        i === activeImage ? 'border-b-red' : 'border-transparent opacity-50 hover:opacity-75'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info — right 2 cols */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="sticky top-24 flex flex-col gap-6"
              >
                {/* Header */}
                <div>
                  <p className="font-body text-xs text-neutral-400 uppercase tracking-widest mb-1">{vehicle.brand} · {vehicle.year}</p>
                  <h1 className="font-heading font-800 text-[clamp(28px,3vw,44px)] text-neutral-900 leading-none tracking-tight mb-2">
                    {vehicle.model}
                  </h1>
                  <p className="font-body text-neutral-500 text-sm leading-relaxed">{vehicle.description}</p>
                </div>

                {/* Price */}
                <div className="bg-neutral-50 border border-neutral-200 p-5">
                  <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Precio</p>
                  <p className="font-display text-5xl text-neutral-900 tracking-wider">{formatPrice(vehicle.price)}</p>
                  {vehicle.status === 'Nuevo' && (
                    <p className="font-body text-xs text-neutral-400 mt-1">* Precio incluye todos los impuestos</p>
                  )}
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Transmisión', value: vehicle.transmission },
                    { label: 'Combustible', value: vehicle.fuel },
                    { label: 'Tracción', value: vehicle.traction },
                    { label: 'Color', value: vehicle.color },
                    { label: 'Categoría', value: vehicle.category },
                    { label: 'Kilometraje', value: vehicle.mileage === 0 ? '0 km' : `${vehicle.mileage.toLocaleString()} km` },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-neutral-50 border border-neutral-200 px-4 py-3">
                      <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-0.5">{spec.label}</p>
                      <p className="font-body text-neutral-900 text-sm font-medium">{spec.value}</p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <a
                    href={buildWhatsAppUrl(`Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year} (ID: ${vehicle.id})`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-b-red hover:bg-b-red-hover text-white font-body font-semibold text-sm uppercase tracking-widest py-4 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Consultar por WhatsApp
                  </a>
                  <Link
                    to="/contacto"
                    className="inline-flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-900 font-body font-semibold text-sm uppercase tracking-widest py-4 transition-all duration-200 hover:bg-neutral-50"
                  >
                    Solicitar Cotización
                  </Link>
                  <a
                    href={buildPhoneUrl()}
                    className="inline-flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-900 font-body text-sm transition-colors duration-200 py-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {COMPANY.phoneDisplay}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Full specs */}
      {vehicle.specs && (
        <section className="bg-neutral-50 border-t border-neutral-200 py-16">
          <div className="container-pad">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-px bg-b-red" />
              <h2 className="font-heading text-xl font-700 text-neutral-900 uppercase tracking-widest">Ficha Técnica</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-neutral-200">
              {Object.entries(vehicle.specs).map(([key, val]) => (
                <div key={key} className="bg-neutral-50 p-5">
                  <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1 capitalize">{key}</p>
                  <p className="font-body text-neutral-900 text-sm font-medium">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-white border-t border-neutral-200 py-16">
          <div className="container-pad">
            <div className="flex items-center gap-3 mb-10">
              <span className="block w-8 h-px bg-b-red" />
              <h2 className="font-heading text-xl font-700 text-neutral-900 uppercase tracking-widest">También te puede interesar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/92 backdrop-blur-sm"
              onClick={closeLightbox}
            />

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                src={gallery[lightboxIdx]}
                alt={`${vehicle.brand} ${vehicle.model} — foto ${lightboxIdx + 1}`}
                className="relative z-10 max-w-[92vw] max-h-[85vh] object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                draggable={false}
              />
            </AnimatePresence>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === lightboxIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>

            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev arrow */}
            {gallery.length > 1 && (
              <button
                onClick={lbPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next arrow */}
            {gallery.length > 1 && (
              <button
                onClick={lbNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Siguiente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Label */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
              <p className="font-body text-xs text-white/60 uppercase tracking-widest">
                {vehicle.brand} {vehicle.model} · {lightboxIdx + 1} / {gallery.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
