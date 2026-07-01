function PulseBar({ className }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-full bg-neutral-200 ${className}`} />
}

export function RouteLoader({ admin = false }) {
  if (admin) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Cargando panel administrativo.</span>
        <div className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <PulseBar className="mb-3 h-3 w-28 bg-neutral-200" />
            <PulseBar className="h-8 w-48 bg-neutral-200" />
          </div>
          <div className="mx-auto flex max-w-7xl gap-2 px-6 pb-4">
            {[0, 1, 2, 3].map((item) => (
              <PulseBar key={item} className="h-10 w-24 bg-neutral-200" />
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
              <PulseBar className="mb-5 h-10 w-56 bg-neutral-100" />
              <PulseBar className="mb-3 h-4 w-full bg-neutral-100" />
              <PulseBar className="mb-3 h-4 w-5/6 bg-neutral-100" />
              <PulseBar className="mb-8 h-4 w-2/3 bg-neutral-100" />
              <div className="grid gap-3 md:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-3xl bg-neutral-100" />
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
              <PulseBar className="mb-5 h-8 w-40 bg-neutral-100" />
              {[0, 1, 2, 3, 4].map((item) => (
                <PulseBar key={item} className="mb-4 h-12 w-full bg-neutral-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-pad min-h-[70vh] py-20" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando contenido principal.</span>
      <PulseBar className="mb-5 h-4 w-32" />
      <PulseBar className="mb-4 h-12 w-full max-w-xl" />
      <PulseBar className="mb-3 h-4 w-full max-w-2xl" />
      <PulseBar className="mb-10 h-4 w-full max-w-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[420px] animate-pulse rounded-[28px] bg-neutral-100" />
        <div className="h-[420px] animate-pulse rounded-[28px] bg-neutral-100" />
      </div>
    </div>
  )
}

export function SectionLoader({ heightClassName = 'min-h-[280px]' }) {
  return (
    <div className={`container-pad py-12 ${heightClassName}`} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando sección.</span>
      <PulseBar className="mb-4 h-4 w-36" />
      <PulseBar className="mb-3 h-10 w-full max-w-lg" />
      <PulseBar className="mb-8 h-4 w-full max-w-2xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-[28px] bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
