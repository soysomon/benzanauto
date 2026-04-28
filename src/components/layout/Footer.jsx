import { Link } from 'react-router-dom'
import { COMPANY, buildEmailUrl, buildPhoneUrl, buildWhatsAppUrl } from '../../../shared/company.js'

const footerLinks = {
  Navegación: [
    { label: 'Inicio', path: '/' },
    { label: 'Inventario', path: '/inventario' },
    { label: 'Taller', path: '/taller' },
    { label: 'Bar & Grill', path: '/bar-grill' },
    { label: 'Sobre Nosotros', path: '/nosotros' },
    { label: 'Contacto', path: '/contacto' },
  ],
  Servicios: [
    { label: 'Venta de Vehículos', path: '/inventario' },
    { label: 'Servicio Toyota', path: '/taller' },
    { label: 'Taller Multiservicio', path: '/taller' },
    { label: 'Servicio Express', path: '/taller' },
    { label: 'Alineación y Balanceo', path: '/taller' },
    { label: 'Cotización Online', path: '/contacto' },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      {/* Top accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-b-red to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex mb-6 group">
              <img
                src="/images/logo benzan.png"
                alt="Benzan Auto Import"
                className="h-16 w-auto object-contain transition-opacity duration-200 group-hover:opacity-70"
              />
            </Link>

            <p className="font-body text-neutral-500 text-sm leading-relaxed mb-8 max-w-xs">
              Más de 20 años siendo la marca de confianza en el mercado automotriz dominicano. Venta, servicio y experiencia de clase mundial.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-b-red mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-body text-neutral-500 text-sm">{COMPANY.fullAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-b-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={buildPhoneUrl()} className="font-body text-neutral-500 text-sm hover:text-neutral-900 transition-colors">{COMPANY.phoneDisplay}</a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-b-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={buildEmailUrl()} className="font-body text-neutral-500 text-sm hover:text-neutral-900 transition-colors">{COMPANY.email}</a>
              </div>
            </div>
          </div>

          {/* Nav links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-heading text-neutral-900 text-lg font-600 tracking-wide mb-5">{group}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.path + link.label}>
                    <Link
                      to={link.path}
                      className="font-body text-neutral-500 text-sm hover:text-neutral-900 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="block w-0 group-hover:w-3 h-px bg-b-red transition-all duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Horarios strip */}
        <div className="border-t border-neutral-200 py-6 flex flex-wrap gap-6 lg:gap-12">
          <div>
            <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Lunes – Viernes</p>
            <p className="font-heading text-neutral-900 text-base font-600 tracking-wide">8:00 AM – 6:00 PM</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Sábados</p>
            <p className="font-heading text-neutral-900 text-base font-600 tracking-wide">8:00 AM – 3:00 PM</p>
          </div>
          <div>
            <p className="font-body text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Domingos</p>
            <p className="font-heading text-neutral-900 text-base font-600 tracking-wide">Cerrado</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 border border-neutral-200 flex items-center justify-center hover:border-b-red hover:bg-b-red/5 transition-all duration-200"
              aria-label="Instagram">
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 border border-neutral-200 flex items-center justify-center hover:border-b-red hover:bg-b-red/5 transition-all duration-200"
              aria-label="Facebook">
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 border border-neutral-200 flex items-center justify-center hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all duration-200"
              aria-label="WhatsApp"
            >
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-200 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-neutral-400 text-xs">
            © {year} Benzan Auto Import. Todos los derechos reservados.
          </p>
          <p className="font-body text-neutral-400 text-xs">
            República Dominicana
          </p>
        </div>
      </div>
    </footer>
  )
}
