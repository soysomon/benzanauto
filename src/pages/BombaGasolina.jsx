import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { COMPANY, buildMapsEmbedUrl, buildMapsUrl } from '../../shared/company.js'

/* ── Instagram embed loader ── */
function useInstagramEmbed() {
  useEffect(() => {
    if (window.instgrm) { window.instgrm.Embeds.process(); return }
    const s = document.createElement('script')
    s.src = 'https://www.instagram.com/embed.js'
    s.async = true
    s.onload = () => window.instgrm?.Embeds.process()
    document.body.appendChild(s)
  }, [])
}

/* ── Precio display ── */
const PRECIOS = [
  { tipo: 'Premium',  precio: '293.60', tag: 'RD$/gl' },
  { tipo: 'Regular',  precio: '274.50', tag: 'RD$/gl' },
  { tipo: 'Gasoil',   precio: '221.40', tag: 'RD$/gl' },
  { tipo: 'GLP',      precio: '147.60', tag: 'RD$/gl' },
]

/* ── Shared components ── */
function SectionLabel({ text }) {
  return <p className="font-body text-xs text-neutral-500 mb-1 tracking-wide">{text}</p>
}

function OutlineBtn({ href, to, children, white }) {
  const cls = `inline-flex items-center justify-center border px-6 py-2.5 font-body text-sm tracking-wide transition-all duration-200 ${
    white
      ? 'border-white text-white hover:bg-white hover:text-black'
      : 'border-neutral-400 text-neutral-800 hover:border-black hover:text-black'
  }`
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  if (to)   return <Link to={to} className={cls}>{children}</Link>
  return <button className={cls}>{children}</button>
}

/* ════════════════════════════════════════════════ */

