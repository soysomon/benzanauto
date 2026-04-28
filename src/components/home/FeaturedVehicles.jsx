import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { vehicles } from '../../data/vehicles'

const showcase = vehicles.slice(0, 4)

function VehicleCell({ vehicle, size = 'sm', index = 0 }) {
  const navigate = useNavigate()
  const titleSize =
    size === 'hero'
      ? 'text-[clamp(32px,4vw,56px)]'
      : size === 'md'
      ? 'text-[clamp(24px,2.5vw,38px)]'
      : 'text-[clamp(20px,1.8vw,28px)]'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/inventario`)}
      className="relative w-full h-full overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <img
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {/* Badge */}
      {vehicle.badge && (
        <div className="absolute top-4 left-4">
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white bg-b-red px-2.5 py-1">
            {vehicle.badge}
          </span>
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-1">
          {vehicle.brand} · {vehicle.year}
        </p>
        <h3 className={`font-heading font-700 text-white leading-none tracking-tight mb-1 ${titleSize}`}>
          {vehicle.model}
        </h3>
        <p className="font-body text-sm text-white/50">{vehicle.category}</p>

        {/* Price + CTA (visible on hover) */}
        <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <span className="font-display text-white tracking-wider text-lg">
            ${vehicle.price.toLocaleString()}
          </span>
          <span className="font-body text-[10px] uppercase tracking-widest text-white/60 flex items-center gap-1.5">
            Ver detalles
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function FeaturedVehicles() {
  const [activeTab, setActiveTab] = useState(null)

  const tabs = [
    { id: null,          label: 'Todos los modelos' },
    ...showcase.map(v => ({ id: v.id, label: v.model })),
  ]

  const handleTab = (tab) => {
    setActiveTab(tab.id)
    if (tab.id === null) {
      window.location.href = '/inventario'
    }
  }

  return (
    <section className="bg-white border-t border-neutral-200">
      {/* Section label */}
      <div className="container-pad pt-16 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="block w-8 h-px bg-b-red" />
          <span className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-b-red">
            Vehiculos Destacados
          </span>
        </div>
        <Link
          to="/inventario"
          className="font-body text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-widest transition-colors duration-200 flex items-center gap-1.5 group"
        >
          Ver todo
          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {/* Bento grid — desktop */}
      <div className="hidden lg:grid w-full" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '340px 260px', gap: '2px' }}>
        <div style={{ gridColumn: '1', gridRow: '1 / 3' }}>
          <VehicleCell vehicle={showcase[0]} size="hero" index={0} />
        </div>
        <div style={{ gridColumn: '2', gridRow: '1' }}>
          <VehicleCell vehicle={showcase[1]} size="md" index={1} />
        </div>
        <div style={{ gridColumn: '2', gridRow: '2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          <VehicleCell vehicle={showcase[2]} size="sm" index={2} />
          <VehicleCell vehicle={showcase[3]} size="sm" index={3} />
        </div>
      </div>

      {/* Grid — mobile/tablet */}
      <div className="lg:hidden grid grid-cols-2 gap-0.5">
        {showcase.map((v, i) => (
          <div key={v.id} className={`relative ${i === 0 ? 'col-span-2 h-64' : 'h-48'}`}>
            <VehicleCell vehicle={v} size={i === 0 ? 'md' : 'sm'} index={i} />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div
        className="w-full border-t border-neutral-200"
        style={{ background: '#f9f9f9' }}
      >
        <div className="container-pad">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className={`relative flex-shrink-0 font-body text-sm py-5 pr-8 transition-colors duration-200 whitespace-nowrap ${
                  i === 0 ? 'pr-10' : ''
                } ${
                  (activeTab === tab.id && tab.id !== null) || (tab.id === null && activeTab === null)
                    ? 'text-neutral-900 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {(activeTab === tab.id && tab.id !== null) || (tab.id === null && activeTab === null) ? (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-8 h-0.5 bg-b-red"
                  />
                ) : null}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
