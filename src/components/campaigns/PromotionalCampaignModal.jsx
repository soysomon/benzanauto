import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { getActivePromotionalCampaign } from '../../lib/publicApi'
import { prefetchRoute } from '../../lib/routeModules'

const STORAGE_PREFIX = 'benzan:campaign:v1'
const HOMEPAGE_ROUTE = '/'
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000

function getSafeStorage(type) {
  if (typeof window === 'undefined') return null

  try {
    return type === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function getStorageKey(id) {
  return `${STORAGE_PREFIX}:${id}`
}

function readCampaignDisplayState(id, frequencyRule) {
  const key = getStorageKey(id)

  try {
    if (frequencyRule === 'session') {
      const rawSessionValue = getSafeStorage('session')?.getItem(key)
      return rawSessionValue ? JSON.parse(rawSessionValue) : {}
    }

    if (['daily', 'once'].includes(frequencyRule)) {
      const rawPersistedValue = getSafeStorage('local')?.getItem(key)
      return rawPersistedValue ? JSON.parse(rawPersistedValue) : {}
    }

    return {}
  } catch {
    return {}
  }
}

function persistCampaignDisplayState(id, frequencyRule, reason = 'shown') {
  const now = Date.now()
  const key = getStorageKey(id)
  const nextState = { handledAt: now, reason }

  const storage = frequencyRule === 'session'
    ? getSafeStorage('session')
    : ['daily', 'once'].includes(frequencyRule)
      ? getSafeStorage('local')
      : null

  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(nextState))
  } catch {
    // noop
  }
}

function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function getCurrentDevice() {
  if (typeof window === 'undefined') return 'desktop'

  if (window.matchMedia('(max-width: 767px)').matches) {
    return 'mobile'
  }

  if (window.matchMedia('(max-width: 1199px)').matches) {
    return 'tablet'
  }

  return 'desktop'
}

function shouldShowCampaign(campaign) {
  if (!campaign?.id) return false

  const state = readCampaignDisplayState(campaign.id, campaign.frequencyRule)
  const lastHandledAt = Number(state?.handledAt ?? 0)

  switch (campaign.frequencyRule) {
    case 'once':
      return !lastHandledAt
    case 'daily':
      return !lastHandledAt || Date.now() - lastHandledAt >= DAILY_WINDOW_MS
    case 'session':
      return !lastHandledAt
    case 'always':
    default:
      return true
  }
}

function isInternalCta(url) {
  return typeof url === 'string' && url.startsWith('/')
}

function CloseButton({ onClick, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label="Cerrar promoción"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#0A0A0A] transition-colors hover:bg-white"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>
  )
}

export default function PromotionalCampaignModal() {
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const pathname = useMemo(() => normalizePathname(location.pathname), [location.pathname])
  const isHomepage = pathname === HOMEPAGE_ROUTE
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef(null)
  const timerRef = useRef(null)
  const [campaign, setCampaign] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setOpen(false)
    setCampaign(null)

    if (!isHomepage) {
      return () => {
        controller.abort()
        if (timerRef.current) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    const device = getCurrentDevice()

    async function loadCampaign() {
      try {
        const nextCampaign = await getActivePromotionalCampaign({
          route: HOMEPAGE_ROUTE,
          device,
        }, {
          signal: controller.signal,
        })

        if (!nextCampaign || !shouldShowCampaign(nextCampaign)) {
          return
        }

        setCampaign(nextCampaign)

        const delayMs = Math.max(0, Number(nextCampaign.delaySeconds ?? 0)) * 1000
        timerRef.current = window.setTimeout(() => {
          persistCampaignDisplayState(nextCampaign.id, nextCampaign.frequencyRule, 'shown')
          setOpen(true)
        }, delayMs)
      } catch {
        setCampaign(null)
      }
    }

    void loadCampaign()

    return () => {
      controller.abort()
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isHomepage, pathname])

  useEffect(() => {
    if (!campaign?.ctaUrl || !isInternalCta(campaign.ctaUrl)) return
    void prefetchRoute(campaign.ctaUrl)
  }, [campaign])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), reduceMotion ? 0 : 180)

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, reduceMotion])

  const dismiss = () => {
    if (campaign) {
      persistCampaignDisplayState(campaign.id, campaign.frequencyRule, 'dismissed')
    }
    setOpen(false)
  }

  if (!campaign) return null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[2px]"
          onClick={dismiss}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative grid w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-[1.08fr_0.92fr]"
          >
            <div className="relative min-h-[280px] bg-[#0A0A0A]">
              <img
                src={campaign.imageUrl}
                alt={campaign.imageAlt || campaign.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-6 top-6">
                <p className="font-body text-[11px] uppercase tracking-[0.3em] text-white/80">
                  Promoción activa
                </p>
              </div>
            </div>

            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#d4001a]">
                    Benzan Auto Import
                  </p>
                  <h2 id={titleId} className="mt-4 font-heading text-[34px] tracking-tight text-[#0A0A0A] md:text-[42px]">
                    {campaign.title}
                  </h2>
                </div>
                <CloseButton onClick={dismiss} buttonRef={closeButtonRef} />
              </div>

              <p id={descriptionId} className="mt-5 font-body text-base leading-relaxed text-[#555]">
                {campaign.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {campaign.ctaText && campaign.ctaUrl ? (
                  isInternalCta(campaign.ctaUrl) ? (
                    <Link
                      to={campaign.ctaUrl}
                      viewTransition
                      onClick={dismiss}
                      className="inline-flex items-center justify-center rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm text-white transition-colors hover:bg-[#222]"
                    >
                      {campaign.ctaText}
                    </Link>
                  ) : (
                    <a
                      href={campaign.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={dismiss}
                      className="inline-flex items-center justify-center rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm text-white transition-colors hover:bg-[#222]"
                    >
                      {campaign.ctaText}
                    </a>
                  )
                ) : null}

                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 font-body text-sm text-[#444] transition-colors hover:bg-[#F5F5F5]"
                >
                  Seguir navegando
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
