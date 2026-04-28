import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const stats = [
  { value: '20+',    label: 'Años de trayectoria' },
  { value: '500+',   label: 'Vehículos entregados' },
  { value: '8,500+', label: 'Servicios completados' },
  { value: '#1',     label: 'Dealer de la Región Sur' },
]

const valores = [
  { label: 'Integridad',     desc: 'Transparencia absoluta en cada negociación. Lo que ves es exactamente lo que recibes.' },
  { label: 'Confiabilidad',  desc: 'Construimos reputación con hechos. Cada promesa que hacemos, la cumplimos.' },
  { label: 'Compromiso',     desc: 'Con nuestros clientes, con la calidad y con el desarrollo de nuestra región.' },
  { label: 'Excelencia',     desc: 'Un estándar que no negociamos. En cada vehículo, en cada servicio, en cada detalle.' },
  { label: 'Lealtad',        desc: 'Las relaciones que construimos trascienden la primera compra. Somos socios de por vida.' },
  { label: 'Servicio',       desc: 'La experiencia del cliente define cada decisión que tomamos como empresa.' },
]

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Nosotros() {
  return (
    <>
      {/* ── Hero — full bleed ── */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <img
          src="/images/about1.jpeg"
          alt="Benzan Auto Import"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

        <div className="relative z-10 w-full pb-24 lg:pb-32">
          <div className="container-pad">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="block w-8 h-px bg-b-red" />
              <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Nosotros</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading font-800 text-[clamp(44px,7vw,104px)] text-white leading-none tracking-tight"
            >
              El vehículo<br />
              <span className="text-white/35">que mereces.</span>
            </motion.h1>
          </div>
        </div>
      </section>

      {/* ── Editorial statement + stats ── */}
      <section className="bg-white section-pad border-b border-neutral-200">
        <div className="container-pad">
          <motion.p {...fade()} className="font-heading font-700 text-[clamp(20px,2.8vw,38px)] text-neutral-900 leading-snug tracking-tight max-w-4xl mb-20">
            Somos más que un concesionario. Somos el punto de encuentro entre la ambición de avanzar y la confianza de hacerlo con quienes mejor conocen el camino.
          </motion.p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                {...fade(i * 0.1)}
                className="bg-white px-8 py-10"
              >
                <p className="font-display text-[clamp(40px,4.5vw,64px)] text-neutral-900 tracking-wider leading-none mb-2">{s.value}</p>
                <p className="font-body text-neutral-400 text-xs uppercase tracking-[0.18em]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-bleed image 2 ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative overflow-hidden"
        style={{ height: 'clamp(320px, 55vh, 680px)' }}
      >
        <img
          src="/images/about2.jpeg"
          alt="Benzan Auto Import"
          className="w-full h-full object-cover object-center"
        />
      </motion.section>

      {/* ── Misión ── */}
      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: 540 }}>

          {/* Text */}
          <div className="flex flex-col justify-center py-20 px-6 lg:px-8 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
            <motion.div {...fade()}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-b-red" />
                <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Misión</span>
              </div>
              <h2 className="font-heading font-800 text-[clamp(26px,3.2vw,46px)] text-neutral-900 leading-tight tracking-tight mb-6">
                Cada cliente merece el vehículo correcto, al precio justo y con el servicio que lo respeta.
              </h2>
              <p className="font-body text-neutral-500 text-base leading-relaxed max-w-lg">
                Conectamos a las familias dominicanas con el vehículo que merecen. Ofrecemos la mayor variedad de opciones, los más altos estándares de calidad en servicio y la transparencia que construye relaciones para toda la vida.
              </p>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <img
              src="/images/about3.jpeg"
              alt="Misión Benzan"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ── Visión ── */}
      <section className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: 540 }}>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <img
              src="/images/about4.jpeg"
              alt="Visión Benzan"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/60 to-transparent" />
          </motion.div>

          {/* Text — white */}
          <div className="bg-white flex flex-col justify-center py-20 px-6 lg:px-16 lg:pr-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            <motion.div {...fade()}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-b-red" />
                <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Visión</span>
              </div>
              <h2 className="font-heading font-800 text-[clamp(26px,3.2vw,46px)] text-b-black leading-tight tracking-tight mb-6">
                Ser el nombre que defina la excelencia automotriz en todo el Sur de la República.
              </h2>
              <p className="font-body text-neutral-500 text-base leading-relaxed max-w-lg">
                Nos proyectamos como el distribuidor de mayor confianza a nivel nacional, reconocido no por el volumen de sus operaciones, sino por la profundidad del compromiso con cada cliente, cada familia y cada comunidad.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Valores ── */}
      <section>

        {/* Header — white */}
        <div className="bg-white pt-16 pb-12 px-6">
          <div className="container-pad">
            <motion.div {...fade()} className="flex items-center gap-3">
              <span className="w-8 h-px bg-b-red" />
              <h2 className="font-heading text-xl font-700 text-b-black uppercase tracking-widest">Lo que nos define</h2>
            </motion.div>
          </div>
        </div>

        {/* Grid — white */}
        <div className="bg-white pb-20">
          <div className="container-pad">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/[0.06]">
              {valores.map((v, i) => (
                <motion.div
                  key={v.label}
                  {...fade(i * 0.07)}
                  className="bg-white p-8 lg:p-10 group hover:bg-neutral-50 transition-colors duration-300"
                >
                  <p className="font-display text-[clamp(36px,3vw,52px)] text-b-red/50 tracking-wider leading-none mb-5 group-hover:text-b-red/70 transition-colors duration-300">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="font-heading font-700 text-xl text-b-black tracking-tight mb-3">{v.label}</h3>
                  <p className="font-body text-neutral-500 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing full-bleed + CTA ── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: 'clamp(400px, 65vh, 720px)' }}>
        <img
          src="/images/about5.jpeg"
          alt="Benzan Auto Import"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />

        <div className="relative z-10 text-center px-6">
          <motion.p {...fade()} className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red mb-5">
            San Juan, República Dominicana
          </motion.p>
          <motion.h2
            {...fade(0.15)}
            className="font-heading font-800 text-[clamp(32px,5.5vw,80px)] text-white leading-none tracking-tight mb-10"
          >
            Tu próximo vehículo<br />
            <span className="text-white/35">te espera aquí.</span>
          </motion.h2>
          <motion.div {...fade(0.3)} className="flex flex-wrap justify-center gap-4">
            <Link
              to="/inventario"
              className="inline-flex items-center gap-2.5 bg-b-red hover:bg-b-red-hover text-white font-body font-semibold text-sm uppercase tracking-widest px-9 py-4 transition-colors duration-200 group"
            >
              Ver Inventario
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2.5 border border-white/25 hover:border-white text-white font-body font-semibold text-sm uppercase tracking-widest px-9 py-4 transition-all duration-200 hover:bg-white/[0.06]"
            >
              Contáctanos
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
