import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildWhatsAppUrl } from '../../shared/company.js'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const isWeekend = (d) => d.getDay() === 5 || d.getDay() === 6

const timeSlotsFor = (d) => {
  const slots = []
  const last = isWeekend(d) ? 25 : 23
  for (let h = 11; h < last; h++) {
    const hh = h > 23 ? h - 24 : h
    const label = `${String(hh).padStart(2,'0')}:00 ${hh < 12 ? 'AM' : 'PM'}`
    slots.push(label)
  }
  return slots
}

const WA_ICON = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.524 5.855L.057 23.082a.75.75 0 0 0 .921.921l5.227-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.497-5.193-1.367l-.372-.215-3.853 1.081 1.081-3.853-.215-.372A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

/* ── Step 1: Fecha y hora ── */
function Step1({ date, time, onDate, onTime }) {
  const days = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1); return d
  })
  const slots = date ? timeSlotsFor(date) : []

  return (
    <div className="space-y-6">
      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-b-muted mb-3">Selecciona el día</p>
        <div className="grid grid-cols-5 gap-2">
          {days.map(d => {
            const active = date?.toDateString() === d.toDateString()
            return (
              <button
                key={d.toDateString()}
                onClick={() => { onDate(d); onTime(null) }}
                className={`flex flex-col items-center py-3 px-1 border transition-all duration-150 ${
                  active ? 'border-b-red/70 bg-b-red/10' : 'border-white/[0.1] hover:border-white/25 hover:bg-white/[0.03]'
                }`}
              >
                <span className={`font-body text-[10px] uppercase tracking-wide ${active ? 'text-b-red' : 'text-white/35'}`}>
                  {DAYS_ES[d.getDay()]}
                </span>
                <span className={`font-display text-2xl leading-none my-0.5 tracking-wide ${active ? 'text-white' : 'text-white/60'}`}>
                  {d.getDate()}
                </span>
                <span className={`font-body text-[10px] ${active ? 'text-white/50' : 'text-white/25'}`}>
                  {MONTHS_ES[d.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {date && (
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-b-muted mb-3">
            Selecciona la hora
            <span className="ml-2 text-white/25 normal-case tracking-normal font-normal">
              ({isWeekend(date) ? 'hasta 2:00 AM' : 'hasta 12:00 AM'})
            </span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {slots.map(t => (
              <button
                key={t}
                onClick={() => onTime(t)}
                className={`py-2.5 border font-body text-xs font-semibold tracking-wide transition-all duration-150 ${
                  time === t
                    ? 'border-b-red/70 bg-b-red/10 text-white'
                    : 'border-white/[0.1] text-white/40 hover:border-white/25 hover:text-white/80'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Step 2: Datos de contacto ── */
function Step2({ data, onChange }) {
  const fields = [
    { key: 'nombre',    label: 'Tu nombre',         placeholder: 'Ej. María García',   type: 'text',   span: 2 },
    { key: 'telefono',  label: 'WhatsApp / Teléfono',placeholder: '(809) 000-0000',     type: 'tel',    span: 2 },
    { key: 'personas',  label: 'N.° de personas',   placeholder: 'Ej. 4',              type: 'number', span: 1 },
    { key: 'ocasion',   label: 'Ocasión (opcional)', placeholder: 'Cumpleaños, cena…',  type: 'text',   span: 1 },
    { key: 'nota',      label: 'Nota adicional (opcional)', placeholder: 'Alergias, preferencias…', type: 'text', span: 2 },
  ]
  return (
    <div>
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-b-muted mb-4">Datos de la reserva</p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
            <label className="block font-body text-[10px] uppercase tracking-widest text-white/40 mb-1.5">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={data[f.key] || ''}
              onChange={e => onChange({ ...data, [f.key]: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-b-red/60 text-white font-body text-sm px-3 py-2.5 outline-none transition-colors duration-200 placeholder:text-white/20"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 3: Confirmación ── */
function Step3({ date, time, data, onConfirm }) {
  const dateStr = date
    ? `${DAYS_ES[date.getDay()]}, ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`
    : '—'

  const rows = [
    { label: 'Fecha',    value: dateStr },
    { label: 'Hora',     value: time || '—' },
    { label: 'Nombre',   value: data.nombre || '—' },
    { label: 'Teléfono', value: data.telefono || '—' },
    { label: 'Personas', value: data.personas || '—' },
    ...(data.ocasion ? [{ label: 'Ocasión', value: data.ocasion }] : []),
    ...(data.nota    ? [{ label: 'Nota',    value: data.nota    }] : []),
  ]

  return (
    <div className="space-y-4">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-b-muted">Resumen de tu reserva</p>
      <div className="space-y-0">
        {rows.map(r => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.06]">
            <span className="font-body text-[10px] uppercase tracking-widest text-white/35 flex-shrink-0">{r.label}</span>
            <span className="font-body text-sm text-white text-right">{r.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-between bg-b-red hover:bg-b-red-hover text-white font-body font-bold text-sm uppercase tracking-widest px-6 py-4 transition-colors duration-200 group mt-2"
      >
        <span>Confirmar por WhatsApp</span>
        {WA_ICON}
      </button>
    </div>
  )
}

/* ── Wizard container ── */
function ReservaWizard() {
  const [step,  setStep]  = useState(1)
  const [date,  setDate]  = useState(null)
  const [time,  setTime]  = useState(null)
  const [data,  setData]  = useState({})

  const canNext = () => {
    if (step === 1) return date && time
    if (step === 2) return data.nombre?.trim() && data.telefono?.trim() && data.personas?.trim()
    return false
  }

  const confirm = () => {
    const dateStr = `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`
    const msg = (
      `Hola, quisiera hacer una reserva en el Bar & Grill Benzan:\n` +
      `Fecha: ${dateStr}\n` +
      `Hora: ${time}\n` +
      `Nombre: ${data.nombre}\n` +
      `Teléfono: ${data.telefono}\n` +
      `Personas: ${data.personas}\n` +
      (data.ocasion ? `Ocasión: ${data.ocasion}\n` : '') +
      (data.nota    ? `Nota: ${data.nota}`          : '')
    )
    window.open(buildWhatsAppUrl(msg), '_blank', 'noopener,noreferrer')
  }

  const stepLabels = ['Fecha & Hora', 'Tus datos', 'Confirmar']

  return (
    <div className="bg-b-charcoal border border-white/[0.08] p-6 lg:p-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const n = i + 1
          const active  = step === n
          const done    = step > n
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${active || done ? '' : 'opacity-35'}`}>
                <div className={`w-5 h-5 flex items-center justify-center border text-[10px] font-bold font-body transition-colors duration-200 ${
                  done   ? 'bg-b-red border-b-red text-white'  :
                  active ? 'border-b-red text-b-red'           :
                           'border-white/20 text-white/40'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`font-body text-[11px] uppercase tracking-wider hidden sm:inline ${active ? 'text-white' : 'text-white/40'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${step > n ? 'bg-b-red/50' : 'bg-white/[0.08]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && <Step1 date={date} time={time} onDate={setDate} onTime={setTime} />}
          {step === 2 && <Step2 data={data} onChange={setData} />}
          {step === 3 && <Step3 date={date} time={time} data={data} onConfirm={confirm} />}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} className="font-body text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors">← Atrás</button>
            : <span />
          }
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="inline-flex items-center gap-2 bg-b-red hover:bg-b-red-hover disabled:opacity-30 disabled:cursor-not-allowed text-white font-body font-semibold text-xs uppercase tracking-widest px-6 py-3 transition-colors duration-200"
          >
            {step === 2 ? 'Revisar reserva' : 'Continuar'}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Gallery Carousel con Reservaciones encima ── */
const GALLERY = ['BAR3','BAR4','BAR5','BAR6','BAR7']

function GalleryCarousel() {
  const [[idx, dir], setPage] = useState([0, 0])
  const dragStart = useRef(null)

  const go = (newDir) => {
    setPage(([i]) => {
      const next = (i + newDir + GALLERY.length) % GALLERY.length
      return [next, newDir]
    })
  }

  const variants = {
    enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <section className="relative bg-b-black" style={{ minHeight: 'clamp(600px, 90vh, 960px)' }}>

      {/* ── Fondo: carrusel ── */}
      <div
        className="absolute inset-0 overflow-hidden select-none"
        onMouseDown={e => { dragStart.current = e.clientX }}
        onMouseUp={e => {
          if (dragStart.current === null) return
          const diff = dragStart.current - e.clientX
          if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
          dragStart.current = null
        }}
        onTouchStart={e => { dragStart.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (dragStart.current === null) return
          const diff = dragStart.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1)
          dragStart.current = null
        }}
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.img
            key={idx}
            src={`/images/${GALLERY[idx]}.jpeg`}
            alt=""
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Overlay oscuro sobre toda la foto */}
        <div className="absolute inset-0 bg-black/65" />
        {/* Gradiente negro arriba */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-b-black to-transparent" />
        {/* Gradiente negro abajo */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-b-black to-transparent" />
      </div>

      {/* ── Contenido encima ── */}
      <div className="relative z-10 flex flex-col justify-center section-pad" style={{ minHeight: 'clamp(600px, 90vh, 960px)' }}>
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div {...fade()}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-b-red" />
                <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Reservaciones</span>
              </div>
              <h2 className="font-heading font-800 text-[clamp(30px,3.8vw,52px)] text-white leading-tight tracking-tight mb-6">
                Una mesa para los que<br />
                <span className="text-white/35">saben disfrutar.</span>
              </h2>
              <p className="font-body text-white/55 text-base leading-relaxed mb-8">
                Reserva tu mesa en minutos y recibe confirmación directa por WhatsApp. Grupos de 6+ personas o eventos privados, con gusto te atendemos.
              </p>
              <div className="space-y-3">
                {[
                  { d: 'Domingo – Jueves', h: '11:00 AM – 12:00 AM' },
                  { d: 'Viernes – Sábado', h: '11:00 AM – 2:00 AM'  },
                ].map(r => (
                  <div key={r.d} className="flex items-center justify-between border-b border-white/[0.1] pb-3">
                    <span className="font-body text-sm text-white/50">{r.d}</span>
                    <span className="font-body text-sm text-white font-medium">{r.h}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fade(0.15)}>
              <ReservaWizard />
            </motion.div>
          </div>
        </div>

        {/* Controles carrusel — abajo centrado */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
          <button onClick={() => go(-1)} className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 border border-white/15 hover:border-white/35 text-white transition-all duration-200 backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-2">
            {GALLERY.map((_, i) => (
              <button key={i} onClick={() => setPage([i, i > idx ? 1 : -1])}
                className={`transition-all duration-300 rounded-full ${i === idx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
          <button onClick={() => go(1)} className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 border border-white/15 hover:border-white/35 text-white transition-all duration-200 backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════ */

export default function BarGrill() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-[72px]" style={{ height: 'clamp(580px, 80vh, 900px)' }}>
        <img
          src="/images/BAR.jpeg"
          alt="Benzan Bar & Grill"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-b-black/90 via-b-black/30 to-b-black/20" />

        <div className="absolute bottom-0 left-0 right-0 pb-16 lg:pb-24">
          <div className="container-pad">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-b-red" />
                <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Lifestyle · Benzan</span>
              </div>
              <h1 className="font-heading font-800 text-[clamp(56px,9vw,120px)] text-white leading-none tracking-tight">
                Bar & Grill
              </h1>
              <p className="font-body text-white/55 text-base mt-4 max-w-md leading-relaxed mb-6">
                Gastronomía de calidad, ambiente sofisticado y el calor dominicano en cada plato.
              </p>
              <div className="flex flex-wrap items-center gap-5 mb-8">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-b-red" />
                  <span className="font-body text-sm text-white/60">Dom – Jue &nbsp;·&nbsp; 11:00 AM – 12:00 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-b-red" />
                  <span className="font-body text-sm text-white/60">Vie – Sáb &nbsp;·&nbsp; 11:00 AM – 2:00 AM</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Editorial + foto ── */}
      <section className="bg-white section-pad border-t border-neutral-200">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fade()}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-b-red" />
                <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">La Experiencia</span>
              </div>
              <h2 className="font-heading font-800 text-[clamp(30px,3.8vw,52px)] text-neutral-900 leading-tight tracking-tight mb-6">
                Más que un restaurante.<br />
                <span className="text-neutral-400">Un estilo de vida.</span>
              </h2>
              <p className="font-body text-neutral-500 text-base leading-relaxed mb-5">
                El Bar & Grill Benzan nace de la idea de que el buen gusto no se limita a un solo espacio. Cortes premium a la parrilla, coctelería artesanal y café de especialidad en un ambiente que combina el minimalismo contemporáneo con la calidez del Caribe.
              </p>
              <p className="font-body text-neutral-500 text-base leading-relaxed">
                Mientras tu vehículo recibe el mejor trato en nuestro taller, tú puedes relajarte con una experiencia gastronómica que mereces.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
              style={{ height: 'clamp(320px, 50vh, 560px)' }}
            >
              <img src="/images/BAR2.jpeg" alt="Bar & Grill Benzan" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Galería carrusel + Reservaciones encima ── */}
      <GalleryCarousel />

      {/* ── Menú destacado ── */}
      <section className="bg-neutral-50 border-y border-neutral-200 section-pad">
        <div className="container-pad">
          <motion.div {...fade()} className="flex items-center gap-3 mb-12">
            <span className="w-8 h-px bg-b-red" />
            <h2 className="font-heading text-xl font-700 text-neutral-900 uppercase tracking-widest">Menú Destacado</h2>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { category: 'Parrilla', items: [
                { name: 'Churrasco Premium', desc: 'Corte de lomo fino a la brasa, chimichurri artesanal, papas rústicas', price: '$28' },
                { name: 'Costillas BBQ',     desc: 'Costillas de cerdo glaseadas lentamente, ensalada de col',             price: '$24' },
                { name: 'Tabla de Carnes',   desc: 'Selección de 3 cortes para compartir, vegetales a la parrilla',       price: '$52' },
              ]},
              { category: 'Coctelería', items: [
                { name: 'Mojito Benzan',      desc: 'Ron blanco, menta fresca, lima, soda, un toque de pimienta rosa',    price: '$12' },
                { name: 'Old Fashioned',      desc: 'Whisky bourbon, azúcar morena, bitters Angostura, piel de naranja',  price: '$14' },
                { name: 'Paloma Dominicana',  desc: 'Tequila, jugo de toronja natural, sal de guayabita',                 price: '$13' },
              ]},
              { category: 'Café & Postres', items: [
                { name: 'Café Origen RD',    desc: 'Granos de las montañas del Cibao, preparación en V60',               price: '$5'  },
                { name: 'Flan de Coco',      desc: 'Flan artesanal con crema de coco tostado y caramelo oscuro',         price: '$8'  },
                { name: 'Espresso Martini',  desc: 'Vodka, espresso, licor de café, espuma de vainilla',                 price: '$14' },
              ]},
            ].map((s, si) => (
              <motion.div key={s.category} {...fade(si * 0.1)}>
                <h3 className="font-heading font-700 text-sm text-neutral-900 uppercase tracking-widest mb-5 pb-3 border-b border-neutral-200">{s.category}</h3>
                <ul className="space-y-5">
                  {s.items.map(item => (
                    <li key={item.name}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-body text-neutral-900 text-sm font-medium mb-1">{item.name}</p>
                          <p className="font-body text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                        </div>
                        <span className="font-heading text-b-red font-700 text-sm flex-shrink-0">{item.price}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="font-body text-neutral-400 text-xs mt-10 text-center opacity-60">Menú completo disponible en el local. Precios en USD.</p>
        </div>
      </section>

    </>
  )
}
