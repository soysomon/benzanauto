import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Badge from './Badge'
import { buildWhatsAppUrl } from '../../../shared/company.js'

function SpecPill({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 bg-neutral-100 border border-neutral-200 text-[11px] font-body text-neutral-500 uppercase tracking-wider">
      {label}
    </span>
  )
}

export default function VehicleCard({ vehicle, index = 0 }) {
  const navigate = useNavigate()
  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`

  const goToDetails = () => {
    navigate(`/vehiculo/${vehicle.id}`)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      goToDetails()
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-neutral-200 hover:border-neutral-400 overflow-hidden transition-colors duration-300 cursor-pointer"
      onClick={goToDetails}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`Ver detalle de ${vehicleLabel}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10] bg-neutral-100">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <Badge variant={vehicle.status === 'Nuevo' ? 'red' : 'outline'}>
            {vehicle.status}
          </Badge>
          {vehicle.badge && (
            <Badge variant="default">{vehicle.badge}</Badge>
          )}
        </div>

        {/* Category */}
        <div className="absolute top-3 right-3">
          <Badge variant="default">{vehicle.category}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <p className="font-body text-xs text-neutral-400 uppercase tracking-widest mb-1">{vehicle.brand} · {vehicle.year}</p>
          <h3 className="font-heading text-2xl font-700 text-neutral-900 leading-none tracking-tight">{vehicle.model}</h3>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <SpecPill label={vehicle.transmission} />
          <SpecPill label={vehicle.fuel} />
          <SpecPill label={vehicle.traction} />
          {vehicle.mileage > 0 && (
            <SpecPill label={`${vehicle.mileage.toLocaleString()} km`} />
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-neutral-200">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-0.5">Precio</p>
            <p className="font-heading text-2xl font-700 text-neutral-900">{formatPrice(vehicle.price)}</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={buildWhatsAppUrl(`Hola, me interesa el ${vehicleLabel}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center w-9 h-9 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goToDetails()
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-b-red text-white text-xs font-body font-semibold uppercase tracking-widest px-4 py-2.5"
            >
              Ver detalle
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
