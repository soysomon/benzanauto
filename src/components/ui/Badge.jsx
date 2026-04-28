export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
    red: 'bg-b-red text-white',
    outline: 'border border-neutral-300 text-neutral-700',
    success: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-body font-semibold uppercase tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
