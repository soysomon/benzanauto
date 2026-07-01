export default function StatePanel({
  title,
  message,
  actionLabel,
  onAction,
  className = '',
  role = 'status',
  announcementMode = 'polite',
}) {
  return (
    <section
      role={role}
      aria-live={announcementMode}
      className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}
    >
      <h2 className="font-heading text-2xl tracking-tight text-[#0A0A0A] mb-2">{title}</h2>
      <p className="max-w-md font-body text-sm leading-relaxed text-[#666]">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center bg-[#0A0A0A] hover:bg-[#222] text-white font-body text-sm px-6 py-3 rounded-full transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </section>
  )
}
