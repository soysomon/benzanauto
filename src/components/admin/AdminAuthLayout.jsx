export default function AdminAuthLayout({
  eyebrow = 'Acceso admin',
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden lg:flex lg:w-[44%] bg-[#0A0A0A] flex-col justify-between p-14 relative overflow-hidden" aria-hidden="true">
        <p className="font-body text-[11px] uppercase tracking-[0.28em] text-white/25">
          Benzan Auto Import
        </p>

        <div>
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#d4001a] mb-5">
            {eyebrow}
          </p>
          <h1 className="font-heading text-[clamp(36px,3.8vw,58px)] leading-[0.92] tracking-[-0.03em] text-white">
            Seguridad.<br />Control.<br />Continuidad.
          </h1>
          <p className="font-body text-white/30 text-sm mt-7 leading-relaxed max-w-[300px]">
            Acceso administrativo con recuperación segura, sesiones controladas y gestión profesional de usuarios.
          </p>
        </div>

        <p className="font-body text-white/15 text-xs">
          {new Date().getFullYear()} · Panel administrativo
        </p>

        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full border border-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[280px] h-[280px] rounded-full border border-white/[0.06] pointer-events-none" />
        <div className="absolute bottom-32 right-16 w-3 h-3 rounded-full bg-[#d4001a]/60" />
      </aside>

      <section className="flex-1 flex items-center justify-center px-8 py-16" aria-labelledby="admin-auth-title">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#d4001a] mb-3">
              {eyebrow}
            </p>
            <h1 id="admin-auth-title" className="font-heading text-[32px] tracking-tight text-[#0A0A0A] leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="font-body text-sm text-[#777] mt-4 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>

          {children}

          {footer ? (
            <div className="mt-8 font-body text-sm text-[#777]">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
