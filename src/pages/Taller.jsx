import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COMPANY, buildPhoneUrl, buildWhatsAppUrl } from '../../shared/company.js'
import { procesoServicio, tallerServices } from '../data/services'

const iconMap = {
  wrench: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  zap: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  circle: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
    </svg>
  ),
}

const SERVICES = [
  { id: 'toyota',      icon: 'wrench',   title: 'Mantenimiento Toyota', sub: 'Servicio autorizado' },
  { id: 'multi',       icon: 'settings', title: 'Taller Multiservicio', sub: 'Todas las marcas' },
  { id: 'express',     icon: 'zap',      title: 'Servicio Express',     sub: 'Rápido y sin cita' },
  { id: 'neumaticos',  icon: 'circle',   title: 'Neumáticos & Llantas', sub: 'Centro especializado' },
]

const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','2:00 PM','3:00 PM','4:00 PM','5:00 PM']

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function getNextDays(n = 8) {
  const days = []
  const today = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDay() !== 0) days.push(d)
    if (days.length === 7) break
  }
  return days
}

const STEPS = [
  { n: 1, label: 'Servicio' },
  { n: 2, label: 'Fecha' },
  { n: 3, label: 'Vehículo' },
  { n: 4, label: 'Confirmación' },
]

/* ── Progress Bar ── */
function ProgressBar({ step }) {
  return (
    <div className="px-6 pt-6 pb-5">
      <div className="flex items-center justify-between relative">
        {/* connecting line */}
        <div className="absolute top-3.5 left-0 right-0 h-px bg-neutral-200" />
        <motion.div
          className="absolute top-3.5 left-0 h-px bg-b-red origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (step - 1) / (STEPS.length - 1) }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        />
        {STEPS.map(s => (
          <div key={s.n} className="flex flex-col items-center gap-2 relative z-10">
            <motion.div
              animate={{
                backgroundColor: s.n <= step ? '#D4001A' : '#ffffff',
                borderColor: s.n <= step ? '#D4001A' : '#d4d4d4',
                scale: s.n === step ? 1.15 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
            >
              {s.n < step ? (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`text-[10px] font-bold tabular-nums ${s.n === step ? 'text-white' : 'text-neutral-400'}`}>
                  {s.n}
                </span>
              )}
            </motion.div>
            <span className={`font-body text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
              s.n === step ? 'text-neutral-900' : s.n < step ? 'text-b-red' : 'text-neutral-400'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 1: Servicio ── */
function Step1({ value, onChange }) {
  return (
    <div>
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">
        ¿Qué tipo de servicio necesitas?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SERVICES.map(s => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`group text-left p-4 border transition-all duration-200 ${
              value === s.id
                ? 'border-b-red/70 bg-b-red/10'
                : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
            }`}
          >
            <div className={`mb-2.5 transition-colors duration-200 ${value === s.id ? 'text-b-red' : 'text-neutral-400 group-hover:text-neutral-700'}`}>
              {iconMap[s.icon]}
            </div>
            <p className={`font-body text-xs font-semibold leading-tight mb-0.5 transition-colors duration-200 ${value === s.id ? 'text-neutral-900' : 'text-neutral-700'}`}>
              {s.title}
            </p>
            <p className={`font-body text-[10px] transition-colors duration-200 ${value === s.id ? 'text-b-red' : 'text-neutral-400'}`}>
              {s.sub}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Step 2: Fecha & Hora ── */
function Step2({ date, time, onDate, onTime }) {
  const days = useMemo(() => getNextDays(), [])
  return (
    <div className="space-y-5">
      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Selecciona el día</p>
        <div className="grid grid-cols-4 gap-2">
          {days.map(d => {
            const key = d.toDateString()
            const active = date?.toDateString() === key
            return (
              <button
                key={key}
                onClick={() => onDate(d)}
                className={`flex flex-col items-center py-3 px-1 border transition-all duration-150 ${
                  active ? 'border-b-red/70 bg-b-red/10' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <span className={`font-body text-[10px] uppercase tracking-wide ${active ? 'text-b-red' : 'text-neutral-400'}`}>
                  {DAYS_ES[d.getDay()]}
                </span>
                <span className={`font-display text-2xl leading-none my-0.5 tracking-wide ${active ? 'text-neutral-900' : 'text-neutral-600'}`}>
                  {d.getDate()}
                </span>
                <span className={`font-body text-[10px] ${active ? 'text-neutral-500' : 'text-neutral-300'}`}>
                  {MONTHS_ES[d.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Selecciona la hora</p>
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map(t => (
            <button
              key={t}
              onClick={() => onTime(t)}
              className={`py-2.5 border font-body text-xs font-semibold tracking-wide transition-all duration-150 ${
                time === t
                  ? 'border-b-red/70 bg-b-red/10 text-neutral-900'
                  : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Step 3: Datos del vehículo ── */
function Step3({ data, onChange }) {
  const fields = [
    { key: 'nombre',   label: 'Tu nombre',        placeholder: 'Ej. Juan Pérez',         type: 'text' },
    { key: 'telefono', label: 'Teléfono / WhatsApp',placeholder: '(809) 000-0000',        type: 'tel'  },
    { key: 'marca',    label: 'Marca del vehículo',placeholder: 'Ej. Toyota',             type: 'text' },
    { key: 'modelo',   label: 'Modelo',            placeholder: 'Ej. Corolla Cross',      type: 'text' },
    { key: 'año',      label: 'Año',               placeholder: 'Ej. 2022',               type: 'text' },
    { key: 'placa',    label: 'Placa',             placeholder: 'Ej. A123456',            type: 'text' },
  ]
  return (
    <div>
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">
        Datos de contacto y vehículo
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.key === 'nombre' || f.key === 'telefono' ? 'col-span-2' : ''}>
            <label className="block font-body text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={data[f.key] || ''}
              onChange={e => onChange({ ...data, [f.key]: e.target.value })}
              className="w-full bg-white border border-neutral-200 focus:border-b-red/60 text-neutral-900 font-body text-sm px-3 py-2.5 outline-none transition-colors duration-200 placeholder:text-neutral-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 4: Confirmación ── */
function Step4({ service, date, time, vehicleData, onConfirm }) {
  const svc = SERVICES.find(s => s.id === service)
  const dateStr = date
    ? `${DAYS_ES[date.getDay()]}, ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`
    : '—'

  return (
    <div className="space-y-4">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Resumen de tu cita
      </p>

      <div className="space-y-2">
        {[
          { label: 'Servicio',  value: svc?.title ?? '—' },
          { label: 'Fecha',     value: dateStr },
          { label: 'Hora',      value: time || '—' },
          { label: 'Nombre',    value: vehicleData.nombre || '—' },
          { label: 'Teléfono',  value: vehicleData.telefono || '—' },
          { label: 'Vehículo',  value: [vehicleData.marca, vehicleData.modelo, vehicleData.año].filter(Boolean).join(' ') || '—' },
          { label: 'Placa',     value: vehicleData.placa || '—' },
        ].map(row => (
          <div key={row.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-neutral-200">
            <span className="font-body text-[10px] uppercase tracking-widest text-neutral-400 flex-shrink-0">{row.label}</span>
            <span className="font-body text-sm text-neutral-900 text-right">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-between bg-b-red hover:bg-b-red-hover text-white font-body font-bold text-sm uppercase tracking-widest px-6 py-4 transition-colors duration-200 group mt-2"
      >
        <span>Confirmar por WhatsApp</span>
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Booking Wizard ── */
function CitaWizard() {
  const [step, setStep]       = useState(1)
  const [service, setService] = useState(null)
  const [date, setDate]       = useState(null)
  const [time, setTime]       = useState(null)
  const [vehicleData, setVehicleData] = useState({})

  const canNext = () => {
    if (step === 1) return !!service
    if (step === 2) return !!date && !!time
    if (step === 3) return !!(vehicleData.nombre && vehicleData.telefono && vehicleData.marca)
    return true
  }

  const handleConfirm = () => {
    const svc = SERVICES.find(s => s.id === service)
    const dateStr = date ? `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]}` : ''
    const msg = (
      `Hola, quiero agendar una cita en el Taller Benzan.\n\n` +
      `Servicio: ${svc?.title}\n` +
      `Fecha: ${dateStr}\n` +
      `Hora: ${time}\n` +
      `Nombre: ${vehicleData.nombre || ''}\n` +
      `Teléfono: ${vehicleData.telefono || ''}\n` +
      `Vehículo: ${[vehicleData.marca, vehicleData.modelo, vehicleData.año].filter(Boolean).join(' ')}\n` +
      `Placa: ${vehicleData.placa || ''}`
    )
    window.open(buildWhatsAppUrl(msg), '_blank', 'noopener,noreferrer')
  }

  const variants = {
    enter:  { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -20 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-neutral-200"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-neutral-200">
        <span className="w-2 h-2 bg-b-red flex-shrink-0" />
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
          Agenda tu cita
        </p>
      </div>

      <ProgressBar step={step} />

      {/* Step content */}
      <div className="px-6 pb-5" style={{ minHeight: 280 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && <Step1 value={service} onChange={setService} />}
            {step === 2 && <Step2 date={date} time={time} onDate={setDate} onTime={setTime} />}
            {step === 3 && <Step3 data={vehicleData} onChange={setVehicleData} />}
            {step === 4 && (
              <Step4
                service={service} date={date} time={time}
                vehicleData={vehicleData} onConfirm={handleConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="font-body text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 disabled:opacity-0 disabled:pointer-events-none transition-colors duration-200"
          >
            ← Atrás
          </button>
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 bg-b-red hover:bg-b-red-hover disabled:opacity-30 disabled:cursor-not-allowed text-white font-body font-semibold text-xs uppercase tracking-widest px-6 py-3 transition-all duration-200"
          >
            {step === 3 ? 'Revisar cita' : 'Continuar'}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      )}
    </motion.div>
  )
}

/* ── Taller page ── */
export default function Taller() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-0 overflow-hidden bg-white">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(212, 0, 26, 0.06) 0%, transparent 60%)' }}
        />
        <div className="container-pad relative z-10 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-b-red" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-b-red">Centro de Servicio</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: copy */}
            <div className="lg:pt-4">
              <h1 className="font-heading font-800 text-[clamp(48px,7vw,96px)] text-neutral-900 leading-none tracking-tight mb-6">
                Taller<br />
                <span className="text-neutral-300">Benzan</span>
              </h1>
              <p className="font-body text-neutral-500 text-base leading-relaxed max-w-md mb-8">
                Técnicos certificados, tecnología de punta y el respaldo de una marca con más de 20 años de excelencia. Tu vehículo merece el mejor servicio.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  'Toyota dealer autorizado',
                  'Repuestos 100% originales',
                  'Garantía de 90 días en mano de obra',
                  'Lavado de cortesía incluido',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-4 h-4 border border-b-red/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-b-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="font-body text-sm text-neutral-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: booking wizard */}
            <CitaWizard />
          </div>
        </div>

        {/* Workshop image */}
        <div className="relative h-64 lg:h-80 overflow-hidden">
          <img
            src="/images/benzan.webp"
            alt="Taller Benzan"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-neutral-50" />
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-neutral-50 border-t border-neutral-200 section-pad">
        <div className="container-pad">
          <div className="flex items-center gap-3 mb-12">
            <span className="block w-8 h-px bg-b-red" />
            <h2 className="font-heading text-xl font-700 text-neutral-900 uppercase tracking-widest">Nuestros Servicios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tallerServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-white border border-neutral-200 hover:border-b-red/40 p-7 transition-colors duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 border border-b-red/30 group-hover:border-b-red flex items-center justify-center flex-shrink-0 text-b-red transition-colors duration-300">
                    {iconMap[service.icon]}
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-[10px] text-b-red uppercase tracking-widest mb-1">{service.subtitle}</p>
                    <h3 className="font-heading font-700 text-xl text-neutral-900 tracking-tight mb-2">{service.title}</h3>
                    <p className="font-body text-neutral-500 text-sm leading-relaxed mb-4">{service.description}</p>
                    <ul className="space-y-1.5">
                      {service.features.map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-b-red flex-shrink-0" />
                          <span className="font-body text-xs text-neutral-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="bg-white border-t border-neutral-200 section-pad">
        <div className="container-pad">
          <div className="flex items-center gap-3 mb-12">
            <span className="block w-8 h-px bg-b-red" />
            <h2 className="font-heading text-xl font-700 text-neutral-900 uppercase tracking-widest">Proceso de Servicio</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200">
            {procesoServicio.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white p-8 relative"
              >
                <p className="font-display text-7xl text-neutral-900/[0.04] leading-none absolute top-4 right-6">{step.step}</p>
                <p className="font-display text-3xl text-b-red tracking-wider mb-4">{step.step}</p>
                <h3 className="font-heading font-700 text-lg text-neutral-900 tracking-tight mb-2">{step.title}</h3>
                <p className="font-body text-neutral-500 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-50 border-t border-neutral-200 py-20">
        <div className="container-pad text-center">
          <p className="font-body text-neutral-400 text-sm uppercase tracking-widest mb-4">¿Prefieres llamarnos?</p>
          <h3 className="font-heading font-700 text-3xl text-neutral-900 tracking-tight mb-6">
            Estamos disponibles de lunes a sábado.
          </h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={buildWhatsAppUrl('Hola, quiero información sobre el taller Benzan')}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-b-red hover:bg-b-red-hover text-white font-body font-semibold text-sm uppercase tracking-widest px-8 py-4 transition-colors duration-200"
            >
              WhatsApp
            </a>
            <a
              href={buildPhoneUrl()}
              className="inline-flex items-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-900 font-body text-sm uppercase tracking-widest px-8 py-4 transition-all duration-200 hover:bg-neutral-100"
            >
              Llamar al {COMPANY.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
