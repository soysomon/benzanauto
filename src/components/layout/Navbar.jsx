import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { prefetchRoute } from '../../lib/routeModules'
import { COMPANY, buildMapsUrl, buildPhoneUrl, buildWhatsAppUrl } from '../../../shared/company.js'

function Chevron({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 7.5a5 5 0 01-6.6 4.73l-6.2 6.2a2.25 2.25 0 01-3.18-3.18l6.2-6.2A5 5 0 1118.5 3l-2.64 2.64a1.5 1.5 0 002.12 2.12L21 7.5z" />
    </svg>
  )
}

function GlassIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 3h10v3a5 5 0 01-5 5 5 5 0 01-5-5V3zM12 11v8M9 21h6" />
    </svg>
  )
}

function FuelIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6.5A2.5 2.5 0 016.5 4H13a2 2 0 012 2v14H4v-13.5zM15 8h2a2 2 0 012 2v4.5a1.5 1.5 0 003 0V9.5l-2.5-2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7.5 10H11" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 13l1.7-4.25A2 2 0 016.56 7.5h10.88a2 2 0 011.86 1.25L21 13v4a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7.5 13h9M7 17h.01M17 17h.01" />
    </svg>
  )
}

function PickupIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 14V9.5A1.5 1.5 0 014.5 8H13l2 2h3.5A2.5 2.5 0 0121 12.5V16a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 17h.01M17 17h.01" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 2L5 14h5l-1 8 8-12h-5l1-8z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l7 3v5c0 4.6-2.95 8.8-7 10-4.05-1.2-7-5.4-7-10V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.25 12.25l1.75 1.75L15 10" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 11a3 3 0 100-6 3 3 0 000 6zM17 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19a5 5 0 0110 0M14 19a4 4 0 018 0" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 8h10M7 12h7m-9 8l2.8-3H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h2v3z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.5 5.5A2.5 2.5 0 017 3h2.1a1 1 0 01.96.73l1.1 4.05a1 1 0 01-.44 1.12L8.94 10a13.35 13.35 0 005.06 5.06l1.1-1.79a1 1 0 011.13-.44l4.04 1.1a1 1 0 01.73.96V17a2.5 2.5 0 01-2.5 2.5H17C10.1 19.5 4.5 13.9 4.5 7V5.5z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21s6-5.33 6-11a6 6 0 10-12 0c0 5.67 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" strokeWidth={1.6} />
    </svg>
  )
}

