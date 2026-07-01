import { Link, useLocation } from 'react-router-dom'
import SeoMeta from '../components/seo/SeoMeta'

export default function NotFoundPage() {
  const location = useLocation()
  const isAdminLikeRoute = location.pathname.startsWith('/admin')

  return (
    <div className={`min-h-screen ${isAdminLikeRoute ? 'bg-[#F7F7F7] pt-10' : 'bg-white pt-24'}`}>
      <SeoMeta
        title="Página no disponible"
        description="La ruta solicitada no existe o ya no está disponible."
        pathname={location.pathname}
        noIndex
      />

      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-16 lg:px-10">
        <p className="font-body text-[11px] uppercase tracking-[0.28em] text-[#C5C5C5]">
          Error 404
        </p>
        <h1 className="font-heading text-[42px] leading-none tracking-tight text-[#0A0A0A]">
          Página no disponible
        </h1>
        <p className="max-w-2xl font-body text-base leading-relaxed text-[#666]">
          La ruta que intentas abrir no existe, cambió de dirección o ya no está publicada.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={isAdminLikeRoute ? '/admin' : '/'}
            className="rounded-full bg-[#0A0A0A] px-6 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-[#222]"
          >
            {isAdminLikeRoute ? 'Volver al panel' : 'Volver al inicio'}
          </Link>
          {!isAdminLikeRoute ? (
            <Link
              to="/inventario"
              className="rounded-full border border-black/10 px-6 py-3 font-body text-sm font-medium text-[#0A0A0A] transition-colors hover:bg-[#F3F3F3]"
            >
              Ver inventario
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
