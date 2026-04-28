import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COMPANY, buildEmailUrl, buildMapsEmbedUrl, buildPhoneUrl, buildWhatsAppUrl } from '../../shared/company.js'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

const SUBJECTS = [
  'Información de vehículo',
  'Solicitar cotización',
  'Agendar servicio de taller',
  'Reserva Bar & Grill',
  'Otro',
]

const INFO = [
  {
    label: 'Dirección',
    value: `${COMPANY.addressLine1}\n${COMPANY.city}, RD`,
  },
  {
    label: 'Teléfono',
    value: COMPANY.phoneDisplay,
    href: buildPhoneUrl(),
  },
  {
    label: 'Email',
    value: COMPANY.email,
    href: buildEmailUrl(),
  },
  {
    label: 'Lunes – Viernes',
    value: COMPANY.hours.weekdays,
  },
  {
    label: 'Sábados',
    value: COMPANY.hours.saturday,
  },
]

function Field({ label, children }) {
  return (
    <div className="relative group">
      <label className="block font-body text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-3">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-transparent border-b border-neutral-200 focus:border-neutral-900 text-neutral-900 font-body text-sm pb-3 outline-none transition-colors duration-300 placeholder:text-neutral-300"

export default function Contacto() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent]       = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const whatsappMessage = [
      `Hola, quiero contactar a ${COMPANY.name}.`,
      `Nombre: ${form.name}`,
      `Correo: ${form.email}`,
      form.phone ? `Teléfono: ${form.phone}` : null,
      form.subject ? `Asunto: ${form.subject}` : null,
      `Mensaje: ${form.message}`,
    ]
      .filter(Boolean)
      .join('\n')

    window.open(buildWhatsAppUrl(whatsappMessage), '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-white pt-[72px]">
        <div className="container-pad pt-20 pb-16 border-b border-neutral-200">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-b-red" />
              <span className="font-body text-xs font-semibold uppercase tracking-[0.28em] text-b-red">Hablemos</span>
            </div>
            <h1 className="font-heading font-800 text-[clamp(52px,8vw,112px)] text-neutral-900 leading-none tracking-tight">
              Contacto
            </h1>
            <p className="font-body text-neutral-400 text-base mt-4 max-w-md leading-relaxed">
              Estamos disponibles para responder tus preguntas, agendar una visita o simplemente conversar sobre el vehículo que buscas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Form + Info ── */}
      <section className="bg-white section-pad">
        <div className="container-pad">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-20 lg:gap-24">

            {/* Form */}
            <div>
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-10"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <Field label="Nombre completo *">
                        <input type="text" name="name" required value={form.name}
                          onChange={set('name')} placeholder="Juan Pérez"
                          className={inputCls} />
                      </Field>
                      <Field label="Teléfono">
                        <input type="tel" name="phone" value={form.phone}
                          onChange={set('phone')} placeholder="(809) 000-0000"
                          className={inputCls} />
                      </Field>
                    </div>

                    <Field label="Correo electrónico *">
                      <input type="email" name="email" required value={form.email}
                        onChange={set('email')} placeholder="correo@ejemplo.com"
                        className={inputCls} />
                    </Field>

                    <Field label="Asunto">
                      <div className="flex flex-wrap gap-2 pt-1">
                        {SUBJECTS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, subject: s }))}
                            className={`font-body text-xs px-4 py-2 border transition-all duration-200 ${
                              form.subject === s
                                ? 'border-b-red/60 bg-b-red/10 text-neutral-900'
                                : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Mensaje *">
                      <textarea name="message" required rows={4} value={form.message}
                        onChange={set('message')} placeholder="Cuéntanos en qué podemos ayudarte…"
                        className={`${inputCls} resize-none`} />
                    </Field>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-3 bg-b-red hover:bg-b-red-hover text-white font-body font-semibold text-sm uppercase tracking-widest px-10 py-4 transition-colors duration-200 group"
                      >
                        Enviar por WhatsApp
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-24"
                  >
                    <div className="w-12 h-px bg-b-red mb-10" />
                    <h3 className="font-heading font-800 text-[clamp(32px,4vw,52px)] text-neutral-900 leading-none tracking-tight mb-4">
                      Solicitud lista.
                    </h3>
                    <p className="font-body text-neutral-400 text-base max-w-sm leading-relaxed mb-10">
                      Abrimos WhatsApp con tu mensaje preparado para que un asesor te responda más rápido.
                    </p>
                    <button
                      onClick={() => { setSent(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }) }}
                      className="font-body text-sm text-neutral-400 hover:text-neutral-900 uppercase tracking-widest transition-colors"
                    >
                      ← Enviar otro mensaje
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info */}
            <motion.div {...fade(0.2)} className="lg:pt-2">

              {/* WhatsApp */}
              <a
                href={buildWhatsAppUrl(`Hola, quiero información sobre ${COMPANY.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-neutral-200 hover:border-[#25D366]/60 p-5 mb-10 transition-all duration-200 hover:bg-[#25D366]/[0.03] group"
              >
                <svg className="w-5 h-5 text-[#25D366] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-neutral-900 text-sm font-medium">WhatsApp</p>
                  <p className="font-body text-neutral-400 text-xs">Respuesta inmediata</p>
                </div>
                <svg className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>

              {/* Info rows */}
              <div className="space-y-0">
                {INFO.map((item, i) => (
                  <div key={item.label} className="flex items-start justify-between gap-6 py-5 border-b border-neutral-200">
                    <span className="font-body text-[11px] uppercase tracking-[0.18em] text-neutral-400 flex-shrink-0 pt-0.5">
                      {item.label}
                    </span>
                    {item.href ? (
                      <a href={item.href} className="font-body text-sm text-neutral-900 hover:text-b-red transition-colors text-right whitespace-pre-line">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-body text-sm text-neutral-900 text-right whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Mapa ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="h-[420px] lg:h-[520px] bg-neutral-100 relative overflow-hidden border-t border-neutral-200"
      >
        <iframe
          title="Benzan Auto Import"
          src={buildMapsEmbedUrl()}
          className="w-full h-full border-0 grayscale opacity-80"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-100/40 to-transparent" />

        {/* Pin label */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-sm px-6 py-3 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-b-red flex-shrink-0" />
          <span className="font-body text-sm text-neutral-900 whitespace-nowrap">{COMPANY.shortAddress}</span>
        </div>
      </motion.section>
    </>
  )
}