const navigationSections = [
  {
    id: 'services',
    label: 'Servicios',
    path: '/taller',
    primaryCtaLabel: 'Explorar servicios',
    eyebrow: 'Experiencia Benzan',
    title: 'Servicio técnico, combustible y lifestyle en una sola experiencia.',
    description: 'Diseñado para que el cliente resuelva mantenimiento, pausa y movilidad desde un mismo ecosistema.',
    meta: 'Lun–Vie 8AM–6PM · Sáb 8AM–3PM',
    items: [
      {
        label: 'Taller Toyota',
        path: '/taller',
        description: 'Diagnóstico, mantenimiento, alineación, balanceo y servicio express.',
        icon: WrenchIcon,
      },
      {
        label: 'Bar & Grill',
        path: '/bar-grill',
        description: 'Gastronomía, coctelería y música en vivo mientras esperas.',
        icon: GlassIcon,
      },
      {
        label: 'Bomba Texaco',
        path: '/bomba-gasolina',
        description: 'Estación certificada con premium, diésel, GLP y conveniencia.',
        icon: FuelIcon,
      },
      {
        label: 'Solicitar cotización',
        path: '/contacto',
        description: 'Agenda una visita o pide apoyo personalizado del equipo.',
        icon: MessageIcon,
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    path: '/inventario',
    primaryCtaLabel: 'Ver inventario',
    eyebrow: 'Unidades publicadas',
    title: 'Vehículos reales, filtros claros y navegación rápida.',
    description: 'Explora el catálogo activo con atajos listos para abrir justo desde la navegación principal.',
    meta: 'SUV · Sedanes · Pickups · Publicado en tiempo real',
    items: [
      {
        label: 'Todo el inventario',
        path: '/inventario',
        description: 'Explora el catálogo completo con filtros por marca, categoría, combustible y precio.',
        icon: CarIcon,
      },
      {
        label: 'Vehículos nuevos',
        path: '/inventario?estado=Nuevo',
        description: 'Unidades recién publicadas listas para mostrarse en la web pública.',
        icon: SparkIcon,
      },
      {
        label: 'Vehículos usados',
        path: '/inventario?estado=Usado',
        description: 'Opciones revisadas para ciudad, familia o trabajo.',
        icon: ShieldIcon,
      },
      {
        label: 'Pickups disponibles',
        path: '/inventario?categoria=Pickup',
        description: 'Modelos pensados para carga, campo y operación diaria.',
        icon: PickupIcon,
      },
    ],
  },
  {
    id: 'about',
    label: 'Nosotros',
    path: '/nosotros',
    primaryCtaLabel: 'Conocer Benzan',
    eyebrow: 'Marca y trayectoria',
    title: 'Más de 20 años construyendo confianza en el Sur.',
    description: 'Conoce la historia, la visión y el estándar de servicio que sostiene cada experiencia del portal.',
    meta: '20+ años · Dealer regional · Atención personalizada',
    items: [
      {
        label: 'Nuestra historia',
        path: '/nosotros',
        description: 'Origen, visión y valores detrás de Benzan Auto Import.',
        icon: PeopleIcon,
      },
      {
        label: 'Vehículos recientes',
        path: '/inventario',
        description: 'Pasa de la historia a las unidades activas del catálogo.',
        icon: CarIcon,
      },
      {
        label: 'Hablar con un asesor',
        path: '/contacto',
        description: 'Recibe orientación personalizada para compra o servicio.',
        icon: MessageIcon,
      },
      {
        label: 'Experiencia Bar & Grill',
        path: '/bar-grill',
        description: 'Descubre el espacio lifestyle que acompaña la marca.',
        icon: GlassIcon,
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contacto',
    path: '/contacto',
    primaryCtaLabel: 'Abrir contacto',
    eyebrow: 'Respuesta rápida',
    title: 'Vías directas para venta, servicio y ubicación.',
    description: 'Elige el canal que más te convenga y sigue tu experiencia sin fricción.',
    meta: `${COMPANY.phoneDisplay} · ${COMPANY.city}, RD`,
    items: [
      {
        label: 'Formulario de contacto',
        path: '/contacto',
        description: 'Solicita cotización, información o una cita desde la web.',
        icon: MessageIcon,
      },
      {
        label: 'WhatsApp directo',
        href: buildWhatsAppUrl('Hola, necesito información sobre Benzan Auto Import.'),
        description: 'Abre una conversación inmediata con el equipo comercial.',
        icon: MessageIcon,
        external: true,
      },
      {
        label: 'Llamar ahora',
        href: buildPhoneUrl(),
        description: 'Contacta al dealer con un solo toque desde tu dispositivo.',
        icon: PhoneIcon,
      },
      {
        label: 'Cómo llegar',
        href: buildMapsUrl(),
        description: 'Abre la ubicación del showroom en Google Maps.',
        icon: MapPinIcon,
        external: true,
      },
    ],
  },
]

function resolveCurrentSection(pathname = '') {
  if (pathname.startsWith('/vehiculo/') || pathname.startsWith('/inventario')) return 'inventory'
  if (pathname.startsWith('/taller') || pathname.startsWith('/bar-grill') || pathname.startsWith('/bomba-gasolina')) return 'services'
  if (pathname.startsWith('/nosotros')) return 'about'
  if (pathname.startsWith('/contacto')) return 'contact'
  return null
}

function getPrefetchTarget(value = '') {
  if (!value) return ''
  return value.split('?')[0].split('#')[0]
}

function MegaMenuItem({ item, closeDesktopMenu, registerRef, warmRoute }) {
  const Icon = item.icon
  const sharedClassName = 'group flex h-full flex-col rounded-[24px] border border-neutral-200/80 bg-white/80 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-b-red/30'

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 transition-colors duration-200 group-hover:bg-neutral-900 group-hover:text-white">
          <Icon />
        </div>
        <span className="mt-1 text-neutral-400 transition-colors duration-200 group-hover:text-neutral-900">
          <ArrowIcon />
        </span>
      </div>
      <div className="mt-5">
        <p className="font-body text-sm font-semibold tracking-wide text-neutral-900">
          {item.label}
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-neutral-500">
          {item.description}
        </p>
      </div>
    </>
  )

  if (item.path) {
    return (
      <Link
        ref={registerRef}
        to={item.path}
        onClick={closeDesktopMenu}
        onMouseEnter={() => warmRoute(item.path)}
        onFocus={() => warmRoute(item.path)}
        className={sharedClassName}
      >
        {body}
      </Link>
    )
  }

  return (
    <a
      ref={registerRef}
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className={sharedClassName}
    >
      {body}
    </a>
  )
}

export default function Navbar() {
  const [openDesktopSectionId, setOpenDesktopSectionId] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileExpandedSectionId, setMobileExpandedSectionId] = useState(null)
  const headerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const firstItemRefs = useRef({})
  const location = useLocation()

  const currentSectionId = useMemo(
    () => resolveCurrentSection(location.pathname),
    [location.pathname],
  )

  const displayedDesktopSection = useMemo(() => {
    const sectionId = openDesktopSectionId || currentSectionId || 'services'
    return navigationSections.find((section) => section.id === sectionId) ?? navigationSections[0]
  }, [currentSectionId, openDesktopSectionId])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closeDesktopMenu = useCallback(() => {
    clearCloseTimer()
    setOpenDesktopSectionId(null)
  }, [clearCloseTimer])

  const scheduleDesktopClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDesktopSectionId(null)
    }, 120)
  }, [clearCloseTimer])

  const openDesktopMenu = useCallback((sectionId) => {
    clearCloseTimer()
    setOpenDesktopSectionId(sectionId)
  }, [clearCloseTimer])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  useEffect(() => {
    closeDesktopMenu()
    setMobileMenuOpen(false)
    setMobileExpandedSectionId(null)
  }, [closeDesktopMenu, location.pathname])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        closeDesktopMenu()
        setMobileMenuOpen(false)
      }
    }

    const handleFocusIn = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        closeDesktopMenu()
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeDesktopMenu()
        setMobileMenuOpen(false)
        setMobileExpandedSectionId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeDesktopMenu])

  const warmRoute = useCallback((path) => {
    const target = getPrefetchTarget(path)
    if (!target || target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:')) return
    void prefetchRoute(target)
  }, [])

  const focusFirstItem = useCallback((sectionId) => {
    window.requestAnimationFrame(() => {
      firstItemRefs.current[sectionId]?.focus()
    })
  }, [])

  const handleTopLevelKeyDown = useCallback((event, sectionId) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openDesktopMenu(sectionId)
      focusFirstItem(sectionId)
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeDesktopMenu()
    }
  }, [closeDesktopMenu, focusFirstItem, openDesktopMenu])

  const renderMobileItem = (item, index, section) => {
    const itemBody = (
      <>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
            <item.icon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-sm font-semibold text-neutral-900">{item.label}</span>
            <span className="mt-1 block font-body text-xs leading-relaxed text-neutral-500">{item.description}</span>
          </span>
          <span className="mt-1 text-neutral-400">
            <ArrowIcon />
          </span>
        </div>
      </>
    )

    if (item.path) {
      return (
        <Link
          key={`${section.id}-${item.label}-${index}`}
          to={item.path}
          onMouseEnter={() => warmRoute(item.path)}
          onFocus={() => warmRoute(item.path)}
          className="block rounded-[22px] border border-neutral-200 bg-white px-4 py-4"
        >
          {itemBody}
        </Link>
      )
    }

    return (
      <a
        key={`${section.id}-${item.label}-${index}`}
        href={item.href}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        className="block rounded-[22px] border border-neutral-200 bg-white px-4 py-4"
      >
        {itemBody}
      </a>
    )
  }

  return (
    <header
      ref={headerRef}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleDesktopClose}
      className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-200/90 bg-white/95 backdrop-blur-xl"
    >
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

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {navigationSections.map((section) => {
            const isOpen = openDesktopSectionId === section.id
            const isCurrent = currentSectionId === section.id

            return (
              <li key={section.id}>
                <Link
                  to={section.path}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={`mega-menu-${section.id}`}
                  onMouseEnter={() => {
                    warmRoute(section.path)
                    openDesktopMenu(section.id)
                  }}
                  onFocus={() => {
                    warmRoute(section.path)
                    openDesktopMenu(section.id)
                  }}
                  onKeyDown={(event) => handleTopLevelKeyDown(event, section.id)}
                  className={`relative inline-flex h-10 items-center rounded-full px-4 font-body text-sm font-medium tracking-wide transition-colors duration-200 ${
                    isOpen || isCurrent
                      ? 'text-neutral-950'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <span>{section.label}</span>
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-px origin-left bg-neutral-950 transition-transform duration-200 ${
                      isOpen || isCurrent ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/contacto"
            onMouseEnter={() => warmRoute('/contacto')}
            onFocus={() => warmRoute('/contacto')}
            aria-label="Ir a contacto"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path d="M12 16v.01M12 12a2 2 0 10-2-2" strokeWidth="1.5" strokeLinecap="round" />
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

          <Link
            to="/admin-login"
            aria-label="Ir al acceso administrativo"
            onMouseEnter={() => warmRoute('/admin-login')}
            onFocus={() => warmRoute('/admin-login')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
              <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.5" />
            </svg>
          </Link>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 md:hidden"
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

      <div className="absolute inset-x-0 top-full hidden md:block">
        <div
          id={`mega-menu-${displayedDesktopSection.id}`}
          aria-hidden={!openDesktopSectionId}
          className={`mx-auto mt-3 max-w-6xl px-4 transition-all duration-200 ease-out sm:px-6 lg:px-8 ${
            openDesktopSectionId
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-2 opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden rounded-[30px] border border-neutral-200/80 bg-white/95 shadow-[0_36px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="grid grid-cols-1 lg:grid-cols-[290px,1fr]">
              <div className="border-b border-neutral-200 bg-neutral-50/85 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.24em] text-b-red">
                  {displayedDesktopSection.eyebrow}
                </p>
                <h2 className="mt-4 font-heading text-[30px] font-800 leading-[1.02] tracking-tight text-neutral-950">
                  {displayedDesktopSection.title}
                </h2>
                <p className="mt-4 font-body text-sm leading-relaxed text-neutral-500">
                  {displayedDesktopSection.description}
                </p>
                <p className="mt-6 font-body text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                  {displayedDesktopSection.meta}
                </p>

                <Link
                  to={displayedDesktopSection.path}
                  onClick={closeDesktopMenu}
                  onMouseEnter={() => warmRoute(displayedDesktopSection.path)}
                  onFocus={() => warmRoute(displayedDesktopSection.path)}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-neutral-800"
                >
                  {displayedDesktopSection.primaryCtaLabel}
                  <ArrowIcon />
                </Link>
              </div>

              <div className="p-4 sm:p-5 lg:p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {displayedDesktopSection.items.map((item, index) => (
                    <MegaMenuItem
                      key={`${displayedDesktopSection.id}-${item.label}-${index}`}
                      item={item}
                      warmRoute={warmRoute}
                      closeDesktopMenu={closeDesktopMenu}
                      registerRef={index === 0 ? (node) => {
                        firstItemRefs.current[displayedDesktopSection.id] = node
                      } : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="mobile-site-menu"
        className={`overflow-hidden border-t border-neutral-200 bg-white transition-[max-height,opacity] duration-300 ease-out md:hidden ${
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-3 px-4 pb-5 pt-4">
          {navigationSections.map((section) => {
            const isExpanded = mobileExpandedSectionId === section.id

            return (
              <div key={section.id} className="rounded-[24px] border border-neutral-200 bg-neutral-50/70">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`mobile-section-${section.id}`}
                  onClick={() => {
                    setMobileExpandedSectionId((value) => (value === section.id ? null : section.id))
                    warmRoute(section.path)
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                >
                  <span>
                    <span className="block font-body text-sm font-semibold tracking-wide text-neutral-950">
                      {section.label}
                    </span>
                    <span className="mt-1 block font-body text-xs leading-relaxed text-neutral-500">
                      {section.description}
                    </span>
                  </span>
                  <span className="text-neutral-500">
                    <Chevron open={isExpanded} />
                  </span>
                </button>

                <div
                  id={`mobile-section-${section.id}`}
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-3 border-t border-neutral-200 px-4 pb-4 pt-3">
                      <Link
                        to={section.path}
                        onMouseEnter={() => warmRoute(section.path)}
                        onFocus={() => warmRoute(section.path)}
                        className="flex items-center justify-between rounded-[22px] bg-neutral-950 px-4 py-3 font-body text-sm font-semibold text-white"
                      >
                        <span>{section.primaryCtaLabel}</span>
                        <ArrowIcon />
                      </Link>

                      {section.items.map((item, index) => renderMobileItem(item, index, section))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