export default function BombaGasolina() {
  useInstagramEmbed()
  const [videoPaused, setVideoPaused] = useState(false)
  const [activeTab, setActiveTab]     = useState(0)
  const iframeRef = useRef(null)

  const tabs = [
    { label: 'Llega',     desc: 'Ubica la estación Texaco Benzan en Google Maps y sigue las indicaciones. Estamos en el corazón de San Juan de la Maguana.' },
    { label: 'Carga',     desc: 'Selecciona tu combustible: Premium, Regular, Gasoil o GLP. Nuestros despachadores están listos para atenderte de inmediato.' },
    { label: 'Descansa',  desc: 'Visita nuestra tienda de conveniencia, toma un café o simplemente espera cómodamente mientras llenamos tu tanque.' },
    { label: 'Continúa',  desc: 'Paga con efectivo o tarjeta y sigue tu camino. Rápido, confiable y al mejor precio de la región.' },
  ]

  const toggleHeroVideo = () => {
    const iframeWindow = iframeRef.current?.contentWindow
    if (!iframeWindow) return

    iframeWindow.postMessage(JSON.stringify({
      event: 'command',
      func: videoPaused ? 'playVideo' : 'pauseVideo',
      args: [],
    }), 'https://www.youtube.com')

    setVideoPaused((value) => !value)
  }

  return (
    <>
      {/* ════════════════════════════════════════════════
          1. HERO — video full-bleed + stats abajo
      ════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-black" style={{ height: '100svh', minHeight: 560 }}>
        {/* YouTube video background */}
        <div className="absolute inset-0 w-full h-full">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/MaBle2h06Xg?autoplay=1&mute=1&loop=1&playlist=MaBle2h06Xg&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            className="absolute w-full h-full border-0 scale-110"
            style={{ pointerEvents: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Texaco"
          />
        </div>
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/15" />

        {/* Título — parte superior centrada */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-[120px] left-0 right-0 flex flex-col items-center gap-5"
        >
          <img
            src="/images/Texaco_logo.svg.png"
            alt="Texaco"
            className="h-14 w-auto object-contain"
          />
          <h1
            className="font-heading font-800 text-white text-center leading-none tracking-tight"
            style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}
          >
            Texaco Benzan
          </h1>
        </motion.div>

        {/* Stats fila — igual a Tesla */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="absolute bottom-0 left-0 right-0 pb-[72px]"
        >
          <div className="flex justify-center gap-0">
            {[
              { value: '4',      label: 'Tipos de combustible' },
              { value: '24/7',   label: 'Siempre abiertos'     },
              { value: 'RD$',    label: 'Mejores precios'       },
            ].map((s, i) => (
              <div key={i} className="text-center px-10 lg:px-16 border-r border-white/20 last:border-r-0">
                <p className="font-heading font-700 text-white leading-none mb-1" style={{ fontSize: 'clamp(22px,3vw,36px)' }}>{s.value}</p>
                <p className="font-body text-white/70 text-xs tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pause button — igual a Tesla */}
        <button
          onClick={toggleHeroVideo}
          className="absolute bottom-5 left-5 w-8 h-8 border border-white/50 flex items-center justify-center text-white hover:bg-white/10 transition"
        >
          {videoPaused
            ? <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            : <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          }
        </button>
      </section>

      {/* ════════════════════════════════════════════════
          2. EDITORIAL — fondo blanco, 2 columnas
      ════════════════════════════════════════════════ */}
      <section className="bg-white py-20 lg:py-24">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24">
            <div>
              <SectionLabel text="Experiencia" />
              <h2 className="font-heading font-800 text-neutral-900 leading-tight tracking-tight" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
                Combustible que marca la diferencia
              </h2>
            </div>
            <p className="font-body text-neutral-500 text-base leading-relaxed self-end">
              En Texaco Benzan ofrecemos los combustibles de mayor calidad certificada disponibles en la República Dominicana. Cada litro despachado cumple con los estándares globales de la marca Texaco, garantizando el máximo rendimiento y protección para tu motor.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          3. FULL-BLEED — Instagram post principal
      ════════════════════════════════════════════════ */}
      <section className="relative w-full bg-black overflow-hidden" style={{ height: 'clamp(400px, 65vh, 720px)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Muestra el primer post de Instagram como galería full-bleed */}
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d0d]">
            <blockquote
              className="instagram-media"
              data-instgrm-permalink="https://www.instagram.com/p/DTk3a5Djccn/"
              data-instgrm-version="14"
              style={{ background: 'transparent', border: 'none', margin: 0, maxWidth: '100%', minWidth: 320, width: '100%' }}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          4. TABS — Navega / Conecta / Relájate / Revisa
      ════════════════════════════════════════════════ */}
      <section className="bg-white py-16 border-t border-neutral-100">
        <div className="container-pad">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-neutral-200 mb-8">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`text-left pb-4 pr-8 font-body text-sm transition-all duration-200 ${
                  activeTab === i
                    ? 'text-neutral-900 border-b-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="font-body text-neutral-500 text-sm leading-relaxed max-w-lg">
            {tabs[activeTab].desc}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          5. SPLIT — imagen izq con stats, texto derecha
      ════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* Imagen izquierda — Instagram post 2 */}
        <div className="relative bg-[#0d0d0d] overflow-hidden" style={{ minHeight: 480 }}>
          <div className="absolute inset-0 flex items-stretch">
            <blockquote
              className="instagram-media w-full"
              data-instgrm-permalink="https://www.instagram.com/p/DRzV0xJDGYr/"
              data-instgrm-version="14"
              style={{ background: 'transparent', border: 'none', margin: 0, minWidth: '100%', width: '100%' }}
            />
          </div>
          {/* Stats sobre la imagen — igual a Tesla */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex gap-10">
            {PRECIOS.slice(0, 3).map(p => (
              <div key={p.tipo}>
                <p className="font-heading font-700 text-white text-2xl leading-none">{p.precio}</p>
                <p className="font-body text-white/50 text-xs mt-1">{p.tipo} · {p.tag}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Texto derecha */}
        <div className="bg-white flex flex-col justify-center px-12 lg:px-16 py-20">
          <SectionLabel text="Precios" />
          <h2 className="font-heading font-800 text-neutral-900 leading-tight tracking-tight mb-6" style={{ fontSize: 'clamp(22px,2.5vw,34px)' }}>
            Siempre al precio justo
          </h2>
          <p className="font-body text-neutral-500 text-sm leading-relaxed">
            Los precios de combustible en Texaco Benzan se actualizan semanalmente según las resoluciones oficiales del MEPYD. Transparencia total en cada despacho, sin cargos ocultos ni sorpresas.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          6. SPLIT — texto izq, imagen oscura derecha
      ════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
        {/* Texto izquierda */}
        <div className="bg-white flex flex-col justify-center px-12 lg:px-16 py-20">
          <SectionLabel text="Ubicación" />
          <h2 className="font-heading font-800 text-neutral-900 leading-tight tracking-tight mb-6" style={{ fontSize: 'clamp(22px,2.5vw,34px)' }}>
            Encuéntranos en San Juan
          </h2>
          <p className="font-body text-neutral-500 text-sm leading-relaxed mb-8">
            Estamos ubicados en {COMPANY.gasStationMapsQuery}. Acceso fácil desde la carretera principal, con amplio espacio para vehículos de pasajeros y carga.
          </p>
          <OutlineBtn href={buildMapsUrl(COMPANY.gasStationMapsQuery)}>
            Cómo llegar
          </OutlineBtn>
        </div>

        {/* Imagen derecha — mapa oscuro */}
        <div className="relative overflow-hidden bg-[#0d0d0d]" style={{ minHeight: 460 }}>
          <iframe
            title="Mapa Texaco Benzan"
            src={buildMapsEmbedUrl(COMPANY.gasStationMapsQuery)}
            className="w-full h-full border-0 grayscale opacity-70"
            style={{ minHeight: 460 }}
            allowFullScreen
            loading="lazy"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/5 to-transparent" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          7. PANORÁMICA — full-bleed Instagram post 3
      ════════════════════════════════════════════════ */}
      <section className="relative w-full bg-[#0d0d0d] overflow-hidden" style={{ height: 'clamp(320px, 50vh, 600px)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <blockquote
            className="instagram-media w-full"
            data-instgrm-permalink="https://www.instagram.com/p/DPfLUtACNQj/"
            data-instgrm-version="14"
            style={{ background: 'transparent', border: 'none', margin: 0, minWidth: '100%', width: '100%' }}
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          8. AHORROS — fondo blanco, 2 col, botón outline
      ════════════════════════════════════════════════ */}
      <section className="bg-white py-20 lg:py-24 border-t border-neutral-100">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24">
            <div>
              <SectionLabel text="Precios de hoy" />
              <h2 className="font-heading font-800 text-neutral-900 leading-tight tracking-tight mb-6" style={{ fontSize: 'clamp(24px,3vw,38px)' }}>
                Precios claros,<br />sin sorpresas
              </h2>
              {/* Tabla de precios */}
              <div className="mt-6 space-y-0">
                {PRECIOS.map((p, i) => (
                  <div key={p.tipo} className="flex items-center justify-between py-4 border-b border-neutral-100">
                    <span className="font-body text-sm text-neutral-500">{p.tipo}</span>
                    <span className="font-heading font-700 text-neutral-900 text-lg">RD$ {p.precio} <span className="font-body font-400 text-xs text-neutral-400">/ gl</span></span>
                  </div>
                ))}
                <p className="font-body text-[10px] text-neutral-300 pt-3">
                  * Precios referenciales sujetos a resolución del MEPYD.
                </p>
              </div>
              <div className="mt-8">
                <OutlineBtn href="https://www.instagram.com/texacobenzan/">
                  Ver en Instagram
                </OutlineBtn>
              </div>
            </div>
            <div className="self-center">
              <p className="font-body text-neutral-500 text-base leading-relaxed">
                La estación Texaco Benzan opera bajo los lineamientos de precios oficiales del Ministerio de Energía y Minas de la República Dominicana. Nuestro compromiso es la transparencia absoluta con cada cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          9. CLOSING — imagen dark full-bleed + CTA centro
             (igual a Tesla: "Albergar un Supercharger")
      ════════════════════════════════════════════════ */}
      <section className="relative w-full bg-black overflow-hidden flex flex-col" style={{ minHeight: 'clamp(520px, 80vh, 900px)' }}>
        {/* Video de fondo */}
        <div className="absolute inset-0">
          <iframe
            src="https://www.youtube.com/embed/mFE9DwnA6j8?autoplay=1&mute=1&loop=1&playlist=mFE9DwnA6j8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&start=10"
            className="absolute w-full h-full border-0 scale-110"
            style={{ pointerEvents: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Texaco fondo"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* CTA centrado abajo — igual a Tesla */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-24 lg:pb-32 text-center px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-heading font-800 text-white mb-8 leading-none tracking-tight"
            style={{ fontSize: 'clamp(28px,4vw,52px)' }}
          >
            Visítanos en San Juan de la Maguana
          </motion.h2>
          <OutlineBtn
            href={buildMapsUrl(COMPANY.gasStationMapsQuery)}
            white
          >
            Cómo llegar
          </OutlineBtn>
        </div>
      </section>
    </>
  )
}
