import { useEffect } from 'react'

const TONE_STYLES = {
  success: {
    wrapper: 'border-emerald-200 bg-white text-[#0A0A0A] shadow-[0_18px_45px_rgba(16,185,129,0.18)]',
    badge: 'bg-emerald-50 text-emerald-700',
    icon: 'text-emerald-600',
  },
  error: {
    wrapper: 'border-[#ffd6da] bg-white text-[#0A0A0A] shadow-[0_18px_45px_rgba(179,26,43,0.14)]',
    badge: 'bg-[#FFF2F3] text-[#b31a2b]',
    icon: 'text-[#b31a2b]',
  },
}

export default function FloatingToast({
  message,
  tone = 'success',
  onDismiss,
  durationMs = 4500,
}) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.success

  useEffect(() => {
    if (!message || !onDismiss || durationMs <= 0) return undefined

    const timeoutId = window.setTimeout(() => {
      onDismiss()
    }, durationMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [durationMs, message, onDismiss])

  if (!message) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 top-24 z-[90] flex justify-end sm:inset-x-6">
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[24px] border px-4 py-4 ${styles.wrapper}`}
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
      >
        <div className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full ${styles.badge}`}>
          <svg className={`h-4 w-4 ${styles.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {tone === 'error' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 8v5m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4.5 4.5L19 7" />
            )}
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-[11px] uppercase tracking-[0.26em] text-[#A5A5A5]">
            {tone === 'error' ? 'Atención' : 'Listo'}
          </p>
          <p className="mt-1 font-body text-sm leading-relaxed text-[#222]">
            {message}
          </p>
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar notificación"
            className="rounded-full border border-black/10 px-3 py-1.5 font-body text-xs text-[#555] transition-colors hover:bg-[#F6F6F6] hover:text-[#0A0A0A]"
          >
            Cerrar
          </button>
        ) : null}
      </div>
    </div>
  )
}
