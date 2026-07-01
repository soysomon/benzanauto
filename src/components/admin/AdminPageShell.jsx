import { NavLink } from 'react-router-dom'
import { prefetchRoute } from '../../lib/routeModules'
import AdminViewTransition from './AdminViewTransition'
import StatePanel from '../ui/StatePanel'

const NAV_LINKS = [
  { to: '/admin', label: 'Dashboard', superadminOnly: false },
  { to: '/admin/campaigns', label: 'Campañas', roles: ['superadmin', 'admin', 'editor'] },
  { to: '/admin/users', label: 'Usuarios', superadminOnly: true },
  { to: '/admin/audit', label: 'Auditoría', superadminOnly: true },
  { to: '/admin/security', label: 'Seguridad', superadminOnly: false },
]

function AdminNavLink({ to, label }) {
  return (
    <NavLink
      to={to}
      viewTransition
      onMouseEnter={() => { void prefetchRoute(to) }}
      onFocus={() => { void prefetchRoute(to) }}
      onTouchStart={() => { void prefetchRoute(to) }}
      className={({ isActive }) => [
        'px-4 py-2 rounded-full font-body text-sm transition-[background-color,color,transform] duration-200',
        isActive ? 'bg-[#0A0A0A] text-white' : 'text-[#666] hover:text-[#0A0A0A] hover:bg-[#F3F3F3]',
      ].join(' ')}
    >
      {label}
    </NavLink>
  )
}

export default function AdminPageShell({
  title,
  description,
  sessionState,
  children,
  actions = null,
  requireSuperadmin = false,
}) {
  const { user, loading, error, logout, isSuperadmin } = sessionState
  const headingId = 'admin-page-heading'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div aria-hidden="true" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E5E5] border-t-[#0A0A0A] animate-spin" />
          <p className="font-body text-sm text-[#777] mt-4">Verificando sesión administrativa...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (requireSuperadmin && !isSuperadmin) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] px-6 py-12">
        <div className="mx-auto max-w-4xl bg-white rounded-[32px] shadow-sm">
          <StatePanel
            title="Acceso restringido"
            message="Esta sección es exclusiva para super admins. Tu sesión sigue activa, pero no tiene permisos para ver esta vista."
            actionLabel="Volver al dashboard"
            onAction={() => window.location.assign('/admin')}
            className="py-20"
            role="alert"
            announcementMode="assertive"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#C5C5C5] mb-2">
              Panel seguro · {user.role}
            </p>
            <h1 id={headingId} className="font-heading text-[28px] tracking-tight text-[#0A0A0A]">
              {title}
            </h1>
            {description ? (
              <p className="font-body text-sm text-[#777] mt-2 max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-black/10 px-5 py-2.5 font-body text-sm text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-4 flex flex-wrap gap-2">
          {NAV_LINKS
            .filter((item) => !item.superadminOnly || isSuperadmin)
            .filter((item) => !item.roles || item.roles.includes(user.role))
            .map((item) => <AdminNavLink key={item.to} {...item} />)}
        </div>
      </header>

      <AdminViewTransition
        className="mx-auto max-w-7xl space-y-6 px-6 py-8"
        aria-labelledby={headingId}
      >
        {error ? (
          <div className="rounded-2xl border border-[#ffd6da] bg-[#FFF2F3] px-5 py-4 font-body text-sm text-[#b31a2b]" role="alert">
            {error}
          </div>
        ) : null}
        {children}
      </AdminViewTransition>
    </div>
  )
}
