import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { prefetchRoute } from '../../lib/routeModules'

const navLinks = [
  { label: 'Inventario', path: '/inventario' },
  { label: 'Nosotros', path: '/nosotros' },
  { label: 'Contacto', path: '/contacto' },
]

const servicios = [
  {
    label: 'Taller',
    path: '/taller',
    desc: 'Servicio autorizado Toyota y multiservicio',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Bar & Grill',
    path: '/bar-grill',
    desc: 'Gastronomía, coctelería y música en vivo',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v2M10 2v2M14 2v2" />
      </svg>
    ),
  },
  {
    label: 'Bomba de Gasolina',
    path: '/bomba-gasolina',
    desc: 'Estación Texaco · Abierta 24/7',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6a2 2 0 012-2h8a2 2 0 012 2v12H3V6zM15 8h1a2 2 0 012 2v5a1 1 0 001 1h0a1 1 0 001-1V9l-3-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 18v2M11 18v2M7 10h4" />
      </svg>
    ),
  },
]

function Chevron({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function Navbar() {
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const headerRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const desktopMenuId = useId()
  const mobileMenuId = useId()
  const mobileServicesId = useId()

  useEffect(() => {
    setDesktopServicesOpen(false)
    setMobileMenuOpen(false)
    setMobileServicesOpen(false)
  }, [location])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setDesktopServicesOpen(false)
        setMobileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopServicesOpen(false)
        setMobileMenuOpen(false)
        setMobileServicesOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const warmRoute = (path) => {
    void prefetchRoute(path)
  }

  const openAdminLogin = () => {
    navigate('/admin-login')
  }

  return (
    <header ref={headerRef} className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-200 bg-white">
      <nav
        aria-label="Navegación principal"
        className="relative flex h-[72px] items-center justify-between px-4 sm:px-6"
      >
        <Link
          to="/"
          className="flex items-center"
          onMouseEnter={() => warmRoute('/')}
          onFocus={() => warmRoute('/')}
        >
          <img src="/images/logo benzan.png" alt="Benzan Auto Import" className="h-14 w-auto object-contain" />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <li className="relative">
            <button
              type="button"
              aria-expanded={desktopServicesOpen}
              aria-controls={desktopMenuId}
              aria-haspopup="true"
              onClick={() => setDesktopServicesOpen((value) => !value)}
              className={`flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors duration-200 ${
                desktopServicesOpen ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Servicios
              <Chevron open={desktopServicesOpen} />
            </button>

            {desktopServicesOpen ? (
              <div
                id={desktopMenuId}
                aria-label="Servicios Benzan"
                className="absolute left-1/2 top-[calc(100%+16px)] w-72 -translate-x-1/2 overflow-hidden border border-neutral-200 bg-white shadow-lg"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-b-red to-transparent" />
                <div className="py-2">
                  {servicios.map((service) => (
                    <Link
                      key={service.path}
                      to={service.path}
                      onMouseEnter={() => warmRoute(service.path)}
                      onFocus={() => warmRoute(service.path)}
                      className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-neutral-50"
                    >
                      <div className="mt-0.5 flex-shrink-0 text-b-red/60 transition-colors duration-150 group-hover:text-b-red">
                        {service.icon}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-neutral-900">{service.label}</p>
                        <p className="font-body text-xs leading-snug text-neutral-500">{service.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </li>

          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                onMouseEnter={() => warmRoute(link.path)}
                onFocus={() => warmRoute(link.path)}
                className="text-sm font-medium tracking-wide text-neutral-600 transition-colors duration-200 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/contacto"
            onMouseEnter={() => warmRoute('/contacto')}
            onFocus={() => warmRoute('/contacto')}
            aria-label="Ir a contacto"
            className="flex h-10 w-10 items-center justify-center text-neutral-500 transition hover:text-neutral-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path d="M12 16v.01M12 12a2 2 0 1 0-2-2" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>

          <span
            className="hidden h-10 items-center justify-center text-neutral-500 sm:inline-flex"
            aria-label="Operamos en República Dominicana"
            title="República Dominicana"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path d="M2 12h20M12 2c3 4 3 16 0 20M12 2c-3 4-3 16 0 20" strokeWidth="1.5" />
            </svg>
          </span>

          <button
            type="button"
            aria-label="Ir al acceso administrativo"
            onClick={openAdminLogin}
            onMouseEnter={() => warmRoute('/admin-login')}
            onFocus={() => warmRoute('/admin-login')}
            className="flex h-10 w-10 items-center justify-center text-neutral-500 transition hover:text-neutral-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
              <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.5" />
            </svg>
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center text-neutral-500 transition hover:text-neutral-900 md:hidden"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div
          id={mobileMenuId}
          className="border-t border-neutral-200 bg-white px-4 pb-4 pt-3 md:hidden"
        >
          <div className="space-y-2">
            <button
              type="button"
              aria-expanded={mobileServicesOpen}
              aria-controls={mobileServicesId}
              onClick={() => setMobileServicesOpen((value) => !value)}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-left font-body text-sm font-medium text-neutral-900"
            >
              <span>Servicios</span>
              <Chevron open={mobileServicesOpen} />
            </button>

            {mobileServicesOpen ? (
              <div id={mobileServicesId} className="space-y-2 px-1 pb-2">
                {servicios.map((service) => (
                  <Link
                    key={service.path}
                    to={service.path}
                    onMouseEnter={() => warmRoute(service.path)}
                    onFocus={() => warmRoute(service.path)}
                    className="block rounded-2xl border border-neutral-200 px-4 py-3"
                  >
                    <p className="font-body text-sm font-medium text-neutral-900">{service.label}</p>
                    <p className="mt-1 font-body text-xs leading-relaxed text-neutral-500">{service.desc}</p>
                  </Link>
                ))}
              </div>
            ) : null}

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onMouseEnter={() => warmRoute(link.path)}
                onFocus={() => warmRoute(link.path)}
                className="block rounded-2xl border border-neutral-200 px-4 py-3 font-body text-sm font-medium text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}
