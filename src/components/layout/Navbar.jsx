import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Inventario', path: '/inventario' },
  { label: 'Nosotros',   path: '/nosotros'   },
  { label: 'Contacto',   path: '/contacto'   },
]

const servicios = [
  {
    label: 'Taller',
    path: '/taller',
    desc: 'Servicio autorizado Toyota y multiservicio',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
  {
    label: 'Bar & Grill',
    path: '/bar-grill',
    desc: 'Gastronomía, coctelería y música en vivo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v2M10 2v2M14 2v2"/>
      </svg>
    ),
  },
  {
    label: 'Bomba de Gasolina',
    path: '/bomba-gasolina',
    desc: 'Estación Texaco · Abierta 24/7',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6a2 2 0 012-2h8a2 2 0 012 2v12H3V6zM15 8h1a2 2 0 012 2v5a1 1 0 001 1h0a1 1 0 001-1V9l-3-4"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 18v2M11 18v2M7 10h4"/>
      </svg>
    ),
  },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      <nav className="relative h-[72px] flex items-center justify-between px-6">

        {/* LEFT — LOGO */}
        <Link to="/" className="flex items-center">
          <img src="/images/logo benzan.png" alt="Benzan" className="h-14 w-auto object-contain" />
        </Link>

        {/* CENTER — NAV */}
        <ul className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">

          {/* Servicios dropdown */}
          <li ref={ref} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className={`flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors duration-200 ${open ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Servicios
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {open && (
              <div className="absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-72 bg-white border border-neutral-200 shadow-lg overflow-hidden">
                {/* Top accent */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-b-red to-transparent" />

                <div className="py-2">
                  {servicios.map((s) => (
                    <Link
                      key={s.path}
                      to={s.path}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors duration-150 group"
                    >
                      <div className="text-b-red/60 group-hover:text-b-red transition-colors duration-150 mt-0.5 flex-shrink-0">
                        {s.icon}
                      </div>
                      <div>
                        <p className="font-body text-neutral-900 text-sm font-medium mb-0.5">{s.label}</p>
                        <p className="font-body text-neutral-500 text-xs leading-snug">{s.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>

          {/* Regular links */}
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className="text-neutral-600 text-sm font-medium tracking-wide hover:text-neutral-900 transition-colors duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* RIGHT — ICONS */}
        <div className="flex items-center gap-5">
          <button className="text-neutral-500 hover:text-neutral-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
              <path d="M12 16v.01M12 12a2 2 0 1 0-2-2" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="text-neutral-500 hover:text-neutral-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
              <path d="M2 12h20M12 2c3 4 3 16 0 20M12 2c-3 4-3 16 0 20" strokeWidth="1.5"/>
            </svg>
          </button>
          <button className="text-neutral-500 hover:text-neutral-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" strokeWidth="1.5"/>
              <path d="M4 20c2-4 14-4 16 0" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
