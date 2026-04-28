import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { sendMessage } from '../../lib/benzanAI'
import { COMPANY, buildWhatsAppUrl } from '../../../shared/company.js'

const SUGGESTIONS = [
  '¿Qué pickups tienen disponibles?',
  '¿Cuál es el vehículo más económico?',
  '¿Tienen vehículos híbridos?',
  'Busco un SUV familiar con 4x4',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-neutral-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

function VehicleResultCard({ vehicle, onClick }) {
  return (
    <Link
      to={`/vehiculo/${vehicle.id}`}
      onClick={onClick}
      className="flex items-center gap-3 border border-neutral-200 bg-white p-2.5 hover:border-neutral-900 transition-colors"
      style={{ borderRadius: 12 }}
    >
      <img
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className="w-20 h-16 object-cover flex-shrink-0"
        style={{ borderRadius: 10 }}
      />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1">
          {vehicle.brand} · {vehicle.year} · {vehicle.status}
        </p>
        <p className="font-body text-sm font-semibold text-neutral-900 leading-tight">
          {vehicle.model}
        </p>
        <p className="font-body text-xs text-neutral-500 mt-1">
          {vehicle.reason || `${vehicle.category} · ${vehicle.traction} · ${vehicle.fuel}`}
        </p>
        <p className="font-body text-sm font-semibold text-b-red mt-1.5">
          {formatPrice(vehicle.price)}
        </p>
      </div>
      <div className="flex-shrink-0 text-neutral-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function Message({ msg, onVehicleClick }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2zm-4 9a5 5 0 000 10h8a5 5 0 000-10H8z"/>
          </svg>
        </div>
      )}
      <div className={isUser ? 'max-w-[78%]' : 'max-w-[88%]'}>
        <div
          className={`px-4 py-2.5 text-sm font-body leading-relaxed ${
            isUser
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-900'
          }`}
          style={{ borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px' }}
        >
          <div className="whitespace-pre-line break-words">{msg.content}</div>
        </div>

        {!isUser && Array.isArray(msg.vehicles) && msg.vehicles.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.vehicles.map((vehicle) => (
              <VehicleResultCard
                key={vehicle.id}
                vehicle={vehicle}
                onClick={onVehicleClick}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ChatWidget() {
  const [open,      setOpen]      = useState(false)
  const [input,     setInput]     = useState('')
  const [messages,  setMessages]  = useState([])
  const [currentContext, setCurrentContext] = useState({})
  const [loading,   setLoading]   = useState(false)
  const [started,   setStarted]   = useState(false)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)

  /* scroll to bottom on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* focus input when chat opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
  }, [open])

  const openChat = () => {
    setOpen(true)
    if (!started) {
      setStarted(true)
      setCurrentContext({})
      /* welcome message */
      setMessages([{
        role: 'assistant',
        content: `¡Hola! Soy ${COMPANY.assistantName}, el asesor virtual de ${COMPANY.name}. Tengo acceso a todo nuestro inventario y puedo ayudarte a encontrar el vehículo ideal. ¿Qué estás buscando?`,
      }])
    }
  }

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg   = { role: 'user',      content: msg }
    const history   = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    const apiHistory = history.map(m => ({ role: m.role, content: m.content }))
    const result = await sendMessage({
      history: apiHistory,
      currentContext,
    })

    if (result.updatedContext) {
      setCurrentContext(result.updatedContext)
    }

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: result.text,
        vehicles: result.recommendedVehicles,
        intent: result.intent,
        provider: result.provider,
      },
    ])
    setLoading(false)
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* ── Floating bar (Tesla style) ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xl pointer-events-auto"
              style={{ borderRadius: 14, maxWidth: 740, width: '100%', padding: '6px 6px 6px 18px' }}
            >
              {/* Input trigger */}
              <button
                onClick={openChat}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="min-w-0">
                  <span className="font-body font-semibold text-sm text-neutral-900 mr-2">Preguntar al asesor IA</span>
                  <span className="font-body text-sm text-neutral-400 truncate hidden sm:inline">
                    "¿Qué pickup me recomiendas?"
                  </span>
                </div>
              </button>

              {/* CTA button */}
              <a
                href={buildWhatsAppUrl('Hola, me gustaría hablar con un asesor')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 bg-neutral-900 hover:bg-neutral-700 text-white font-body font-semibold text-xs uppercase tracking-widest px-4 py-2.5 transition-colors duration-200"
                style={{ borderRadius: 10 }}
                onMouseDown={e => e.stopPropagation()}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline">Hablar con asesor</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* panel */}
            <motion.div
              className="fixed bottom-4 left-1/2 z-50 bg-white shadow-2xl flex flex-col overflow-hidden"
              style={{ width: 'min(480px, calc(100vw - 32px))', height: 'min(620px, calc(100vh - 100px))', borderRadius: 18, x: '-50%' }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 flex-shrink-0">
                <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2zm-4 9a5 5 0 000 10h8a5 5 0 000-10H8z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-neutral-900">{COMPANY.assistantName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="font-body text-xs text-neutral-400">En línea · Responde al instante</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
                {messages.map((msg, i) => (
                  <Message
                    key={i}
                    msg={msg}
                    onVehicleClick={() => setOpen(false)}
                  />
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start mb-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2zm-4 9a5 5 0 000 10h8a5 5 0 000-10H8z"/>
                      </svg>
                    </div>
                    <div className="bg-neutral-100" style={{ borderRadius: '4px 14px 14px 14px' }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                {/* suggestions — only on first message */}
                {messages.length === 1 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-2 pt-2 pb-1"
                  >
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="font-body text-xs text-neutral-600 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 px-3 py-1.5 transition-colors duration-150"
                        style={{ borderRadius: 20 }}
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* input */}
              <div className="flex-shrink-0 border-t border-neutral-100 px-4 py-3">
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-4 py-2.5" style={{ borderRadius: 12 }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Escribe tu pregunta..."
                    disabled={loading}
                    className="flex-1 bg-transparent font-body text-sm text-neutral-900 placeholder-neutral-400 outline-none"
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 bg-neutral-900 hover:bg-neutral-700 disabled:bg-neutral-200 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
                    style={{ borderRadius: 8 }}
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <p className="font-body text-[10px] text-neutral-300 text-center mt-2">
                  Benzan AI 
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
