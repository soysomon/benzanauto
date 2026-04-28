import { motion } from 'framer-motion'

const stats = [
  { value: '20+', label: 'Años en el mercado', desc: 'Desde 2004 siendo referencia automotriz en RD' },
  { value: '500+', label: 'Vehículos vendidos', desc: 'Familias y empresas que confían en nosotros' },
  { value: '8,500+', label: 'Servicios de taller', desc: 'Vehículos atendidos por nuestros técnicos' },
  { value: '98%', label: 'Satisfacción', desc: 'Clientes que nos recomiendan con confianza' },
]

export default function StatsSection() {
  return (
    <section className="bg-neutral-50 border-y border-neutral-200">
      <div className="container-pad py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-neutral-50 p-8 lg:p-10"
            >
              <p className="font-display text-[clamp(48px,5vw,72px)] text-neutral-900 tracking-widest leading-none mb-2">
                {stat.value}
              </p>
              <p className="font-heading text-sm font-600 text-neutral-900 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="font-body text-xs text-neutral-500 leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
